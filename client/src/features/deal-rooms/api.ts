import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { initCsrf } from '@/features/auth/api'
import { apiRequest } from '@/lib/api-client'
import type {
  DealRoomDetails,
  DealRoomEvaluation,
  DealRoomListResult,
  EvaluationScores,
  InformationRequestList,
  PrivateNote,
  PrivateNoteList,
} from './types'

export const DEAL_ROOMS_QUERY_KEY = ['dealRooms'] as const
export const INFORMATION_REQUESTS_QUERY_KEY = ['informationRequests'] as const
export const PRIVATE_NOTES_QUERY_KEY = ['privateNotes'] as const
export const EVALUATION_QUERY_KEY = ['dealRoomEvaluation'] as const

export function useMyDealRooms() {
  return useQuery({
    queryKey: [...DEAL_ROOMS_QUERY_KEY, 'mine'],
    queryFn: () => apiRequest<DealRoomListResult>('/api/deal-rooms'),
    staleTime: 15_000,
  })
}

export function useDealRoom(roomId: string | undefined) {
  return useQuery({
    queryKey: [...DEAL_ROOMS_QUERY_KEY, 'detail', roomId],
    queryFn: () => apiRequest<DealRoomDetails>(`/api/deal-rooms/${roomId}`),
    enabled: Boolean(roomId),
    staleTime: 15_000,
  })
}

export function useUpdateDealRoomStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ roomId, status }: { roomId: string; status: 'approved' | 'passed' }) => {
      await initCsrf()
      return apiRequest<{ room: DealRoomDetails['room'] }>(`/api/deal-rooms/${roomId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: DEAL_ROOMS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: [...DEAL_ROOMS_QUERY_KEY, 'detail', variables.roomId] }),
      ])
    },
  })
}

export function useDealRoomEvaluation(roomId: string | undefined) {
  return useQuery({
    queryKey: [...EVALUATION_QUERY_KEY, roomId],
    queryFn: () => apiRequest<{ evaluation: DealRoomEvaluation | null }>(`/api/deal-rooms/${roomId}/evaluation`).then((data) => data.evaluation),
    enabled: Boolean(roomId),
    staleTime: 10_000,
  })
}

export function useSaveDealRoomEvaluation(roomId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { scores?: EvaluationScores; summary?: string }) => {
      await initCsrf()
      return apiRequest<{ evaluation: DealRoomEvaluation | null }>(`/api/deal-rooms/${roomId}/evaluation`, {
        method: 'PUT',
        body: JSON.stringify(input),
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...EVALUATION_QUERY_KEY, roomId] })
    },
  })
}

export function usePrivateNotes(roomId: string | undefined) {
  return useQuery({
    queryKey: [...PRIVATE_NOTES_QUERY_KEY, roomId],
    queryFn: () => apiRequest<PrivateNoteList>(`/api/deal-rooms/${roomId}/notes`),
    enabled: Boolean(roomId),
    staleTime: 10_000,
  })
}

export function useCreatePrivateNote(roomId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { title: string; content: string }) => {
      await initCsrf()
      return apiRequest<{ note: PrivateNote }>(`/api/deal-rooms/${roomId}/notes`, { method: 'POST', body: JSON.stringify(input) })
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: [...PRIVATE_NOTES_QUERY_KEY, roomId] }) },
  })
}

export function useUpdatePrivateNote(roomId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ noteId, title, content }: { noteId: string; title: string; content: string }) => {
      await initCsrf()
      return apiRequest<{ note: PrivateNote }>(`/api/deal-rooms/${roomId}/notes/${noteId}`, { method: 'PATCH', body: JSON.stringify({ title, content }) })
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: [...PRIVATE_NOTES_QUERY_KEY, roomId] }) },
  })
}

export function useDeletePrivateNote(roomId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (noteId: string) => {
      await initCsrf()
      return apiRequest<{ deleted: boolean; noteId: string }>(`/api/deal-rooms/${roomId}/notes/${noteId}`, { method: 'DELETE' })
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: [...PRIVATE_NOTES_QUERY_KEY, roomId] }) },
  })
}

export function useInformationRequests(roomId: string | undefined) {
  return useQuery({
    queryKey: [...INFORMATION_REQUESTS_QUERY_KEY, roomId],
    queryFn: () => apiRequest<InformationRequestList>(`/api/deal-rooms/${roomId}/information-requests`),
    enabled: Boolean(roomId),
    staleTime: 10_000,
  })
}

export function useCreateInformationRequest(roomId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { title: string; description: string }) => {
      await initCsrf()
      return apiRequest(`/api/deal-rooms/${roomId}/information-requests`, { method: 'POST', body: JSON.stringify(input) })
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: [...INFORMATION_REQUESTS_QUERY_KEY, roomId] }) },
  })
}

export function useRespondInformationRequest(roomId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ requestId, responseText, responseLink }: { requestId: string; responseText: string; responseLink: string }) => {
      await initCsrf()
      return apiRequest(`/api/deal-rooms/${roomId}/information-requests/${requestId}/respond`, { method: 'PATCH', body: JSON.stringify({ responseText, responseLink }) })
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: [...INFORMATION_REQUESTS_QUERY_KEY, roomId] }) },
  })
}

export function useCloseInformationRequest(roomId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (requestId: string) => {
      await initCsrf()
      return apiRequest(`/api/deal-rooms/${roomId}/information-requests/${requestId}/close`, { method: 'PATCH' })
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: [...INFORMATION_REQUESTS_QUERY_KEY, roomId] }) },
  })
}
