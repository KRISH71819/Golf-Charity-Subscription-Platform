import { Router } from 'express'
import bcrypt from 'bcrypt'
import supabase from '../services/supabase.js'
import { signToken } from '../middleware/auth.js'

const router = Router()

router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, handicap } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single()

    if (existing) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: normalizedEmail,
        password_hash: passwordHash,
        full_name: full_name || '',
        handicap: handicap || null,
        role: 'subscriber',
        is_admin: false,
      })
      .select()
      .single()

    if (error) throw error

    const token = signToken(user)
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_admin: Boolean(user.is_admin),
        subscription_status: user.subscription_status,
        subscription_tier: user.subscription_tier,
      },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single()

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = signToken(user)
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_admin: Boolean(user.is_admin),
        subscription_status: user.subscription_status,
        subscription_tier: user.subscription_tier,
      },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/forgot-password', async (_req, res) => {
  try {
    res.json({ message: 'If that email exists, a reset link has been sent.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
