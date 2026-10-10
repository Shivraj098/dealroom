import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/authenticate'
import { csrfProtection } from '../middleware/csrfProtection'
import { validateBody } from '../middleware/validateRequest'
import * as connectionController from '../controllers/connection.controller'
import { createConnectionRequestSchema } from '../validators/connection.validator'

const router = Router()
router.use(authenticate)

router.get('/', requireRole('founder', 'investor'), connectionController.listRequests)
router.get('/startups/:startupId', requireRole('investor'), connectionController.getStartupStatus)
router.post(
  '/startups/:startupId',
  requireRole('investor'),
  csrfProtection,
  validateBody(createConnectionRequestSchema),
  connectionController.createRequest,
)
router.patch('/:requestId/accept', requireRole('founder'), csrfProtection, connectionController.acceptRequest)
router.patch('/:requestId/reject', requireRole('founder'), csrfProtection, connectionController.rejectRequest)

export default router
