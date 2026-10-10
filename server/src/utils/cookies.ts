import { Response } from 'express'
import { config } from '../config/env'

const JWT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

/** Write the HTTP-only JWT auth cookie. */
export function setAuthCookie(res: Response, token: string): void {
  res.cookie('token', token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
    path: '/',
    maxAge: JWT_MAX_AGE_MS,
  })
}

/** Clear the HTTP-only JWT auth cookie. */
export function clearAuthCookie(res: Response): void {
  res.clearCookie('token', {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
    path: '/',
  })
}

/** Write the readable (non-HttpOnly) CSRF cookie. */
export function setCsrfCookie(res: Response, token: string): void {
  res.cookie('csrf-token', token, {
    httpOnly: false, // JavaScript must be able to read this
    secure: config.cookieSecure,
    sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
    path: '/',
    maxAge: JWT_MAX_AGE_MS,
  })
}

/** Clear the CSRF cookie (on logout). */
export function clearCsrfCookie(res: Response): void {
  res.clearCookie('csrf-token', {
    httpOnly: false,
    secure: config.cookieSecure,
    sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
    path: '/',
  })
}
