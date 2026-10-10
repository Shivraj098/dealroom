import type { NextFunction, Request, Response } from 'express'
import { BadRequestError, ForbiddenError, UnauthorizedError } from '../utils/errors'
import type { UserRole } from '../models/User'
import { broadcastChatMessage } from '../realtime/chatGateway'
import * as chatService from '../services/chat.service'
import type { CreateChatMessageInput } from '../validators/chat.validator'

function authenticatedUser(req: Request) {
  if (!req.user) throw new UnauthorizedError('Authentication required')
  if (req.user.role !== 'founder' && req.user.role !== 'investor') {
    throw new ForbiddenError('Messaging is available to founders and investors only')
  }
  return req.user
}

function routeParam(req: Request, key: string): string {
  const value = req.params[key]
  if (typeof value !== 'string') throw new BadRequestError(`Invalid ${key}`)
  return value
}

function optionalCursor(req: Request, key: string): number | undefined {
  const value = req.query[key]
  if (value === undefined) return undefined
  if (typeof value !== 'string' || !/^\d+$/.test(value)) throw new BadRequestError(`Invalid ${key}`)
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new BadRequestError(`Invalid ${key}`)
  return parsed
}

function pageLimit(req: Request): number {
  const value = req.query.limit
  if (value === undefined) return 50
  if (typeof value !== 'string' || !/^\d+$/.test(value)) throw new BadRequestError('Invalid limit')
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > 100) {
    throw new BadRequestError('Limit must be between 1 and 100')
  }
  return parsed
}

function chatRole(role: UserRole): 'founder' | 'investor' {
  if (role !== 'founder' && role !== 'investor') throw new ForbiddenError('Messaging is available to founders and investors only')
  return role
}

export async function listMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const user = authenticatedUser(req)
    const afterSequence = optionalCursor(req, 'afterSequence')
    const beforeSequence = optionalCursor(req, 'beforeSequence')
    if (afterSequence !== undefined && beforeSequence !== undefined) {
      throw new BadRequestError('Use either afterSequence or beforeSequence, not both')
    }
    const data = await chatService.listMessages(routeParam(req, 'dealRoomId'), user.id, chatRole(user.role), {
      afterSequence,
      beforeSequence,
      limit: pageLimit(req),
    })
    res.json({ success: true, data })
  } catch (error) { next(error) }
}

export async function createMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const user = authenticatedUser(req)
    const roomId = routeParam(req, 'dealRoomId')
    const result = await chatService.createMessage(roomId, user.id, chatRole(user.role), req.body as CreateChatMessageInput)
    if (result.created) broadcastChatMessage(roomId, result.message)
    res.status(result.created ? 201 : 200).json({ success: true, data: result.message })
  } catch (error) { next(error) }
}
