export interface ActivityItem {
  id: string
  type: string
  title: string
  description: string
  actorName: string
  href: string
  dealRoomId: string | null
  startupId: string | null
  createdAt: string
}

export interface ActivityList { items: ActivityItem[] }
