import { Router } from 'express'
import supabase from '../services/supabase.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()

// GET /api/charities — list all charities (public)
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query
    let query = supabase
      .from('charities')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: true })

    if (category) query = query.eq('category', category)
    if (search) query = query.ilike('name', `%${search}%`)

    const { data, error } = await query
    if (error) throw error
    res.json(data || [])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/charities/:id — single charity detail (public)
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('charities')
      .select('*')
      .eq('id', req.params.id)
      .eq('active', true)
      .single()

    if (error || !data) return res.status(404).json({ error: 'Charity not found' })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/charities — admin: create (protected)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description, category, mission, image_url, website } = req.body
    if (!name) return res.status(400).json({ error: 'Name is required' })

    const { data, error } = await supabase
      .from('charities')
      .insert({ name, description, category, mission, image_url, website, active: true })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/charities/:id — admin: update
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const allowed = ['name', 'description', 'category', 'mission', 'image_url', 'website', 'active']
    const updates = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    }

    const { data, error } = await supabase
      .from('charities')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/charities/:id — admin: soft-delete
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('charities')
      .update({ active: false })
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ message: 'Charity deactivated' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
