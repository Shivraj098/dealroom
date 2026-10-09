// Use relative URLs by default so Vite dev proxy can work
const API_BASE = import.meta.env.VITE_API_URL || ''

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include', // Send cookies with every request
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const result = await response.json()

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Request failed')
  }

  return result.data
}
