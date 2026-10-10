import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/authenticate'
import { csrfProtection } from '../middleware/csrfProtection'
import { validateBody } from '../middleware/validateRequest'
import { investorProfileSchema, startupProfileSchema } from '../validators/profile.validator'
import * as profileController from '../controllers/profile.controller'

const router = Router()

router.use(authenticate)
router.get('/me', profileController.getMyProfile)
router.put(
  '/startup',
  requireRole('founder'),
  csrfProtection,
  validateBody(startupProfileSchema),
  profileController.saveStartupProfile,
)
router.put(
  '/investor',
  requireRole('investor'),
  csrfProtection,
  validateBody(investorProfileSchema),
  profileController.saveInvestorProfile,
)

export default router
