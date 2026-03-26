import { Router } from 'express'
import supabase from '../services/supabase.js'
import { authenticate } from '../middleware/auth.js'

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
    // Fetch all scores for this user to calculate real stats
    const { data, error } = await supabase
      .from('scores')
      .select('stableford_points')
      .eq('user_id', req.user.id);

    if (error) throw error;

    const roundsPlayed = data ? data.length : 0;
    
    // As a placeholder for the UI, let's estimate $5 donated per round played
    const totalDonated = roundsPlayed * 5; 

    // Send multiple naming conventions just in case your frontend is picky
    res.json({
      roundsPlayed: roundsPlayed,
      rounds_played: roundsPlayed,
      total_rounds: roundsPlayed,
      totalDonated: totalDonated,
      total_donated: totalDonated
    });
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
    res.status(201).json(data)
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
    res.json({ message: 'Score deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/scores/leaderboard — public leaderboard (top 20 avg scores)
router.get('/leaderboard', async (_req, res) => {
  try {
    const { data, error } = await supabase.rpc('get_leaderboard', { limit_count: 20 })

    // Fallback if RPC doesn't exist yet
    if (error) {
      const { data: fallback } = await supabase
        .from('scores')
        .select('user_id, stableford_points, users(full_name)')
        .order('stableford_points', { ascending: false })
        .limit(20)

      return res.json(fallback || [])
    }

    res.json(data || [])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
