import { Router } from 'express'
import supabase from '../services/supabase.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin)

// GET /api/admin/users — list all users
router.get('/users', async (req, res) => {
  try {
    const { search, status, page = 1, limit = 25 } = req.query
    const offset = (page - 1) * limit

    let query = supabase
      .from('users')
      .select('id, email, full_name, role, subscription_status, handicap, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    if (status) query = query.eq('subscription_status', status)

    const { data, error, count } = await query
    if (error) throw error
    res.json({ users: data || [], total: count || 0, page: +page, limit: +limit })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/admin/users/:id — update user (role, status)
router.patch('/users/:id', async (req, res) => {
  try {
    const allowed = ['role', 'subscription_status', 'full_name']
    const updates = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, email, full_name, role, subscription_status')
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/analytics — platform overview stats
router.get('/analytics', async (_req, res) => {
  try {
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    const { count: activeSubscribers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'active')

    const { count: totalScores } = await supabase
      .from('scores')
      .select('*', { count: 'exact', head: true })

    const { count: totalCharities } = await supabase
      .from('charities')
      .select('*', { count: 'exact', head: true })
      .eq('active', true)

    const { data: recentWinners } = await supabase
      .from('draw_results')
      .select('user_id, tier, prize_amount, created_at, users(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(5)

    res.json({
      totalUsers: totalUsers || 0,
      activeSubscribers: activeSubscribers || 0,
      totalScores: totalScores || 0,
      totalCharities: totalCharities || 0,
      recentWinners: recentWinners || [],
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/verifications — pending winner verifications
router.get('/verifications', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('verifications')
      .select('*, users(full_name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) throw error
    res.json(data || [])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/admin/verifications/:id — approve/reject verification
router.patch('/verifications/:id', async (req, res) => {
  try {
    const { status, admin_notes } = req.body
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' })
    }

    const { data, error } = await supabase
      .from('verifications')
      .update({
        status,
        admin_notes: admin_notes || '',
        reviewed_by: req.user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
