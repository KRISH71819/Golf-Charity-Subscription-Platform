import { Router } from 'express'
import supabase from '../services/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { refreshUserHandicap } from '../services/handicap.js'

const router = Router()
const MAX_SCORES = 5

// GET /api/scores — get user's scores (last 5)
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', req.user.id)
      .order('played_at', { ascending: false })
      .limit(MAX_SCORES)

    if (error) throw error
    res.json(data || [])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/scores/my-scores — Alias for dashboard
router.get('/my-scores', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', req.user.id)
      .order('played_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/scores/stats — Calculate REAL stats from database
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.id
    const [
      { data: userProfile, error: userError },
      { data: scores, error: scoresError },
      { data: donations, error: donationsError },
      { data: leaderboard, error: leaderboardError },
    ] = await Promise.all([
      supabase.from('users').select('handicap').eq('id', userId).single(),
      supabase.from('scores').select('stableford_points').eq('user_id', userId),
      supabase.from('impact_log').select('amount').eq('user_id', userId),
      supabase.rpc('get_leaderboard', { limit_count: 100 }),
    ])

    for (const error of [userError, scoresError, donationsError, leaderboardError]) {
      if (error) throw error
    }

    const roundsPlayed = scores?.length || 0
    const totalDonated = (donations || []).reduce((sum, donation) => sum + Number(donation.amount || 0), 0)
    const avgScore = roundsPlayed
      ? Number((scores.reduce((sum, score) => sum + Number(score.stableford_points || 0), 0) / roundsPlayed).toFixed(1))
      : null
    const rankIndex = (leaderboard || []).findIndex((entry) => entry.user_id === userId)
    const rank = rankIndex >= 0 ? rankIndex + 1 : null

    res.json({
      handicap: userProfile?.handicap ?? null,
      avg_score: avgScore,
      rank,
      roundsPlayed: roundsPlayed,
      rounds_played: roundsPlayed,
      total_rounds: roundsPlayed,
      totalDonated: totalDonated,
      total_donated: totalDonated,
    })
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/scores — submit a new score (auto-replaces oldest if >5)
router.post('/', authenticate, async (req, res) => {
  try {
    const { stableford_points, played_at, course_name, notes } = req.body

    if (!stableford_points || stableford_points < 0 || stableford_points > 45) {
      return res.status(400).json({ error: 'Stableford points must be 0-45' })
    }

    // Check existing count
    const { data: existing } = await supabase
      .from('scores')
      .select('id, played_at')
      .eq('user_id', req.user.id)
      .order('played_at', { ascending: true })

    // If at max, delete the oldest
    if (existing && existing.length >= MAX_SCORES) {
      const oldestId = existing[0].id
      await supabase.from('scores').delete().eq('id', oldestId)
    }

    const { data, error } = await supabase
      .from('scores')
      .insert({
        user_id: req.user.id,
        stableford_points,
        played_at: played_at || new Date().toISOString(),
        course_name: course_name || '',
        notes: notes || '',
      })
      .select()
      .single()

    if (error) throw error
    const handicap = await refreshUserHandicap(req.user.id)
    res.status(201).json({ ...data, handicap })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/scores/:id — delete a specific score
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from('scores')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)

    if (error) throw error
    await refreshUserHandicap(req.user.id)
    res.json({ message: 'Score deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/scores/leaderboard — public leaderboard (top 20 avg scores)
router.get('/leaderboard', async (_req, res) => {
  try {
    const { data: leaderboard, error } = await supabase.rpc('get_leaderboard', { limit_count: 20 })

    if (error) {
      const { data: fallback } = await supabase
        .from('scores')
        .select('user_id, stableford_points, users(full_name, handicap)')
        .order('stableford_points', { ascending: false })
        .limit(20)

      return res.json((fallback || []).map((row, index) => ({
        user_id: row.user_id,
        full_name: row.users?.full_name || 'Member',
        avg_score: Number(row.stableford_points || 0),
        total_rounds: 1,
        handicap: row.users?.handicap ?? null,
        total_donated: 0,
        rank: index + 1,
      })))
    }

    const userIds = (leaderboard || []).map((row) => row.user_id).filter(Boolean)
    if (!userIds.length) {
      return res.json([])
    }

    const [{ data: users, error: usersError }, { data: donations, error: donationsError }] = await Promise.all([
      supabase.from('users').select('id, handicap').in('id', userIds),
      supabase.from('impact_log').select('user_id, amount').in('user_id', userIds),
    ])

    if (usersError) throw usersError
    if (donationsError) throw donationsError

    const handicapMap = new Map((users || []).map((user) => [user.id, user.handicap]))
    const donationMap = new Map()

    for (const row of donations || []) {
      donationMap.set(row.user_id, (donationMap.get(row.user_id) || 0) + Number(row.amount || 0))
    }

    res.json(
      (leaderboard || []).map((row, index) => ({
        ...row,
        handicap: handicapMap.get(row.user_id) ?? null,
        total_donated: donationMap.get(row.user_id) || 0,
        rank: index + 1,
      }))
    )
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
