import { Request, Response, NextFunction } from 'express'
import * as authService from '../services/auth.service'
import { generateCsrfToken } from '../utils/csrf'
import { setAuthCookie, clearAuthCookie, setCsrfCookie, clearCsrfCookie } from '../utils/cookies'
import { UnauthorizedError } from '../utils/errors'

/**
 * GET /api/auth/csrf
 * Issues a fresh signed CSRF token in a readable cookie.
 * Must be called before any state-changing auth request.
 */
export async function getCsrfToken(req: Request, res: Response, next: NextFunction) {
  try {
    const token = generateCsrfToken()
    setCsrfCookie(res, token)
    res.json({ success: true, data: { csrfToken: token } })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/auth/register
 * Body: { name, email, password, role: 'founder' | 'investor' }
 */
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { user, token } = await authService.registerUser(req.body)
    setAuthCookie(res, token)
    // Refresh CSRF token after login so the old pre-auth token is no longer valid
    setCsrfCookie(res, generateCsrfToken())
    res.status(201).json({ success: true, data: { user } })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { user, token } = await authService.loginUser(req.body)
    setAuthCookie(res, token)
    setCsrfCookie(res, generateCsrfToken())
    res.json({ success: true, data: { user } })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/auth/logout
 * Clears authentication and CSRF cookies.
 */
export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    clearAuthCookie(res)
    clearCsrfCookie(res)
    res.json({ success: true, data: { message: 'Logged out successfully' } })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/auth/me
 * Returns the current authenticated user.
 */
export async function getCurrentUser(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'))
    }

    const user = await authService.getUserById(req.user.id)
    if (!user) {
      return next(new UnauthorizedError('Account not found'))
    }

    res.json({ success: true, data: { user } })
  } catch (err) {
    next(err)
  }
}
