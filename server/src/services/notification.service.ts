import mongoose from 'mongoose'
import { Notification, type INotification } from '../models/Notification'
import { BadRequestError, NotFoundError } from '../utils/errors'

function assertObjectId(value: string): void {
  if (!mongoose.isValidObjectId(value)) throw new BadRequestError('Invalid notification ID')
}

function notificationDto(notification: INotification) {
  return {
    id: notification._id.toString(),
    type: notification.type,
    title: notification.title,
    body: notification.body,
    actorName: notification.actorName,
    href: notification.href,
    entityType: notification.entityType,
    entityId: notification.entityId,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  }
}

export async function listNotifications(userId: string) {
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ recipient: userId }).sort({ createdAt: -1, _id: -1 }).limit(50),
    Notification.countDocuments({ recipient: userId, readAt: { $exists: false } }),
  ])
  return { items: notifications.map(notificationDto), unreadCount }
}

export async function getUnreadCount(userId: string) {
  const count = await Notification.countDocuments({ recipient: userId, readAt: { $exists: false } })
  return { unreadCount: count }
}

export async function markNotificationRead(userId: string, notificationId: string) {
  assertObjectId(notificationId)
  const item = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId, readAt: { $exists: false } },
    { $set: { readAt: new Date() } },
    { new: true },
  )
  if (item) return { notification: notificationDto(item) }
  const existing = await Notification.findOne({ _id: notificationId, recipient: userId })
  if (!existing) throw new NotFoundError('Notification not found')
  return { notification: notificationDto(existing) }
}

export async function markAllNotificationsRead(userId: string) {
  const result = await Notification.updateMany(
    { recipient: userId, readAt: { $exists: false } },
    { $set: { readAt: new Date() } },
  )
  return { updatedCount: result.modifiedCount }
}
