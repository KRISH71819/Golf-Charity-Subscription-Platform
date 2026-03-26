import { Router } from 'express'
import supabase from '../services/supabase.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/me', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, handicap, home_course, role, is_admin, selected_charity_id, avatar_url, subscription_status, subscription_tier, created_at, updated_at')
      .eq('id', req.user.id)
      .single()

    if (error || !data) return res.status(404).json({ error: 'User not found' })

    let selectedCharity = null
    if (data.selected_charity_id) {
      const { data: charity } = await supabase
        .from('charities')
        .select('id, name')
        .eq('id', data.selected_charity_id)
        .single()
      selectedCharity = charity || null
    }

    res.json({ ...data, selected_charity: selectedCharity })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/me', authenticate, async (req, res) => {
  try {
    const allowed = ['full_name', 'handicap', 'home_course', 'selected_charity_id', 'avatar_url']
    const updates = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, email, full_name, handicap, home_course, role, is_admin, selected_charity_id, avatar_url, subscription_status, subscription_tier, updated_at')
      .single()

    if (error) throw error

    let selectedCharity = null
    if (data.selected_charity_id) {
      const { data: charity } = await supabase
        .from('charities')
        .select('id, name')
        .eq('id', data.selected_charity_id)
        .single()
      selectedCharity = charity || null
    }

    res.json({ ...data, selected_charity: selectedCharity })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/me/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.id

    const [
      { data: userProfile, error: userError },
      { data: scores, error: scoresError },
      { data: winnings, error: winnersError },
      { count: drawEntries, error: drawEntriesError },
      { data: donations, error: donationsError },
      { data: leaderboard, error: leaderboardError },
    ] = await Promise.all([
      supabase.from('users').select('handicap').eq('id', userId).single(),
      supabase.from('scores').select('stableford_points').eq('user_id', userId),
      supabase.from('winners').select('payout_amount').eq('user_id', userId),
      supabase.from('draw_entries').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('impact_log').select('amount').eq('user_id', userId),
      supabase.rpc('get_leaderboard', { limit_count: 100 }),
    ])

    for (const error of [userError, scoresError, winnersError, drawEntriesError, donationsError, leaderboardError]) {
      if (error) throw error
    }

    const totalScores = scores?.length || 0
    const totalWinnings = (winnings || []).reduce((sum, winner) => sum + Number(winner.payout_amount || 0), 0)
    const totalDonated = (donations || []).reduce((sum, donation) => sum + Number(donation.amount || 0), 0)
    const avgScore = totalScores
      ? Number((scores.reduce((sum, score) => sum + Number(score.stableford_points || 0), 0) / totalScores).toFixed(1))
      : null
    const rankIndex = (leaderboard || []).findIndex((entry) => entry.user_id === userId)
    const rank = rankIndex >= 0 ? rankIndex + 1 : null

    res.json({
      handicap: userProfile?.handicap ?? null,
      avg_score: avgScore,
      rank,
      total_rounds: totalScores,
      total_donated: totalDonated,
      totalWinnings,
      drawEntries: drawEntries || 0,
      totalScores,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/me/wins', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('winners')
      .select(`
        id,
        rank,
        payout_amount,
        payout_status,
        proof_status,
        charity_contribution,
        published_at,
        draw:draws (
          id,
          title,
          draw_date,
          prize_description
        ),
        charity:charities (
          id,
          name
        )
      `)
      .eq('user_id', req.user.id)
      .order('published_at', { ascending: false })

    if (error) throw error
    res.json(data || [])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
