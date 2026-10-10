import { Router } from 'express'
import authRoutes from './auth.routes'
import profileRoutes from './profile.routes'
import startupDiscoveryRoutes from './startupDiscovery.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/profiles', profileRoutes)
router.use('/startups', startupDiscoveryRoutes)

export default router
