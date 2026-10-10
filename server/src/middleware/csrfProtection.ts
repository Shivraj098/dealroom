import { Request, Response, NextFunction } from 'express'
import { verifyCsrfToken } from '../utils/csrf'
import { ForbiddenError } from '../utils/errors'
import { config } from '../config/env'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * Validate the signed double-submit CSRF token on state-changing requests.
 *
 * The client reads the `csrf-token` cookie (readable, non-HttpOnly) and sends
 * it back in the `X-CSRF-Token` header. Both the cookie value and the header
 * value must be present and have a valid HMAC-SHA256 signature.
 *
 * Origin validation is also performed: state-changing requests must originate
 * from the configured CLIENT_ORIGIN.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) {
    return next()
  }

  // Origin validation (prefer Origin, fall back to Referer)
  const origin = req.headers.origin ?? req.headers.referer
  if (config.nodeEnv === 'production' && origin !== config.clientOrigin) {
    return next(new ForbiddenError('Invalid request origin'))
  }

  const cookieToken: string | undefined = req.cookies?.['csrf-token']
  const headerToken = req.headers['x-csrf-token']

  if (!cookieToken || typeof headerToken !== 'string' || !headerToken) {
    return next(new ForbiddenError('CSRF token missing'))
  }

  // Both cookie and header must carry the same valid signed token
  if (cookieToken !== headerToken) {
    return next(new ForbiddenError('CSRF token mismatch'))
  }

  if (!verifyCsrfToken(cookieToken)) {
    return next(new ForbiddenError('CSRF token invalid'))
  }

  next()
}
