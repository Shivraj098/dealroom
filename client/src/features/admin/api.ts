import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { ADMIN_ACTIVITY_QUERY_KEY } from '@/features/activity/api'
import type { AdminStartupList, AdminUserList } from './types'

export const ADMIN_USERS_QUERY_KEY = ['admin', 'users'] as const
export const ADMIN_STARTUPS_QUERY_KEY = ['admin', 'startups'] as const

export function useAdminUsers(search: string, status: string) {
  return useQuery({
    queryKey: [...ADMIN_USERS_QUERY_KEY, search, status],
    queryFn: () => apiRequest<AdminUserList>(`/api/admin/users?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}&page=1&limit=30`),
  })
}

export function useAdminStartups(search: string, visibility: string) {
  return useQuery({
    queryKey: [...ADMIN_STARTUPS_QUERY_KEY, search, visibility],
    queryFn: () => apiRequest<AdminStartupList>(`/api/admin/startups?search=${encodeURIComponent(search)}&visibility=${encodeURIComponent(visibility)}&page=1&limit=30`),
  })
}

export function useUpdateUserSuspension() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { userId: string; suspended: boolean; reason: string }) => apiRequest(`/api/admin/users/${input.userId}/suspension`, { method: 'PATCH', body: JSON.stringify({ suspended: input.suspended, reason: input.reason }) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ADMIN_ACTIVITY_QUERY_KEY })
    },
  })
}

export function useUpdateStartupModeration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { startupId: string; hidden: boolean; reason: string }) => apiRequest(`/api/admin/startups/${input.startupId}/moderation`, { method: 'PATCH', body: JSON.stringify({ hidden: input.hidden, reason: input.reason }) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_STARTUPS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ADMIN_ACTIVITY_QUERY_KEY })
    },
  })
}
