import { Router } from 'express'
import supabase from '../services/supabase.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { executeDraw, getActiveSeason } from '../services/drawEngine.js'

const router = Router()

// GET /api/draws/current — get active season info (public)
router.get('/current', async (_req, res) => {
  try {
    const season = await getActiveSeason()
    if (!season) return res.json({ message: 'No active draw season' })
    res.json(season)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/draws/results — past draw results (public)
router.get('/results', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('seasons')
      .select('id, name, drawn_numbers, prize_pool, completed_at')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(12)

    if (error) throw error
    res.json(data || [])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/draws/my-results — user's personal draw history
router.get('/my-results', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('draw_results')
      .select('*, seasons(name, drawn_numbers)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data || [])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/draws/execute/:seasonId — admin: trigger a draw
router.post('/execute/:seasonId', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await executeDraw(req.params.seasonId)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/draws/seasons — admin: create a new season
router.post('/seasons', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, prize_pool, draw_date } = req.body
    if (!name) return res.status(400).json({ error: 'Season name is required' })

    const { data, error } = await supabase
      .from('seasons')
      .insert({
        name,
        prize_pool: prize_pool || 0,
        draw_date: draw_date || null,
        status: 'active',
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
