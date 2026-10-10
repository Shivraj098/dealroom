import type { IncomingMessage, Server as HttpServer } from 'node:http'
import type { Duplex } from 'node:stream'
import { parseCookie } from 'cookie'
import mongoose from 'mongoose'
import { WebSocket, WebSocketServer, type RawData } from 'ws'
import { config } from '../config/env'
import { DealRoom } from '../models/DealRoom'
import { User } from '../models/User'
import { verifyToken } from '../utils/jwt'

interface SocketPrincipal {
  userId: string
  role: 'founder' | 'investor'
  subscribedRoomIds: Set<string>
}

interface SubscribeEvent {
  type: 'subscribe'
  roomId: string
}

class UpgradeError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
  }
}

const principals = new WeakMap<WebSocket, SocketPrincipal>()
const clients = new Set<WebSocket>()

function normalizedOrigin(origin: string | undefined): string {
  if (!origin) return ''
  try { return new URL(origin).origin } catch { return '' }
}

function rejectUpgrade(socket: Duplex, statusCode: number, message: string): void {
  if (socket.destroyed) return
  const statusText = statusCode === 403 ? 'Forbidden' : statusCode === 401 ? 'Unauthorized' : 'Internal Server Error'
  socket.write(`HTTP/1.1 ${statusCode} ${statusText}\r\nConnection: close\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: ${Buffer.byteLength(message)}\r\n\r\n${message}`)
  socket.destroy()
}

async function authenticateUpgrade(request: IncomingMessage): Promise<Omit<SocketPrincipal, 'subscribedRoomIds'>> {
  if (normalizedOrigin(request.headers.origin) !== normalizedOrigin(config.clientOrigin)) {
    throw new UpgradeError(403, 'WebSocket origin is not allowed')
  }

  const cookies = parseCookie(request.headers.cookie ?? '')
  const token = cookies.token
  if (!token) throw new UpgradeError(401, 'Authentication required')

  let payload: ReturnType<typeof verifyToken>
  try { payload = verifyToken(token) } catch { throw new UpgradeError(401, 'Session expired or invalid') }

  const user = await User.findById(payload.userId).select('_id role isSuspended')
  if (!user || payload.role !== user.role) throw new UpgradeError(401, 'Account not found')
  if (user.isSuspended === true) throw new UpgradeError(403, 'This account is suspended')
  if (user.role !== 'founder' && user.role !== 'investor') {
    throw new UpgradeError(403, 'Messaging is available to founders and investors only')
  }
  return { userId: user._id.toString(), role: user.role }
}

function asText(data: RawData): string {
  if (Buffer.isBuffer(data)) return data.toString('utf8')
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString('utf8')
  return Buffer.concat(data).toString('utf8')
}

function sendEvent(socket: WebSocket, event: Record<string, unknown>): void {
  if (socket.readyState !== WebSocket.OPEN) return
  socket.send(JSON.stringify(event))
}

async function handleClientEvent(socket: WebSocket, raw: RawData): Promise<void> {
  let parsed: unknown
  try { parsed = JSON.parse(asText(raw)) } catch {
    sendEvent(socket, { type: 'error', code: 'INVALID_JSON', message: 'WebSocket messages must be valid JSON' })
    return
  }

  if (!parsed || typeof parsed !== 'object' || !('type' in parsed) || parsed.type !== 'subscribe' || !('roomId' in parsed) || typeof parsed.roomId !== 'string') {
    sendEvent(socket, { type: 'error', code: 'UNSUPPORTED_EVENT', message: 'Only the subscribe event is supported' })
    return
  }

  const event = parsed as SubscribeEvent
  if (!mongoose.isValidObjectId(event.roomId)) {
    sendEvent(socket, { type: 'error', code: 'INVALID_ROOM_ID', message: 'Invalid Deal Room ID' })
    return
  }

  const principal = principals.get(socket)
  if (!principal) {
    socket.close(1008, 'Authentication required')
    return
  }

  const user = await User.findById(principal.userId).select('_id role isSuspended')
  if (!user || user.isSuspended === true || user.role !== principal.role) {
    socket.close(1008, 'Account no longer has access')
    return
  }

  const roomFilter = principal.role === 'founder'
    ? { _id: event.roomId, founder: principal.userId }
    : { _id: event.roomId, investor: principal.userId }
  const room = await DealRoom.findOne(roomFilter).select('_id')
  if (!room) {
    sendEvent(socket, { type: 'error', roomId: event.roomId, code: 'ROOM_ACCESS_DENIED', message: 'You do not have access to this Deal Room' })
    return
  }

  principal.subscribedRoomIds.add(event.roomId)
  sendEvent(socket, { type: 'subscribed', roomId: event.roomId })
}

/** Attach an origin-checked, cookie-authenticated WebSocket gateway to the HTTP server. */
export function attachChatGateway(server: HttpServer): () => Promise<void> {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 16 * 1024 })

  const onUpgrade = (request: IncomingMessage, socket: Duplex, head: Buffer) => {
    let pathname = ''
    try { pathname = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`).pathname } catch { /* handled below */ }
    if (pathname !== '/api/ws') {
      rejectUpgrade(socket, 403, 'Unknown WebSocket endpoint')
      return
    }

    void authenticateUpgrade(request).then(principal => {
      if (socket.destroyed) return
      wss.handleUpgrade(request, socket, head, ws => {
        principals.set(ws, { ...principal, subscribedRoomIds: new Set<string>() })
        wss.emit('connection', ws, request)
      })
    }).catch(error => {
      const statusCode = error instanceof UpgradeError ? error.statusCode : 500
      const message = error instanceof UpgradeError ? error.message : 'WebSocket connection failed'
      rejectUpgrade(socket, statusCode, message)
    })
  }

  server.on('upgrade', onUpgrade)
  wss.on('connection', socket => {
    clients.add(socket)
    socket.on('message', raw => {
      void handleClientEvent(socket, raw).catch(() => {
        sendEvent(socket, { type: 'error', code: 'EVENT_FAILED', message: 'Could not process WebSocket event' })
      })
    })
    socket.on('close', () => clients.delete(socket))
    socket.on('error', () => clients.delete(socket))
  })

  return async () => {
    server.off('upgrade', onUpgrade)
    for (const socket of clients) socket.terminate()
    clients.clear()
    await new Promise<void>(resolve => wss.close(() => resolve()))
  }
}

/** Broadcast only persisted messages, and only to sockets which subscribed to the same room. */
export function broadcastChatMessage<T extends { id: string; roomId: string; sequence: number }>(roomId: string, message: T): void {
  const event = JSON.stringify({ type: 'message', roomId, message })
  for (const socket of clients) {
    const principal = principals.get(socket)
    if (socket.readyState === WebSocket.OPEN && principal?.subscribedRoomIds.has(roomId)) {
      socket.send(event)
    }
  }
}


/** Immediately close authenticated sockets when an administrator suspends a user. */
export function closeChatConnectionsForUser(userId: string): void {
  for (const socket of clients) {
    const principal = principals.get(socket)
    if (principal?.userId === userId) socket.close(1008, 'Account suspended')
  }
}
