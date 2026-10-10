export interface AppNotification {
  id: string
  type: string
  title: string
  body: string
  actorName: string
  href: string
  entityType: string
  entityId: string
  readAt: string | null
  createdAt: string
}

export interface NotificationList {
  items: AppNotification[]
  unreadCount: number
}
