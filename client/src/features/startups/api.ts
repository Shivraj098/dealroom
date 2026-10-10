import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { initCsrf } from '@/features/auth/api'
import { apiRequest } from '@/lib/api-client'
import type { StartupDiscoveryFilters, StartupDiscoveryParams, StartupDiscoveryResult, DiscoverableStartup } from './types'

export const STARTUPS_QUERY_KEY = ['startups'] as const

function toSearchParams(params: StartupDiscoveryParams): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  return search.toString()
}

export function useStartupDiscovery(params: StartupDiscoveryParams) {
  return useQuery({
    queryKey: [...STARTUPS_QUERY_KEY, 'list', params],
    queryFn: () => apiRequest<StartupDiscoveryResult>(`/api/startups?${toSearchParams(params)}`),
    placeholderData: (previousData) => previousData,
    staleTime: 20_000,
  })
}

export function useStartupDiscoveryFilters() {
  return useQuery({
    queryKey: [...STARTUPS_QUERY_KEY, 'filters'],
    queryFn: () => apiRequest<StartupDiscoveryFilters>('/api/startups/filters'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useStartupDetails(startupId: string | undefined) {
  return useQuery({
    queryKey: [...STARTUPS_QUERY_KEY, 'detail', startupId],
    queryFn: () => apiRequest<{ startup: DiscoverableStartup }>(`/api/startups/${startupId}`).then((result) => result.startup),
    enabled: Boolean(startupId),
    staleTime: 30_000,
  })
}

export function useSetStartupSaved() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ startupId, saved }: { startupId: string; saved: boolean }) => {
      await initCsrf()
      return apiRequest<{ startupId: string; saved: boolean }>(`/api/startups/${startupId}/saved`, {
        method: saved ? 'PUT' : 'DELETE',
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: STARTUPS_QUERY_KEY })
    },
  })
}
