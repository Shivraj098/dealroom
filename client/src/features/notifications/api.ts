import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import type { AppNotification, NotificationList } from './types'

export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const
export const NOTIFICATION_COUNT_QUERY_KEY = ['notifications', 'unread-count'] as const

export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => apiRequest<NotificationList>('/api/notifications'),
    enabled,
    // The full list is only needed while the dropdown is open. Keep count polling separate.
    refetchInterval: enabled ? 60_000 : false,
    refetchIntervalInBackground: false,
    staleTime: 30_000,
  })
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: NOTIFICATION_COUNT_QUERY_KEY,
    queryFn: () => apiRequest<{ unreadCount: number }>('/api/notifications/unread-count'),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    staleTime: 30_000,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (notificationId: string) => apiRequest<{ notification: AppNotification }>(`/api/notifications/${notificationId}/read`, { method: 'PATCH' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: NOTIFICATION_COUNT_QUERY_KEY })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiRequest<{ updatedCount: number }>('/api/notifications/read-all', { method: 'PATCH' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: NOTIFICATION_COUNT_QUERY_KEY })
    },
  })
}
