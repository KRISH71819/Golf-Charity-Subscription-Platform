import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

/**
 * Verify JWT and attach `req.user` with { id, email, role }
 */
export function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const token = header.slice(7)
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = { id: payload.id, email: payload.email, role: payload.role || 'subscriber' }
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

/**
 * Require admin role — must be used AFTER authenticate
 */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

/**
 * Sign a JWT for a user
 */
export function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role || 'subscriber' },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}
