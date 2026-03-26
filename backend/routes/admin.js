import { Router } from 'express'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import {
  createCharity,
  createDraw,
  createUserScore,
  deleteCharity,
  deleteScore,
  getAdminSession,
  getAnalytics,
  listCharities,
  listDraws,
  listUserScores,
  listUsers,
  listWinners,
  publishDraw,
  simulateDraw,
  updateCharity,
  updateDraw,
  updateScore,
  updateUser,
  updateWinner,
} from '../controllers/adminController.js'

const router = Router()

router.use(authenticate, requireAdmin)

router.get('/session', getAdminSession)
router.get('/analytics', getAnalytics)

router.get('/users', listUsers)
router.patch('/users/:id', updateUser)
router.get('/users/:id/scores', listUserScores)
router.post('/users/:id/scores', createUserScore)
router.patch('/scores/:id', updateScore)
router.delete('/scores/:id', deleteScore)

router.get('/draws', listDraws)
router.post('/draws', createDraw)
router.patch('/draws/:id', updateDraw)
router.post('/draws/:id/simulate', simulateDraw)
router.post('/draws/:id/publish', publishDraw)

router.get('/charities', listCharities)
router.post('/charities', createCharity)
router.patch('/charities/:id', updateCharity)
router.delete('/charities/:id', deleteCharity)

router.get('/winners', listWinners)
router.patch('/winners/:id', updateWinner)

export default router
