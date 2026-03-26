import jwt from 'jsonwebtoken'
import supabase from '../services/supabase.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

export function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const token = header.slice(7)
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role || 'subscriber',
      is_admin: Boolean(payload.is_admin),
    }
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export async function requireAdmin(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, role, is_admin')
      .eq('id', req.user.id)
      .single()

    if (error || !data?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    req.user.role = data.role || req.user.role
    req.user.is_admin = true
    next()
  } catch {
    return res.status(403).json({ error: 'Admin access required' })
  }
}

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || (user.is_admin ? 'admin' : 'subscriber'),
      is_admin: Boolean(user.is_admin),
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}
