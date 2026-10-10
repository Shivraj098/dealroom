import mongoose from 'mongoose'
import { ActivityEvent } from '../models/ActivityEvent'
import { Notification } from '../models/Notification'
import { User, type UserRole } from '../models/User'

interface NotificationDelivery {
  recipientId: string
  type: string
  title: string
  body: string
  href?: string
  entityType?: string
  entityId?: string
}

export interface ActivityEmission {
  actorId: string
  type: string
  title: string
  description: string
  audienceUserIds: string[]
  audienceRoles?: UserRole[]
  href?: string
  dealRoomId?: string
  startupId?: string
  notifications?: NotificationDelivery[]
}

/**
 * Writes an immutable activity event and any related user notifications.
 * Callers intentionally use emitActivity so a notification failure cannot make a
 * successfully committed business operation appear to have failed to the client.
 */
async function persistActivity(input: ActivityEmission): Promise<void> {
  const actor = await User.findById(input.actorId).select('name role').lean()
  if (!actor) return

  const audienceUsers = [...new Set(input.audienceUserIds)]
    .filter((id) => mongoose.isValidObjectId(id))
    .map((id) => new mongoose.Types.ObjectId(id))

  await ActivityEvent.create({
    actor: new mongoose.Types.ObjectId(input.actorId),
    actorName: actor.name,
    actorRole: actor.role,
    type: input.type,
    title: input.title,
    description: input.description,
    audienceUsers,
    audienceRoles: input.audienceRoles ?? [],
    href: input.href ?? '/workspace',
    dealRoom: input.dealRoomId && mongoose.isValidObjectId(input.dealRoomId) ? new mongoose.Types.ObjectId(input.dealRoomId) : undefined,
    startup: input.startupId && mongoose.isValidObjectId(input.startupId) ? new mongoose.Types.ObjectId(input.startupId) : undefined,
  })

  const deliveries = (input.notifications ?? []).filter((item) => mongoose.isValidObjectId(item.recipientId))
  if (deliveries.length === 0) return
  const notificationDocuments = deliveries.map((delivery) => ({
    recipient: new mongoose.Types.ObjectId(delivery.recipientId),
    actor: new mongoose.Types.ObjectId(input.actorId),
    actorName: actor.name,
    type: delivery.type,
    title: delivery.title,
    body: delivery.body,
    href: delivery.href ?? input.href ?? '/workspace',
    entityType: delivery.entityType ?? '',
    entityId: delivery.entityId ?? '',
  }))
  await Notification.insertMany(notificationDocuments)
}

export function emitActivity(input: ActivityEmission): void {
  void persistActivity(input).catch((error: unknown) => {
    // Activity and notifications are auxiliary records, not the transaction of
    // record for a connection, message, or profile action. Keep the main action
    // successful and log failures so they can be diagnosed during integration.
    console.error('[activity] Could not persist activity/notification:', error)
  })
}

export async function listUserActivity(userId: string, limit = 30) {
  const events = await ActivityEvent.find({ audienceUsers: userId })
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .lean()
  return {
    items: events.map((event) => ({
      id: event._id.toString(),
      type: event.type,
      title: event.title,
      description: event.description,
      actorName: event.actorName,
      href: event.href,
      dealRoomId: event.dealRoom?.toString() ?? null,
      startupId: event.startup?.toString() ?? null,
      createdAt: event.createdAt,
    })),
  }
}

export async function listAdminActivity(limit = 50) {
  const events = await ActivityEvent.find({ audienceRoles: 'admin' })
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .lean()
  return {
    items: events.map((event) => ({
      id: event._id.toString(),
      type: event.type,
      title: event.title,
      description: event.description,
      actorName: event.actorName,
      actorRole: event.actorRole,
      href: event.href,
      createdAt: event.createdAt,
    })),
  }
}
