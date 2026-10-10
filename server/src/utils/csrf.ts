/**
 * Signed double-submit CSRF token.
 *
 * The token sent to the browser is: <random>.<hmac-sha256-signature>
 * The browser stores it in a readable (non-HttpOnly) cookie and sends it back
 * via the X-CSRF-Token header on every state-changing request.
 * The server verifies the signature using CSRF_SECRET before accepting the request.
 *
 * Uses only Node.js built-in node:crypto — no third-party CSRF library.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { config } from '../config/env'

const SEPARATOR = '.'

function sign(value: string): string {
  return createHmac('sha256', config.csrfSecret).update(value).digest('hex')
}

/** Generate a new signed CSRF token. */
export function generateCsrfToken(): string {
  const random = randomBytes(32).toString('hex')
  const signature = sign(random)
  return `${random}${SEPARATOR}${signature}`
}

/** Return true if the token's signature is valid. */
export function verifyCsrfToken(token: string): boolean {
  const sepIndex = token.lastIndexOf(SEPARATOR)
  if (sepIndex === -1) return false

  const random = token.slice(0, sepIndex)
  const providedSig = token.slice(sepIndex + 1)

  if (!random || !providedSig) return false

  const expectedSig = sign(random)

  try {
    return timingSafeEqual(Buffer.from(providedSig, 'hex'), Buffer.from(expectedSig, 'hex'))
  } catch {
    return false
  }
}
