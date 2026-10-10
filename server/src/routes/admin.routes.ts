import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/authenticate'
import { csrfProtection } from '../middleware/csrfProtection'
import { validateBody } from '../middleware/validateRequest'
import { updateStartupModerationSchema, updateUserSuspensionSchema } from '../validators/admin.validator'
import * as adminController from '../controllers/admin.controller'
import * as activityController from '../controllers/activity.controller'

const router = Router()
router.use(authenticate, requireRole('admin'))
router.get('/users', adminController.listUsers)
router.patch('/users/:userId/suspension', csrfProtection, validateBody(updateUserSuspensionSchema), adminController.suspendUser)
router.get('/startups', adminController.listStartups)
router.patch('/startups/:startupId/moderation', csrfProtection, validateBody(updateStartupModerationSchema), adminController.moderateStartup)
router.get('/activity', activityController.listAdmin)

export default router
