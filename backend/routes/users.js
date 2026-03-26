import { Router } from 'express'
import supabase from '../services/supabase.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// GET /api/users/me — get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, handicap, role, charity_id, avatar_url, created_at')
      .eq('id', req.user.id)
      .single()

    if (error || !data) return res.status(404).json({ error: 'User not found' })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/users/me — update profile
router.patch('/me', authenticate, async (req, res) => {
  try {
    const allowed = ['full_name', 'handicap', 'charity_id', 'avatar_url']
    const updates = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, email, full_name, handicap, role, charity_id, avatar_url')
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/users/me/stats — dashboard stats
router.get('/me/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.id

    // Total scores
    const { count: totalScores } = await supabase
      .from('scores')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Total winnings
    const { data: winnings } = await supabase
      .from('draw_results')
      .select('prize_amount')
      .eq('user_id', userId)

    const totalWinnings = winnings?.reduce((sum, w) => sum + (w.prize_amount || 0), 0) || 0

    // Draw participation count
    const { count: drawEntries } = await supabase
      .from('draw_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    res.json({
      totalScores: totalScores || 0,
      totalWinnings,
      drawEntries: drawEntries || 0,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
