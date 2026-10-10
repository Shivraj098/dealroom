import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'
import { csrfProtection } from '../middleware/csrfProtection'
import { validateBody } from '../middleware/validateRequest'
import { registerSchema, loginSchema } from '../validators/auth.validator'
import * as authController from '../controllers/auth.controller'

const router = Router()

// GET /api/auth/csrf — issue CSRF token (no auth, no CSRF check — this endpoint initialises protection)
router.get('/csrf', authController.getCsrfToken)

// POST /api/auth/register — CSRF protected, body validated
router.post('/register', csrfProtection, validateBody(registerSchema), authController.register)

// POST /api/auth/login — CSRF protected, body validated
router.post('/login', csrfProtection, validateBody(loginSchema), authController.login)

// POST /api/auth/logout — CSRF protected, authentication required
router.post('/logout', authenticate, csrfProtection, authController.logout)

// GET /api/auth/me — authentication required
router.get('/me', authenticate, authController.getCurrentUser)

export default router
