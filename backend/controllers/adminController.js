import supabase from '../services/supabase.js'
import { refreshUserHandicap } from '../services/handicap.js'

const USER_SELECT = `
  id,
  email,
  full_name,
  avatar_url,
  handicap,
  home_course,
  role,
  is_admin,
  subscription_status,
  subscription_tier,
  selected_charity_id,
  created_at,
  updated_at
`

const CHARITY_SELECT = `
  id,
  name,
  slug,
  description,
  mission,
  impact_summary,
  icon,
  founded,
  logo_url,
  cover_url,
  media_gallery,
  category,
  website,
  total_raised,
  supporter_count,
  featured,
  active,
  theme_color,
  created_at,
  updated_at
`

const DRAW_SELECT = `
  id,
  title,
  draw_type,
  draw_date,
  prize_description,
  prize_value,
  charity_donation,
  selection_mode,
  winner_count,
  entry_window_start,
  entry_window_end,
  simulation_runs,
  simulation_snapshot,
  result_snapshot,
  status,
  notes,
  winner_user_id,
  winning_score_id,
  configured_by,
  published_at,
  created_at,
  updated_at
`

const SCORE_SELECT = `
  id,
  user_id,
  stableford_points,
  course_name,
  played_at,
  notes,
  created_at
`

const WINNER_SELECT = `
  id,
  draw_id,
  user_id,
  score_id,
  selected_charity_id,
  rank,
  payout_amount,
  payout_status,
  proof_status,
  proof_url,
  proof_uploaded_at,
  notes,
  charity_contribution,
  published_at,
  reviewed_at,
  reviewed_by,
  paid_at,
  created_at
`

const SUBSCRIPTION_STATUSES = ['active', 'inactive', 'past_due', 'cancelled', 'canceled', 'trialing']
const SUBSCRIPTION_TIERS = ['free', 'birdie', 'eagle', 'albatross']
const DRAW_MODES = ['random', 'algorithmic']
const WINNER_PROOF_STATUSES = ['pending', 'approved', 'rejected']
const WINNER_PAYOUT_STATUSES = ['pending', 'paid']

function handleError(res, error, fallback = 'Admin request failed') {
  console.error(error)
  res.status(error?.status || 500).json({ error: error?.message || fallback })
}

function badRequest(message) {
  const error = new Error(message)
  error.status = 400
  return error
}

function parseNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseInteger(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) ? parsed : fallback
}

function parseDate(value, fallback = null) {
  if (!value) return fallback
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString()
}

function startOfMonth(value) {
  const date = new Date(value)
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString()
}

function endOfMonth(value) {
  const date = new Date(value)
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999)).toISOString()
}

function formatDrawTitle(drawDate) {
  const date = new Date(drawDate)
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeMediaGallery(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map((item) => String(item).trim())
  }

  if (typeof value === 'string') {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function groupBy(items, key) {
  return items.reduce((acc, item) => {
    const bucket = item[key]
    if (!acc[bucket]) acc[bucket] = []
    acc[bucket].push(item)
    return acc
  }, {})
}

function mapById(items) {
  return new Map((items || []).map((item) => [item.id, item]))
}

function uniqueIds(items) {
  return [...new Set((items || []).filter(Boolean))]
}

function pickWeighted(items) {
  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0)
  let threshold = Math.random() * totalWeight

  for (const item of items) {
    threshold -= item.weight || 1
    if (threshold <= 0) {
      return item
    }
  }

  return items.at(-1) || null
}

function selectWinners(entrants, winnerCount, mode) {
  const remaining = entrants.map((entrant) => ({
    ...entrant,
    weight: mode === 'algorithmic' ? entrant.weight : 1,
  }))

  const winners = []
  const total = Math.min(winnerCount, remaining.length)

  while (winners.length < total && remaining.length > 0) {
    const selected = pickWeighted(remaining)
    winners.push(selected)

    const index = remaining.findIndex((entrant) => entrant.user_id === selected.user_id)
    if (index >= 0) remaining.splice(index, 1)
  }

  return winners
}

function sanitizeUserUpdate(body) {
  const updates = {}

  if (body.handicap !== undefined) updates.handicap = body.handicap === '' ? null : parseNumber(body.handicap, null)
  if (body.home_course !== undefined) updates.home_course = String(body.home_course).trim()
  if (body.selected_charity_id !== undefined) updates.selected_charity_id = body.selected_charity_id || null

  if (body.subscription_status !== undefined) {
    if (!SUBSCRIPTION_STATUSES.includes(body.subscription_status)) {
      throw badRequest('Invalid subscription status')
    }
    updates.subscription_status = body.subscription_status
  }

  if (body.subscription_tier !== undefined) {
    if (!SUBSCRIPTION_TIERS.includes(body.subscription_tier)) {
      throw badRequest('Invalid subscription tier')
    }
    updates.subscription_tier = body.subscription_tier
  }

  if (body.is_admin !== undefined) {
    updates.is_admin = Boolean(body.is_admin)
    updates.role = updates.is_admin ? 'admin' : 'subscriber'
  }

  return updates
}

function sanitizeScore(body, { requireStableford = true } = {}) {
  const score = {}

  if (body.stableford_points !== undefined) {
    const stableford = parseInteger(body.stableford_points, NaN)
    if (!Number.isInteger(stableford) || stableford < 0 || stableford > 45) {
      throw badRequest('Stableford points must be an integer between 0 and 45')
    }
    score.stableford_points = stableford
  } else if (requireStableford) {
    throw badRequest('Stableford points are required')
  }

  if (body.course_name !== undefined) score.course_name = String(body.course_name).trim()
  if (body.notes !== undefined) score.notes = String(body.notes).trim()
  if (body.played_at !== undefined) {
    const playedAt = parseDate(body.played_at)
    if (!playedAt) throw badRequest('Invalid played_at date')
    score.played_at = playedAt
  }

  return score
}

function sanitizeDraw(body) {
  const drawDate = parseDate(body.draw_date)
  if (!drawDate) throw badRequest('A valid draw date is required')

  const mode = body.selection_mode || 'random'
  if (!DRAW_MODES.includes(mode)) {
    throw badRequest('Selection mode must be random or algorithmic')
  }

  const winnerCount = Math.max(1, parseInteger(body.winner_count, 1))

  return {
    title: String(body.title || formatDrawTitle(drawDate)).trim(),
    draw_type: body.draw_type || 'monthly',
    draw_date: drawDate,
    prize_description: String(body.prize_description || '').trim(),
    prize_value: parseNumber(body.prize_value, 0),
    charity_donation: parseNumber(body.charity_donation, 0),
    selection_mode: mode,
    winner_count: winnerCount,
    entry_window_start: parseDate(body.entry_window_start, startOfMonth(drawDate)),
    entry_window_end: parseDate(body.entry_window_end, endOfMonth(drawDate)),
    notes: String(body.notes || '').trim(),
    status: body.status === 'cancelled' ? 'cancelled' : 'pending',
  }
}

async function ensureUniqueSlug(name, requestedSlug, currentId = null) {
  const base = slugify(requestedSlug || name)
  if (!base) throw badRequest('A valid charity name is required')

  let slug = base
  let suffix = 2

  while (true) {
    let query = supabase
      .from('charities')
      .select('id')
      .eq('slug', slug)
      .limit(1)

    if (currentId) {
      query = query.neq('id', currentId)
    }

    const { data, error } = await query
    if (error) throw error
    if (!data?.length) return slug

    slug = `${base}-${suffix}`
    suffix += 1
  }
}

function sanitizeCharity(body) {
  const updates = {}

  if (body.name !== undefined) updates.name = String(body.name).trim()
  if (body.description !== undefined) updates.description = String(body.description).trim()
  if (body.mission !== undefined) updates.mission = String(body.mission).trim()
  if (body.impact_summary !== undefined) updates.impact_summary = String(body.impact_summary).trim()
  if (body.icon !== undefined) updates.icon = String(body.icon).trim()
  if (body.founded !== undefined) updates.founded = String(body.founded).trim()
  if (body.logo_url !== undefined) updates.logo_url = String(body.logo_url).trim()
  if (body.cover_url !== undefined) updates.cover_url = String(body.cover_url).trim()
  if (body.website !== undefined) updates.website = String(body.website).trim()
  if (body.category !== undefined) updates.category = String(body.category).trim()
  if (body.theme_color !== undefined) updates.theme_color = String(body.theme_color).trim()
  if (body.total_raised !== undefined) updates.total_raised = parseNumber(body.total_raised, 0)
  if (body.supporter_count !== undefined) updates.supporter_count = Math.max(0, parseInteger(body.supporter_count, 0))
  if (body.featured !== undefined) updates.featured = Boolean(body.featured)
  if (body.active !== undefined) updates.active = Boolean(body.active)
  if (body.media_gallery !== undefined) updates.media_gallery = normalizeMediaGallery(body.media_gallery)

  return updates
}

async function fetchRecentScoresByUserIds(userIds) {
  if (!userIds.length) return {}

  const { data, error } = await supabase
    .from('scores')
    .select(SCORE_SELECT)
    .in('user_id', userIds)
    .order('played_at', { ascending: false })

  if (error) throw error

  const grouped = groupBy(data || [], 'user_id')
  for (const userId of Object.keys(grouped)) {
    grouped[userId] = grouped[userId].slice(0, 3)
  }
  return grouped
}

async function fetchDrawWindow(draw) {
  return {
    start: draw.entry_window_start || startOfMonth(draw.draw_date),
    end: draw.entry_window_end || endOfMonth(draw.draw_date),
  }
}

async function buildDrawEntrants(draw) {
  const window = await fetchDrawWindow(draw)

  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, email, full_name, subscription_status, selected_charity_id')
    .eq('subscription_status', 'active')

  if (userError) throw userError
  if (!users?.length) return { entrants: [], window }

  const userIds = users.map((user) => user.id)
  const { data: scores, error: scoreError } = await supabase
    .from('scores')
    .select(SCORE_SELECT)
    .in('user_id', userIds)
    .gte('played_at', window.start)
    .lte('played_at', window.end)
    .order('played_at', { ascending: false })

  if (scoreError) throw scoreError

  const scoresByUser = groupBy(scores || [], 'user_id')
  const entrants = users
    .map((user) => {
      const userScores = scoresByUser[user.id] || []
      if (!userScores.length) return null

      const avgScore = userScores.reduce((sum, score) => sum + score.stableford_points, 0) / userScores.length
      const bestScore = Math.max(...userScores.map((score) => score.stableford_points))
      const latestScore = userScores[0]
      const activityBonus = Math.min(userScores.length, 4)
      const performanceBonus = Math.round(avgScore / 5)
      const weight = Math.max(1, activityBonus + performanceBonus)

      return {
        user_id: user.id,
        email: user.email,
        full_name: user.full_name,
        selected_charity_id: user.selected_charity_id,
        scores: userScores,
        score_count: userScores.length,
        avg_score: Number(avgScore.toFixed(2)),
        best_score: bestScore,
        latest_score_id: latestScore.id,
        latest_score: latestScore.stableford_points,
        latest_played_at: latestScore.played_at,
        weight,
      }
    })
    .filter(Boolean)

  return { entrants, window }
}

function summarizeSimulation(draw, entrants, runCount) {
  const counts = new Map()

  for (let index = 0; index < runCount; index += 1) {
    const selected = selectWinners(entrants, draw.winner_count || 1, draw.selection_mode)
    for (const winner of selected) {
      counts.set(winner.user_id, (counts.get(winner.user_id) || 0) + 1)
    }
  }

  return [...counts.entries()]
    .map(([userId, appearances]) => {
      const entrant = entrants.find((item) => item.user_id === userId)
      return {
        user_id: userId,
        full_name: entrant?.full_name || 'Unknown user',
        email: entrant?.email || '',
        avg_score: entrant?.avg_score || 0,
        score_count: entrant?.score_count || 0,
        weight: entrant?.weight || 1,
        projected_win_rate: Number(((appearances / runCount) * 100).toFixed(1)),
      }
    })
    .sort((left, right) => right.projected_win_rate - left.projected_win_rate)
    .slice(0, 8)
    .map((entry, index) => ({
      ...entry,
      projected_rank: index + 1,
    }))
}

async function hydrateDraws(draws) {
  const drawIds = draws.map((draw) => draw.id)
  if (!drawIds.length) return []

  const { data: winners, error } = await supabase
    .from('winners')
    .select(WINNER_SELECT)
    .in('draw_id', drawIds)
    .order('rank', { ascending: true })

  if (error) throw error

  const winnersByDraw = groupBy(winners || [], 'draw_id')
  const userIds = uniqueIds((winners || []).map((winner) => winner.user_id))
  const { data: users, error: usersError } = userIds.length
    ? await supabase.from('users').select('id, full_name, email').in('id', userIds)
    : { data: [], error: null }

  if (usersError) throw usersError

  const userMap = mapById(users || [])

  return draws.map((draw) => ({
    ...draw,
    winners: (winnersByDraw[draw.id] || []).map((winner) => ({
      ...winner,
      user: userMap.get(winner.user_id) || null,
    })),
  }))
}

async function hydrateWinners(winners) {
  const userIds = uniqueIds(winners.map((winner) => winner.user_id))
  const drawIds = uniqueIds(winners.map((winner) => winner.draw_id))
  const scoreIds = uniqueIds(winners.map((winner) => winner.score_id))
  const charityIds = uniqueIds(winners.map((winner) => winner.selected_charity_id))
  const reviewerIds = uniqueIds(winners.map((winner) => winner.reviewed_by))

  const [usersResult, drawsResult, scoresResult, charitiesResult, reviewersResult] = await Promise.all([
    userIds.length ? supabase.from('users').select('id, full_name, email').in('id', userIds) : Promise.resolve({ data: [], error: null }),
    drawIds.length ? supabase.from('draws').select('id, title, draw_date, selection_mode, prize_value').in('id', drawIds) : Promise.resolve({ data: [], error: null }),
    scoreIds.length ? supabase.from('scores').select('id, stableford_points, course_name, played_at').in('id', scoreIds) : Promise.resolve({ data: [], error: null }),
    charityIds.length ? supabase.from('charities').select('id, name').in('id', charityIds) : Promise.resolve({ data: [], error: null }),
    reviewerIds.length ? supabase.from('users').select('id, full_name, email').in('id', reviewerIds) : Promise.resolve({ data: [], error: null }),
  ])

  for (const result of [usersResult, drawsResult, scoresResult, charitiesResult, reviewersResult]) {
    if (result.error) throw result.error
  }

  const userMap = mapById(usersResult.data || [])
  const drawMap = mapById(drawsResult.data || [])
  const scoreMap = mapById(scoresResult.data || [])
  const charityMap = mapById(charitiesResult.data || [])
  const reviewerMap = mapById(reviewersResult.data || [])

  return winners.map((winner) => ({
    ...winner,
    user: userMap.get(winner.user_id) || null,
    draw: drawMap.get(winner.draw_id) || null,
    score: scoreMap.get(winner.score_id) || null,
    charity: charityMap.get(winner.selected_charity_id) || null,
    reviewer: reviewerMap.get(winner.reviewed_by) || null,
  }))
}

export async function getAdminSession(req, res) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(USER_SELECT)
      .eq('id', req.user.id)
      .single()

    if (error || !data) {
      return res.status(404).json({ error: 'Admin user not found' })
    }

    res.json(data)
  } catch (error) {
    handleError(res, error)
  }
}

export async function getAnalytics(_req, res) {
  try {
    const [
      usersResult,
      activeSubscribersResult,
      drawsResult,
      winnersResult,
      charitiesResult,
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active'),
      supabase.from('draws').select('id, prize_value, charity_donation, status, draw_date, title'),
      supabase.from('winners').select(WINNER_SELECT).order('published_at', { ascending: false }).limit(6),
      supabase.from('charities').select('id', { count: 'exact', head: true }).eq('active', true),
    ])

    for (const result of [usersResult, activeSubscribersResult, drawsResult, winnersResult, charitiesResult]) {
      if (result.error) throw result.error
    }

    const drawRows = drawsResult.data || []
    const winnerRows = winnersResult.data || []
    const totalPrizePool = drawRows.reduce((sum, draw) => sum + Number(draw.prize_value || 0), 0)
    const totalCharityContributions = drawRows.reduce((sum, draw) => sum + Number(draw.charity_donation || 0), 0)
    const publishedDraws = drawRows.filter((draw) => draw.status === 'completed').length
    const pendingDraws = drawRows.filter((draw) => draw.status === 'pending').length
    const pendingProofs = winnerRows.filter((winner) => winner.proof_status === 'pending').length
    const paidWinners = winnerRows.filter((winner) => winner.payout_status === 'paid').length

    const hydratedWinners = await hydrateWinners(winnerRows)

    res.json({
      totalUsers: usersResult.count || 0,
      activeSubscribers: activeSubscribersResult.count || 0,
      totalPrizePool,
      totalCharityContributions,
      activeCharities: charitiesResult.count || 0,
      publishedDraws,
      pendingDraws,
      pendingProofs,
      paidWinners,
      recentWinners: hydratedWinners,
    })
  } catch (error) {
    handleError(res, error)
  }
}

export async function listUsers(req, res) {
  try {
    const page = Math.max(1, parseInteger(req.query.page, 1))
    const limit = Math.min(100, Math.max(1, parseInteger(req.query.limit, 25)))
    const search = String(req.query.search || '').trim()
    const status = String(req.query.status || '').trim()
    const offset = (page - 1) * limit

    let query = supabase
      .from('users')
      .select(USER_SELECT, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    if (status) {
      query = query.eq('subscription_status', status)
    }

    const { data, error, count } = await query
    if (error) throw error

    const recentScoresByUser = await fetchRecentScoresByUserIds((data || []).map((user) => user.id))

    res.json({
      users: (data || []).map((user) => ({
        ...user,
        recent_scores: recentScoresByUser[user.id] || [],
      })),
      total: count || 0,
      page,
      limit,
    })
  } catch (error) {
    handleError(res, error)
  }
}

export async function updateUser(req, res) {
  try {
    const updates = sanitizeUserUpdate(req.body)
    if (!Object.keys(updates).length) throw badRequest('No valid user fields provided')

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.params.id)
      .select(USER_SELECT)
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    handleError(res, error)
  }
}

export async function listUserScores(req, res) {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select(SCORE_SELECT)
      .eq('user_id', req.params.id)
      .order('played_at', { ascending: false })

    if (error) throw error
    res.json(data || [])
  } catch (error) {
    handleError(res, error)
  }
}

export async function createUserScore(req, res) {
  try {
    const payload = sanitizeScore(req.body)
    payload.user_id = req.params.id
    if (!payload.played_at) payload.played_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('scores')
      .insert(payload)
      .select(SCORE_SELECT)
      .single()

    if (error) throw error
    await refreshUserHandicap(req.params.id)
    res.status(201).json(data)
  } catch (error) {
    handleError(res, error)
  }
}

export async function updateScore(req, res) {
  try {
    const updates = sanitizeScore(req.body, { requireStableford: false })
    if (!Object.keys(updates).length) throw badRequest('No valid score fields provided')

    const { data: existingScore, error: existingError } = await supabase
      .from('scores')
      .select('user_id')
      .eq('id', req.params.id)
      .single()

    if (existingError) throw existingError

    const { data, error } = await supabase
      .from('scores')
      .update(updates)
      .eq('id', req.params.id)
      .select(SCORE_SELECT)
      .single()

    if (error) throw error
    await refreshUserHandicap(existingScore.user_id)
    res.json(data)
  } catch (error) {
    handleError(res, error)
  }
}

export async function deleteScore(req, res) {
  try {
    const { data: existingScore, error: existingError } = await supabase
      .from('scores')
      .select('user_id')
      .eq('id', req.params.id)
      .single()

    if (existingError) throw existingError

    const { error } = await supabase
      .from('scores')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    await refreshUserHandicap(existingScore.user_id)
    res.json({ message: 'Score deleted' })
  } catch (error) {
    handleError(res, error)
  }
}

export async function listDraws(_req, res) {
  try {
    const { data, error } = await supabase
      .from('draws')
      .select(DRAW_SELECT)
      .order('draw_date', { ascending: false })

    if (error) throw error
    const hydrated = await hydrateDraws(data || [])
    res.json(hydrated)
  } catch (error) {
    handleError(res, error)
  }
}

export async function createDraw(req, res) {
  try {
    const payload = sanitizeDraw(req.body)
    payload.configured_by = req.user.id

    const { data, error } = await supabase
      .from('draws')
      .insert(payload)
      .select(DRAW_SELECT)
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    handleError(res, error)
  }
}

export async function updateDraw(req, res) {
  try {
    const payload = sanitizeDraw(req.body)

    const { data, error } = await supabase
      .from('draws')
      .update(payload)
      .eq('id', req.params.id)
      .select(DRAW_SELECT)
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    handleError(res, error)
  }
}

export async function simulateDraw(req, res) {
  try {
    const runCount = Math.max(10, Math.min(1000, parseInteger(req.body.run_count, 250)))
    const { data: draw, error: drawError } = await supabase
      .from('draws')
      .select(DRAW_SELECT)
      .eq('id', req.params.id)
      .single()

    if (drawError) throw drawError

    const { entrants, window } = await buildDrawEntrants(draw)
    if (!entrants.length) {
      throw badRequest('No eligible active subscribers with scores were found for this draw window')
    }

    const previewWinners = selectWinners(entrants, draw.winner_count || 1, draw.selection_mode)
    const projectedLeaders = summarizeSimulation(draw, entrants, runCount)

    const snapshot = {
      generated_at: new Date().toISOString(),
      run_count: runCount,
      selection_mode: draw.selection_mode,
      eligibility_window: window,
      total_eligible_users: entrants.length,
      preview_winners: previewWinners.map((winner) => ({
        user_id: winner.user_id,
        full_name: winner.full_name,
        email: winner.email,
        avg_score: winner.avg_score,
        weight: winner.weight,
      })),
      projected_leaders: projectedLeaders,
    }

    const { error: updateError } = await supabase
      .from('draws')
      .update({
        simulation_runs: runCount,
        simulation_snapshot: snapshot,
      })
      .eq('id', req.params.id)

    if (updateError) throw updateError
    res.json(snapshot)
  } catch (error) {
    handleError(res, error)
  }
}

export async function publishDraw(req, res) {
  try {
    const { data: draw, error: drawError } = await supabase
      .from('draws')
      .select(DRAW_SELECT)
      .eq('id', req.params.id)
      .single()

    if (drawError) throw drawError
    if (draw.status === 'completed') {
      throw badRequest('This draw has already been published')
    }

    const { data: existingWinners, error: existingError } = await supabase
      .from('winners')
      .select('id')
      .eq('draw_id', draw.id)

    if (existingError) throw existingError
    if (existingWinners?.length) {
      throw badRequest('Winner records already exist for this draw')
    }

    const { entrants, window } = await buildDrawEntrants(draw)
    if (!entrants.length) {
      throw badRequest('No eligible active subscribers with scores were found for this draw window')
    }

    const selectedWinners = selectWinners(entrants, draw.winner_count || 1, draw.selection_mode)
    const publishedAt = new Date().toISOString()
    const payoutAmount = selectedWinners.length ? Number((Number(draw.prize_value || 0) / selectedWinners.length).toFixed(2)) : 0
    const charityContribution = selectedWinners.length ? Number((Number(draw.charity_donation || 0) / selectedWinners.length).toFixed(2)) : 0

    const winnerRows = selectedWinners.map((winner, index) => ({
      draw_id: draw.id,
      user_id: winner.user_id,
      score_id: winner.latest_score_id,
      selected_charity_id: winner.selected_charity_id,
      rank: index + 1,
      payout_amount: payoutAmount,
      payout_status: 'pending',
      proof_status: 'pending',
      charity_contribution: charityContribution,
      notes: '',
      published_at: publishedAt,
    }))

    const { data: insertedWinners, error: winnerError } = await supabase
      .from('winners')
      .insert(winnerRows)
      .select(WINNER_SELECT)

    if (winnerError) throw winnerError

    const resultSnapshot = {
      published_at: publishedAt,
      selection_mode: draw.selection_mode,
      eligibility_window: window,
      total_eligible_users: entrants.length,
      winners: insertedWinners.map((winner, index) => ({
        id: winner.id,
        user_id: winner.user_id,
        full_name: selectedWinners[index]?.full_name || '',
        email: selectedWinners[index]?.email || '',
        payout_amount: winner.payout_amount,
        charity_contribution: winner.charity_contribution,
      })),
    }

    const { error: updateError } = await supabase
      .from('draws')
      .update({
        status: 'completed',
        published_at: publishedAt,
        winner_user_id: insertedWinners[0]?.user_id || null,
        winning_score_id: insertedWinners[0]?.score_id || null,
        result_snapshot: resultSnapshot,
      })
      .eq('id', draw.id)

    if (updateError) throw updateError

    const hydrated = await hydrateWinners(insertedWinners)
    res.json({
      draw: {
        ...draw,
        status: 'completed',
        published_at: publishedAt,
        result_snapshot: resultSnapshot,
      },
      winners: hydrated,
    })
  } catch (error) {
    handleError(res, error)
  }
}

export async function listCharities(_req, res) {
  try {
    const { data, error } = await supabase
      .from('charities')
      .select(CHARITY_SELECT)
      .order('featured', { ascending: false })
      .order('name', { ascending: true })

    if (error) throw error
    res.json(data || [])
  } catch (error) {
    handleError(res, error)
  }
}

export async function createCharity(req, res) {
  try {
    const payload = sanitizeCharity(req.body)
    if (!payload.name) throw badRequest('Charity name is required')
    payload.slug = await ensureUniqueSlug(payload.name, req.body.slug)

    const { data, error } = await supabase
      .from('charities')
      .insert(payload)
      .select(CHARITY_SELECT)
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    handleError(res, error)
  }
}

export async function updateCharity(req, res) {
  try {
    const payload = sanitizeCharity(req.body)

    if (req.body.slug !== undefined || payload.name) {
      const nameSeed = payload.name || req.body.name || 'charity'
      payload.slug = await ensureUniqueSlug(nameSeed, req.body.slug || payload.name, req.params.id)
    }

    if (!Object.keys(payload).length) throw badRequest('No valid charity fields provided')

    const { data, error } = await supabase
      .from('charities')
      .update(payload)
      .eq('id', req.params.id)
      .select(CHARITY_SELECT)
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    handleError(res, error)
  }
}

export async function deleteCharity(req, res) {
  try {
    const [usersResult, subscriptionsResult, winnersResult] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('selected_charity_id', req.params.id),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('charity_id', req.params.id),
      supabase.from('winners').select('id', { count: 'exact', head: true }).eq('selected_charity_id', req.params.id),
    ])

    for (const result of [usersResult, subscriptionsResult, winnersResult]) {
      if (result.error) throw result.error
    }

    const referenceCount = (usersResult.count || 0) + (subscriptionsResult.count || 0) + (winnersResult.count || 0)

    if (referenceCount > 0) {
      const { error } = await supabase
        .from('charities')
        .update({ active: false })
        .eq('id', req.params.id)

      if (error) throw error
      return res.json({
        mode: 'deactivated',
        message: 'Charity is referenced by existing records and was deactivated instead of deleted.',
      })
    }

    const { error } = await supabase
      .from('charities')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ mode: 'deleted', message: 'Charity deleted' })
  } catch (error) {
    handleError(res, error)
  }
}

export async function listWinners(req, res) {
  try {
    const status = String(req.query.status || '').trim()

    let query = supabase
      .from('winners')
      .select(WINNER_SELECT)
      .order('published_at', { ascending: false })

    if (status) {
      query = query.eq('proof_status', status)
    }

    const { data, error } = await query
    if (error) throw error

    const hydrated = await hydrateWinners(data || [])
    res.json(hydrated)
  } catch (error) {
    handleError(res, error)
  }
}

export async function updateWinner(req, res) {
  try {
    const updates = {}

    if (req.body.proof_status !== undefined) {
      if (!WINNER_PROOF_STATUSES.includes(req.body.proof_status)) {
        throw badRequest('Invalid proof status')
      }
      updates.proof_status = req.body.proof_status
      updates.reviewed_at = new Date().toISOString()
      updates.reviewed_by = req.user.id
    }

    if (req.body.payout_status !== undefined) {
      if (!WINNER_PAYOUT_STATUSES.includes(req.body.payout_status)) {
        throw badRequest('Invalid payout status')
      }
      updates.payout_status = req.body.payout_status
      updates.paid_at = req.body.payout_status === 'paid' ? new Date().toISOString() : null
    }

    if (req.body.proof_url !== undefined) {
      updates.proof_url = String(req.body.proof_url).trim()
      updates.proof_uploaded_at = updates.proof_url ? new Date().toISOString() : null
    }

    if (req.body.notes !== undefined) {
      updates.notes = String(req.body.notes).trim()
    }

    if (!Object.keys(updates).length) throw badRequest('No valid winner fields provided')

    const { data, error } = await supabase
      .from('winners')
      .update(updates)
      .eq('id', req.params.id)
      .select(WINNER_SELECT)
      .single()

    if (error) throw error

    const [hydrated] = await hydrateWinners([data])
    res.json(hydrated)
  } catch (error) {
    handleError(res, error)
  }
}
