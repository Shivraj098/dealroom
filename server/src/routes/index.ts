import { Router } from 'express'
import authRoutes from './auth.routes'
import profileRoutes from './profile.routes'
import startupDiscoveryRoutes from './startupDiscovery.routes'
import connectionRoutes from './connection.routes'
import dealRoomRoutes from './dealRoom.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/profiles', profileRoutes)
router.use('/startups', startupDiscoveryRoutes)
router.use('/connections', connectionRoutes)
router.use('/deal-rooms', dealRoomRoutes)

export default router
