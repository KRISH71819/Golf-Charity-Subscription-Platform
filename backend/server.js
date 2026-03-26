import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import scoreRoutes from './routes/scores.js'
import charityRoutes from './routes/charities.js'
import subscriptionRoutes from './routes/subscriptions.js'
import drawRoutes from './routes/draws.js'
import adminRoutes from './routes/admin.js'
import uploadRoutes from './routes/uploads.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// --------------- Middleware ---------------
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

// Stripe webhooks need raw body — mount BEFORE json parser
app.use('/api/subscriptions/webhook', express.raw({ type: 'application/json' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Static uploads directory
app.use('/uploads', express.static(join(__dirname, 'uploads')))

// --------------- Routes ---------------
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/scores', scoreRoutes)
app.use('/api/charities', charityRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/draws', drawRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/uploads', uploadRoutes)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// --------------- Error handler ---------------
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  })
})

// --------------- Start ---------------
app.listen(PORT, () => {
  console.log(`✅ FairwayGives API running on http://localhost:${PORT}`)
})

export default app
