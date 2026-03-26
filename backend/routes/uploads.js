import { Router } from 'express'
import multer from 'multer'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { existsSync, mkdirSync } from 'fs'
import supabase from '../services/supabase.js'
import { authenticate } from '../middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const uploadDir = join(__dirname, '..', 'uploads')

// Ensure uploads directory exists
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`
    cb(null, `${unique}${extname(file.originalname)}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.pdf']
    const ext = extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) return cb(null, true)
    cb(new Error('Only JPG, PNG, WebP, and PDF files are allowed'))
  },
})

const router = Router()

// POST /api/uploads/verification — upload scorecard proof
router.post('/verification', authenticate, upload.single('scorecard'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const fileUrl = `/uploads/${req.file.filename}`

    const { data, error } = await supabase
      .from('verifications')
      .insert({
        user_id: req.user.id,
        file_url: fileUrl,
        file_name: req.file.originalname,
        status: 'pending',
        notes: req.body.notes || '',
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/uploads/my-verifications — user's verification history
router.get('/my-verifications', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('verifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data || [])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
