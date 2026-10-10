import { apiRequest } from '@/lib/api-client'
import type { ChatHistoryPage, ChatMessage, CreateChatMessageInput } from './chat-types'

const CHAT_LIMIT = 50

export function getRecentChatMessages(roomId: string): Promise<ChatHistoryPage> {
  return apiRequest<ChatHistoryPage>(`/api/deal-rooms/${roomId}/messages?limit=${CHAT_LIMIT}`)
}

export function getChatMessagesAfter(roomId: string, afterSequence: number, limit = 100): Promise<ChatHistoryPage> {
  const params = new URLSearchParams({ afterSequence: String(afterSequence), limit: String(limit) })
  return apiRequest<ChatHistoryPage>(`/api/deal-rooms/${roomId}/messages?${params.toString()}`)
}

export function getChatMessagesBefore(roomId: string, beforeSequence: number, limit = 50): Promise<ChatHistoryPage> {
  const params = new URLSearchParams({ beforeSequence: String(beforeSequence), limit: String(limit) })
  return apiRequest<ChatHistoryPage>(`/api/deal-rooms/${roomId}/messages?${params.toString()}`)
}

export function createChatMessage(roomId: string, input: CreateChatMessageInput): Promise<ChatMessage> {
  return apiRequest<ChatMessage>(`/api/deal-rooms/${roomId}/messages`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function getChatWebSocketUrl(): string {
  const apiBase = import.meta.env.VITE_API_URL || ''
  const baseUrl = apiBase || window.location.origin
  const url = new URL('/api/ws', baseUrl)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}
