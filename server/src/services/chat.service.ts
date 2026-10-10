import mongoose from 'mongoose'
import { ChatMessage, type IChatMessage } from '../models/ChatMessage'
import { DealRoom, type IDealRoom } from '../models/DealRoom'
import { User } from '../models/User'
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors'
import type { CreateChatMessageInput } from '../validators/chat.validator'

export type ChatRole = 'founder' | 'investor'

export interface ChatMessageDto {
  id: string
  roomId: string
  senderId: string
  senderName: string
  senderRole: ChatRole
  sequence: number
  clientMessageId: string
  content: string
  createdAt: Date
}

export interface ChatHistoryPage {
  items: ChatMessageDto[]
  hasMoreBefore: boolean
  hasMoreAfter: boolean
  oldestSequence: number | null
  newestSequence: number | null
}

function assertObjectId(value: string, label: string): void {
  if (!mongoose.isValidObjectId(value)) throw new BadRequestError(`Invalid ${label}`)
}

function membershipFilter(roomId: string, userId: string, role: ChatRole) {
  return role === 'founder'
    ? { _id: roomId, founder: userId }
    : { _id: roomId, investor: userId }
}

async function getAccessibleRoom(roomId: string, userId: string, role: ChatRole): Promise<IDealRoom> {
  assertObjectId(roomId, 'Deal Room ID')
  const room = await DealRoom.findOne(membershipFilter(roomId, userId, role))
  if (!room) throw new NotFoundError('Deal Room not found')
  return room
}

async function toDtos(messages: IChatMessage[]): Promise<ChatMessageDto[]> {
  if (messages.length === 0) return []
  const senderIds = [...new Set(messages.map(message => message.sender.toString()))]
  const users = await User.find({ _id: { $in: senderIds } }).select('name').lean()
  const names = new Map(users.map(user => [user._id.toString(), user.name] as const))

  return messages.map(message => ({
    id: message._id.toString(),
    roomId: message.room.toString(),
    senderId: message.sender.toString(),
    senderName: names.get(message.sender.toString()) ?? 'Former participant',
    senderRole: message.senderRole,
    sequence: message.sequence,
    clientMessageId: message.clientMessageId,
    content: message.content,
    createdAt: message.createdAt,
  }))
}

function historyPage(items: ChatMessageDto[], hasMoreBefore: boolean, hasMoreAfter: boolean): ChatHistoryPage {
  return {
    items,
    hasMoreBefore,
    hasMoreAfter,
    oldestSequence: items[0]?.sequence ?? null,
    newestSequence: items[items.length - 1]?.sequence ?? null,
  }
}

export async function listMessages(
  roomId: string,
  userId: string,
  role: ChatRole,
  options: { afterSequence?: number; beforeSequence?: number; limit: number }
): Promise<ChatHistoryPage> {
  await getAccessibleRoom(roomId, userId, role)
  const { afterSequence, beforeSequence, limit } = options

  if (afterSequence !== undefined) {
    const records = await ChatMessage.find({ room: roomId, sequence: { $gt: afterSequence } })
      .sort({ sequence: 1 })
      .limit(limit + 1)
    const hasMoreAfter = records.length > limit
    const selected = records.slice(0, limit)
    const items = await toDtos(selected)
    const hasMoreBefore = afterSequence > 0
      ? Boolean(await ChatMessage.exists({ room: roomId, sequence: { $lt: (items[0]?.sequence ?? afterSequence) } }))
      : false
    return historyPage(items, hasMoreBefore, hasMoreAfter)
  }

  if (beforeSequence !== undefined) {
    const records = await ChatMessage.find({ room: roomId, sequence: { $lt: beforeSequence } })
      .sort({ sequence: -1 })
      .limit(limit + 1)
    const hasMoreBefore = records.length > limit
    const selected = records.slice(0, limit).reverse()
    const items = await toDtos(selected)
    return historyPage(items, hasMoreBefore, true)
  }

  const records = await ChatMessage.find({ room: roomId })
    .sort({ sequence: -1 })
    .limit(limit + 1)
  const hasMoreBefore = records.length > limit
  const items = await toDtos(records.slice(0, limit).reverse())
  return historyPage(items, hasMoreBefore, false)
}

export async function createMessage(
  roomId: string,
  userId: string,
  role: ChatRole,
  input: CreateChatMessageInput
): Promise<{ message: ChatMessageDto; created: boolean }> {
  const room = await getAccessibleRoom(roomId, userId, role)
  const existing = await ChatMessage.findOne({ room: roomId, sender: userId, clientMessageId: input.clientMessageId })
  if (existing) {
    const [message] = await toDtos([existing])
    return { message, created: false }
  }

  if (room.status !== 'active') {
    throw new ConflictError(`This Deal Room is ${room.status}; new messages are disabled`)
  }

  // Keep sequence allocation and message persistence atomic so a reconnect cursor
  // can never advance past a sequence whose message is still waiting to be saved.
  const session = await mongoose.startSession()
  let messageId: string | undefined
  let created = false
  try {
    await session.withTransaction(async () => {
      messageId = undefined
      created = false

      // Re-check inside the transaction to make retrying the same clientMessageId idempotent under concurrency.
      const existingInTransaction = await ChatMessage.findOne({
        room: roomId,
        sender: userId,
        clientMessageId: input.clientMessageId,
      }).session(session)
      if (existingInTransaction) {
        messageId = existingInTransaction._id.toString()
        return
      }

      const sequencedRoom = await DealRoom.findOneAndUpdate(
        { ...membershipFilter(roomId, userId, role), status: 'active' },
        { $inc: { messageSequence: 1 } },
        { new: true, session }
      )
      if (!sequencedRoom) {
        const currentRoom = await DealRoom.findOne(membershipFilter(roomId, userId, role)).session(session)
        if (!currentRoom) throw new NotFoundError('Deal Room not found')
        if (currentRoom.status !== 'active') {
          throw new ConflictError(`This Deal Room is ${currentRoom.status}; new messages are disabled`)
        }
        throw new ConflictError('The room changed while sending the message. Please retry.')
      }

      const sender = await User.findById(userId).select('name role').session(session)
      if (!sender || sender.role !== role) throw new NotFoundError('Message sender not found')

      const [saved] = await ChatMessage.create([{
        room: roomId,
        sender: userId,
        senderRole: role,
        sequence: sequencedRoom.messageSequence,
        clientMessageId: input.clientMessageId,
        content: input.content,
      }], { session })
      messageId = saved._id.toString()
      created = true
    })
  } catch (error) {
    const code = (error as { code?: unknown }).code
    if (code === 11000) {
      const retry = await ChatMessage.findOne({ room: roomId, sender: userId, clientMessageId: input.clientMessageId })
      if (retry) {
        const [message] = await toDtos([retry])
        return { message, created: false }
      }
    }
    throw error
  } finally {
    await session.endSession()
  }

  if (!messageId) throw new ConflictError('The message could not be persisted. Please retry.')
  const persisted = await ChatMessage.findById(messageId)
  if (!persisted) throw new ConflictError('The message was not available after saving. Please retry.')
  const [message] = await toDtos([persisted])
  return { message, created }
}
