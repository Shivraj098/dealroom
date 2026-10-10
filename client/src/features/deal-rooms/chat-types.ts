import type { RoomRole } from './types'

export interface ChatMessage {
  id: string
  roomId: string
  senderId: string
  senderName: string
  senderRole: RoomRole
  sequence: number
  clientMessageId: string
  content: string
  createdAt: string
}

export interface ChatHistoryPage {
  items: ChatMessage[]
  hasMoreBefore: boolean
  hasMoreAfter: boolean
  oldestSequence: number | null
  newestSequence: number | null
}

export interface CreateChatMessageInput {
  content: string
  clientMessageId: string
}
