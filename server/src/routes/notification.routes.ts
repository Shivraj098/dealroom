import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'
import { csrfProtection } from '../middleware/csrfProtection'
import * as notificationController from '../controllers/notification.controller'

const router = Router()
router.use(authenticate)
router.get('/', notificationController.list)
router.get('/unread-count', notificationController.unreadCount)
router.patch('/read-all', csrfProtection, notificationController.markAllRead)
router.patch('/:notificationId/read', csrfProtection, notificationController.markRead)

export default router
