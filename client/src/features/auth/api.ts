import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import type { User } from '@/types/models'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const AUTH_QUERY_KEY = ['currentUser'] as const

// ─── CSRF initialisation ──────────────────────────────────────────────────────

/**
 * Fetch a fresh CSRF token from the server and store it in the readable cookie.
 * Must be called before any state-changing auth request.
 */
export async function initCsrf(): Promise<void> {
  await apiRequest('/api/auth/csrf')
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useCurrentUser() {
  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: () => apiRequest<{ user: User }>('/api/auth/me').then((d) => d.user),
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export interface RegisterData {
  name: string
  email: string
  password: string
  role: 'founder' | 'investor'
}

export interface LoginData {
  email: string
  password: string
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: RegisterData) => {
      await initCsrf()
      return apiRequest<{ user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, data.user)
    },
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: LoginData) => {
      await initCsrf()
      return apiRequest<{ user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, data.user)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiRequest('/api/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      queryClient.setQueryData(AUTH_QUERY_KEY, null)
      queryClient.clear()
    },
  })
}
