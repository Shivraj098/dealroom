import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { initCsrf } from '@/features/auth/api'
import { apiRequest } from '@/lib/api-client'
import type { ConnectionRequestList, ConnectionRequestStatusResponse } from './types'

export const CONNECTIONS_QUERY_KEY = ['connections'] as const

export function useStartupConnectionStatus(startupId: string | undefined) {
  return useQuery({
    queryKey: [...CONNECTIONS_QUERY_KEY, 'startup', startupId],
    queryFn: () => apiRequest<ConnectionRequestStatusResponse>(`/api/connections/startups/${startupId}`),
    enabled: Boolean(startupId),
    staleTime: 15_000,
  })
}

export function useMyConnectionRequests() {
  return useQuery({
    queryKey: [...CONNECTIONS_QUERY_KEY, 'mine'],
    queryFn: () => apiRequest<ConnectionRequestList>('/api/connections'),
    staleTime: 15_000,
  })
}

export function useCreateConnectionRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ startupId, message = '' }: { startupId: string; message?: string }) => {
      await initCsrf()
      return apiRequest<ConnectionRequestStatusResponse>(`/api/connections/startups/${startupId}`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      })
    },
    onSuccess: async (data, variables) => {
      // Update the detail cache immediately so the request button cannot briefly
      // re-enable while the status query is refetching.
      queryClient.setQueryData(
        [...CONNECTIONS_QUERY_KEY, 'startup', variables.startupId],
        data,
      )
      await queryClient.invalidateQueries({ queryKey: [...CONNECTIONS_QUERY_KEY, 'mine'] })
    },
  })
}

export function useRespondToConnectionRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: 'accept' | 'reject' }) => {
      await initCsrf()
      return apiRequest<ConnectionRequestStatusResponse>(`/api/connections/${requestId}/${action}`, {
        method: 'PATCH',
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CONNECTIONS_QUERY_KEY })
    },
  })
}
