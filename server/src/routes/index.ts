import { Router } from 'express'
import authRoutes from './auth.routes'
import profileRoutes from './profile.routes'
import startupDiscoveryRoutes from './startupDiscovery.routes'
import connectionRoutes from './connection.routes'
import dealRoomRoutes from './dealRoom.routes'
import notificationRoutes from './notification.routes'
import activityRoutes from './activity.routes'
import adminRoutes from './admin.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/profiles', profileRoutes)
router.use('/startups', startupDiscoveryRoutes)
router.use('/connections', connectionRoutes)
router.use('/deal-rooms', dealRoomRoutes)
router.use('/notifications', notificationRoutes)
router.use('/activity', activityRoutes)
router.use('/admin', adminRoutes)

export default router
