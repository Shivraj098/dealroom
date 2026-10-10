import type { NextFunction, Request, Response } from 'express'
import { UnauthorizedError, BadRequestError } from '../utils/errors'
import * as notificationService from '../services/notification.service'

function currentUserId(req: Request): string {
  if (!req.user) throw new UnauthorizedError('Authentication required')
  return req.user.id
}

function routeParam(req: Request, key: string): string {
  const value = req.params[key]
  if (typeof value !== 'string') throw new BadRequestError(`Invalid ${key}`)
  return value
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await notificationService.listNotifications(currentUserId(req)) }) }
  catch (error) { next(error) }
}

export async function unreadCount(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await notificationService.getUnreadCount(currentUserId(req)) }) }
  catch (error) { next(error) }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await notificationService.markNotificationRead(currentUserId(req), routeParam(req, 'notificationId')) }) }
  catch (error) { next(error) }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await notificationService.markAllNotificationsRead(currentUserId(req)) }) }
  catch (error) { next(error) }
}
