// Use relative URLs by default so the Vite dev proxy can forward requests.
const API_BASE = import.meta.env.VITE_API_URL || ''

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * Read the signed CSRF token from the readable `csrf-token` cookie.
 * Returns an empty string when not present (e.g. unauthenticated or before init).
 */
function getCsrfToken(): string {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrf-token='))
  return match ? match.split('=').slice(1).join('=') : ''
}

/**
 * Central fetch wrapper.
 * - Always includes credentials (cookies).
 * - Appends X-CSRF-Token on state-changing methods.
 * - Parses the agreed { success, data?, error? } envelope.
 * - Throws an Error with the server's error message on failure.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase()
  const csrfHeader: Record<string, string> = {}
  if (!SAFE_METHODS.has(method)) {
    const token = getCsrfToken()
    if (token) csrfHeader['X-CSRF-Token'] = token
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...csrfHeader,
      ...options.headers,
    },
  })

  const result = await response.json()

  if (!response.ok || !result.success) {
    // Surface actionable validation feedback when the API includes field-level details.
    const detailMessages = Array.isArray(result.details)
      ? result.details
          .map((detail: unknown) => {
            if (typeof detail === 'string') return detail
            if (detail && typeof detail === 'object' && 'message' in detail && typeof detail.message === 'string') {
              return detail.message
            }
            return undefined
          })
          .filter((message: string | undefined): message is string => Boolean(message))
      : []
    throw new Error(detailMessages[0] ?? result.error ?? 'Request failed')
  }

  return result.data
}
