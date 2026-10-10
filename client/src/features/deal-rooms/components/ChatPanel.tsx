import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, LoaderCircle, MessageCircle, Send, Wifi, WifiOff } from 'lucide-react'
import { useCurrentUser } from '@/features/auth/api'
import { createChatMessage, getChatMessagesAfter, getChatMessagesBefore, getChatWebSocketUrl, getRecentChatMessages } from '../chat-api'
import type { ChatHistoryPage, ChatMessage } from '../chat-types'
import type { RoomRole } from '../types'

const CHAT_QUERY_ROOT = ['deal-room-messages'] as const
const PAGE_SIZE = 100

type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'offline'
type GatewayEvent =
  | { type: 'subscribed'; roomId: string }
  | { type: 'message'; roomId: string; message: ChatMessage }
  | { type: 'error'; roomId?: string; code?: string; message?: string }

function latestSequence(page: ChatHistoryPage | undefined): number {
  if (!page?.items.length) return 0
  return Math.max(...page.items.map(message => message.sequence))
}

function mergeHistory(current: ChatHistoryPage | undefined, incoming: ChatMessage[], flags?: Pick<ChatHistoryPage, 'hasMoreBefore' | 'hasMoreAfter'>): ChatHistoryPage {
  const bySequence = new Map<number, ChatMessage>()
  for (const message of current?.items ?? []) bySequence.set(message.sequence, message)
  for (const message of incoming) bySequence.set(message.sequence, message)
  const items = [...bySequence.values()].sort((left, right) => left.sequence - right.sequence)
  return {
    items,
    hasMoreBefore: flags?.hasMoreBefore ?? current?.hasMoreBefore ?? false,
    hasMoreAfter: flags?.hasMoreAfter ?? current?.hasMoreAfter ?? false,
    oldestSequence: items[0]?.sequence ?? null,
    newestSequence: items[items.length - 1]?.sequence ?? null,
  }
}

export function ChatPanel({ roomId, role, readOnly }: { roomId: string; role: RoomRole; readOnly: boolean }) {
  const queryClient = useQueryClient()
  const currentUserQuery = useCurrentUser()
  const queryKey = useMemo(() => [...CHAT_QUERY_ROOT, roomId] as const, [roomId])
  const [draft, setDraft] = useState('')
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting')
  const [olderLoading, setOlderLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const pendingClientMessageRef = useRef<{ content: string; id: string } | null>(null)

  const messagesQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const latest = await getRecentChatMessages(roomId)
      const cached = queryClient.getQueryData<ChatHistoryPage>(queryKey)
      // Keep any live messages that arrived while the initial history request was in flight.
      return mergeHistory(latest, cached?.items ?? [], {
        hasMoreBefore: latest.hasMoreBefore || Boolean(cached?.hasMoreBefore),
        hasMoreAfter: false,
      })
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  const sendMutation = useMutation({
    mutationFn: (input: { content: string; clientMessageId: string }) => createChatMessage(roomId, input),
    onSuccess: message => {
      queryClient.setQueryData<ChatHistoryPage>(queryKey, current => mergeHistory(current, [message]))
      if (pendingClientMessageRef.current?.id === message.clientMessageId) pendingClientMessageRef.current = null
      setDraft('')
      setHistoryError('')
    },
  })

  const initialScrollDone = useRef(false)
  useEffect(() => {
    if (messagesQuery.isSuccess && !initialScrollDone.current) {
      bottomRef.current?.scrollIntoView({ block: 'end' })
      initialScrollDone.current = true
    }
  }, [messagesQuery.isSuccess])

  useEffect(() => {
    let disposed = false
    let socket: WebSocket | undefined
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined
    let attempts = 0
    let synchronizing = false

    const synchronizeHistory = async () => {
      if (synchronizing || disposed) return
      synchronizing = true
      try {
        let current = queryClient.getQueryData<ChatHistoryPage>(queryKey)
        if (!current) {
          current = await getRecentChatMessages(roomId)
          if (disposed) return
          queryClient.setQueryData<ChatHistoryPage>(queryKey, current)
        }

        let cursor = latestSequence(current)
        // Drain missed events in durable cursor order after every successful subscription/reconnect.
        for (let pageNumber = 0; pageNumber < 100 && !disposed; pageNumber += 1) {
          const page = await getChatMessagesAfter(roomId, cursor, PAGE_SIZE)
          if (disposed || page.items.length === 0) break
          queryClient.setQueryData<ChatHistoryPage>(queryKey, previous => mergeHistory(previous, page.items))
          const nextCursor = Math.max(cursor, ...page.items.map(message => message.sequence))
          if (nextCursor === cursor || !page.hasMoreAfter) break
          cursor = nextCursor
        }
      } catch (error) {
        if (!disposed) setHistoryError(error instanceof Error ? error.message : 'Could not synchronize message history.')
      } finally {
        synchronizing = false
      }
    }

    const connect = () => {
      if (disposed) return
      const nextSocket = new WebSocket(getChatWebSocketUrl())
      socket = nextSocket

      nextSocket.addEventListener('open', () => {
        if (disposed) return
        nextSocket.send(JSON.stringify({ type: 'subscribe', roomId }))
      })

      nextSocket.addEventListener('message', event => {
        if (disposed || typeof event.data !== 'string') return
        let payload: GatewayEvent
        try { payload = JSON.parse(event.data) as GatewayEvent } catch { return }
        if (payload.type === 'subscribed' && payload.roomId === roomId) {
          attempts = 0
          setConnectionState('connected')
          void synchronizeHistory()
        } else if (payload.type === 'message' && payload.roomId === roomId && payload.message) {
          queryClient.setQueryData<ChatHistoryPage>(queryKey, current => mergeHistory(current, [payload.message]))
        } else if (payload.type === 'error' && payload.roomId === roomId) {
          setConnectionState('offline')
          setHistoryError(payload.message || 'Realtime subscription failed.')
        }
      })

      nextSocket.addEventListener('error', () => {
        if (!disposed) setConnectionState('reconnecting')
      })
      nextSocket.addEventListener('close', () => {
        if (disposed) return
        attempts += 1
        setConnectionState(attempts >= 6 ? 'offline' : 'reconnecting')
        const delay = Math.min(1000 * (2 ** Math.min(attempts - 1, 5)), 30_000)
        reconnectTimer = setTimeout(connect, delay)
      })
    }

    connect()
    return () => {
      disposed = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      socket?.close(1000, 'Deal Room closed')
    }
  }, [roomId, queryClient, queryKey])

  const messages = messagesQuery.data?.items ?? []
  const isConnected = connectionState === 'connected'

  async function loadOlderMessages() {
    const oldest = messages[0]?.sequence
    if (oldest === undefined || olderLoading) return
    setOlderLoading(true)
    try {
      const page = await getChatMessagesBefore(roomId, oldest, 50)
      queryClient.setQueryData<ChatHistoryPage>(queryKey, current => mergeHistory(current, page.items, {
        hasMoreBefore: page.hasMoreBefore,
        hasMoreAfter: current?.hasMoreAfter ?? false,
      }))
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : 'Could not load older messages.')
    } finally {
      setOlderLoading(false)
    }
  }

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = draft.trim()
    if (!content || readOnly || sendMutation.isPending) return
    let pendingMessage = pendingClientMessageRef.current
    if (!pendingMessage || pendingMessage.content !== content) {
      pendingMessage = { content, id: crypto.randomUUID() }
      pendingClientMessageRef.current = pendingMessage
    }
    sendMutation.mutate({ content, clientMessageId: pendingMessage.id })
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><MessageCircle size={19} /></span>
          <div><h2 className="font-semibold text-slate-950">Conversation</h2><p className="mt-0.5 text-xs text-slate-500">Direct messages for this Deal Room · you are the {role}</p></div>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${isConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {isConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
          {connectionState === 'connected' ? 'Live' : connectionState === 'connecting' ? 'Connecting' : connectionState === 'offline' ? 'Offline' : 'Reconnecting'}
        </span>
      </div>

      <div className="max-h-[480px] min-h-[220px] space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
        {messagesQuery.isLoading && <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500"><LoaderCircle size={16} className="animate-spin" /> Loading conversation…</div>}
        {messagesQuery.isError && <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">Message history couldn't be loaded. <button type="button" className="ml-1 font-semibold underline" onClick={() => void messagesQuery.refetch()}>Try again</button></div>}
        {messagesQuery.data?.hasMoreBefore && messages.length > 0 && <div className="text-center"><button type="button" onClick={() => void loadOlderMessages()} disabled={olderLoading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">{olderLoading ? <LoaderCircle size={13} className="animate-spin" /> : <ArrowDown size={13} />} Load earlier messages</button></div>}
        {!messagesQuery.isLoading && !messagesQuery.isError && messages.length === 0 && <div className="flex min-h-40 flex-col items-center justify-center text-center"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500"><MessageCircle size={20} /></span><p className="mt-3 text-sm font-semibold text-slate-800">Start the conversation</p><p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">Use this space to discuss the opportunity and coordinate due diligence.</p></div>}
        {messages.map(message => {
          const mine = message.senderId === currentUserQuery.data?.id
          return <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${mine ? 'rounded-br-md bg-slate-950 text-white' : 'rounded-bl-md bg-slate-100 text-slate-900'}`}>
              <div className={`mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] ${mine ? 'text-slate-300' : 'text-slate-500'}`}><span className={`font-semibold ${mine ? 'text-white' : 'text-slate-800'}`}>{mine ? 'You' : message.senderName}</span><span className="capitalize">{message.senderRole}</span><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div>
              <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>
            </div>
          </div>
        })}
        <div ref={bottomRef} />
      </div>

      {historyError && <div role="alert" className="border-t border-amber-100 bg-amber-50 px-5 py-2.5 text-xs text-amber-800">{historyError}</div>}
      {sendMutation.isError && <div role="alert" className="border-t border-rose-100 bg-rose-50 px-5 py-2.5 text-xs text-rose-700">{sendMutation.error instanceof Error ? sendMutation.error.message : 'Message could not be sent.'}</div>}

      {readOnly ? <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 text-sm text-slate-500">This Deal Room is finalized. Conversation history is read-only.</div> : <form onSubmit={submitMessage} className="border-t border-slate-100 p-3 sm:p-4">
        <label htmlFor={`chat-message-${roomId}`} className="sr-only">Write a message</label>
        <div className="flex items-end gap-2"><textarea id={`chat-message-${roomId}`} value={draft} onChange={event => setDraft(event.target.value)} maxLength={2000} rows={2} placeholder="Write a message…" className="max-h-36 min-h-12 flex-1 resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" /><button type="submit" disabled={!draft.trim() || sendMutation.isPending} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"><Send size={15} /> <span className="hidden sm:inline">Send</span></button></div>
        <div className="mt-2 flex items-center justify-between gap-3 px-1"><p className="text-[11px] text-slate-400">Messages are saved to the Deal Room history.</p><span className="text-[11px] tabular-nums text-slate-400">{draft.length}/2000</span></div>
      </form>}
    </section>
  )
}
