import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import type { User } from '@/types/models'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const AUTH_QUERY_KEY = ['currentUser'] as const

// ─── CSRF initialisation ──────────────────────────────────────────────────────

/** Fetch a fresh signed CSRF token before a state-changing request. */
export async function initCsrf(): Promise<void> {
  await apiRequest('/api/auth/csrf')
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useCurrentUser() {
  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: () => apiRequest<{ user: User }>('/api/auth/me').then((data) => data.user),
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
    mutationFn: async () => {
      // Refresh the readable CSRF cookie before logout so an older token cannot
      // strand the user in an authenticated-looking client session.
      await initCsrf()
      return apiRequest<{ message: string }>('/api/auth/logout', { method: 'POST' })
    },
    onMutate: async () => {
      // Avoid a concurrent session/profile request winning a race with logout.
      await queryClient.cancelQueries()
    },
    onSuccess: () => {
      // Clear user-specific data while keeping an explicit logged-out auth state.
      queryClient.setQueryData(AUTH_QUERY_KEY, null)
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== AUTH_QUERY_KEY[0] })
    },
  })
}
