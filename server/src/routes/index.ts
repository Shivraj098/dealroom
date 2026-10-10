import { Router } from 'express'
import authRoutes from './auth.routes'
import profileRoutes from './profile.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/profiles', profileRoutes)

export default router
