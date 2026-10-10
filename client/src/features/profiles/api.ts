import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import type { InvestorProfile, InvestorProfilePayload, MyProfileSummary, StartupProfile, StartupProfilePayload } from '@/types/models'

export const MY_PROFILE_QUERY_KEY = ['myProfile'] as const

export function useMyProfile(enabled = true) {
  return useQuery({
    queryKey: MY_PROFILE_QUERY_KEY,
    queryFn: () => apiRequest<MyProfileSummary>('/api/profiles/me'),
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useSaveStartupProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: StartupProfilePayload) =>
      apiRequest<{ profile: StartupProfile }>('/api/profiles/startup', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MY_PROFILE_QUERY_KEY })
    },
  })
}

export function useSaveInvestorProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: InvestorProfilePayload) =>
      apiRequest<{ profile: InvestorProfile }>('/api/profiles/investor', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MY_PROFILE_QUERY_KEY })
    },
  })
}
