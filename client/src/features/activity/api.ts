import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import type { ActivityList } from './types'

export const ACTIVITY_QUERY_KEY = ['activity'] as const
export const ADMIN_ACTIVITY_QUERY_KEY = ['admin', 'activity'] as const

export function useMyActivity() {
  return useQuery({
    queryKey: ACTIVITY_QUERY_KEY,
    queryFn: () => apiRequest<ActivityList>('/api/activity'),
    refetchInterval: 30_000,
    staleTime: 10_000,
  })
}

export function useAdminActivity() {
  return useQuery({
    queryKey: ADMIN_ACTIVITY_QUERY_KEY,
    queryFn: () => apiRequest<{ items: Array<{ id: string; type: string; title: string; description: string; actorName: string; actorRole: string; href: string; createdAt: string }> }>('/api/admin/activity'),
    staleTime: 10_000,
  })
}
