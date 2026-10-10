import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'
import { User } from '../models/User'
import { UnauthorizedError, ForbiddenError } from '../utils/errors'
import type { UserRole } from '../models/User'

// Augment Express Request so downstream handlers are fully typed
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        role: UserRole
      }
    }
  }
}

/**
 * Verify the HTTP-only JWT cookie and attach req.user.
 * Calls next(UnauthorizedError) if the token is absent, expired or invalid.
 * Calls next(UnauthorizedError) if the user no longer exists in the database.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const token: string | undefined = req.cookies?.token

    if (!token) {
      return next(new UnauthorizedError('Authentication required'))
    }

    let payload
    try {
      payload = verifyToken(token)
    } catch {
      return next(new UnauthorizedError('Session expired or invalid'))
    }

    // Confirm the user still exists (catches deleted/suspended accounts)
    const user = await User.findById(payload.userId).select('_id role')
    if (!user) {
      return next(new UnauthorizedError('Account not found'))
    }

    req.user = { id: user._id.toString(), role: user.role }
    next()
  } catch (err) {
    next(err)
  }
}

/**
 * Allow only the specified roles.
 * Must be placed after authenticate.
 * Returns 401 if called without a session (defensive), 403 if the role is insufficient.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'))
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action'))
    }
    next()
  }
}
