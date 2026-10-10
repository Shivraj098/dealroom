import mongoose, { type QueryFilter } from 'mongoose'
import { StartupProfile, type IStartupProfile } from '../models/StartupProfile'
import { User, type IUser, type UserRole } from '../models/User'
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../utils/errors'
import { emitActivity } from './activity.service'
import type { UpdateStartupModerationInput, UpdateUserSuspensionInput } from '../validators/admin.validator'

function assertObjectId(value: string, label: string): void {
  if (!mongoose.isValidObjectId(value)) throw new BadRequestError(`Invalid ${label}`)
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function listUsers(options: { search: string; role: string; status: string; page: number; limit: number }) {
  const filter: QueryFilter<IUser> = {}
  if (options.role && ['founder', 'investor', 'admin'].includes(options.role)) filter.role = options.role as UserRole
  if (options.status === 'suspended') filter.isSuspended = true
  if (options.status === 'active') filter.isSuspended = { $ne: true }
  if (options.search) {
    const search = new RegExp(escapeRegex(options.search), 'i')
    filter.$or = [{ name: search }, { email: search }]
  }
  const skip = (options.page - 1) * options.limit
  const [users, total] = await Promise.all([
    User.find(filter).select('name email role isSuspended suspensionReason suspendedAt createdAt').sort({ createdAt: -1, _id: -1 }).skip(skip).limit(options.limit).lean(),
    User.countDocuments(filter),
  ])
  return {
    items: users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      suspended: user.isSuspended === true,
      suspensionReason: user.suspensionReason ?? '',
      suspendedAt: user.suspendedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    })),
    pagination: { page: options.page, limit: options.limit, total, totalPages: Math.ceil(total / options.limit) },
  }
}

export async function updateUserSuspension(adminId: string, userId: string, input: UpdateUserSuspensionInput) {
  assertObjectId(userId, 'user ID')
  if (adminId === userId) throw new ConflictError('You cannot change your own account status')
  const existing = await User.findById(userId).select('_id name email role isSuspended')
  if (!existing) throw new NotFoundError('User not found')
  if (existing.role === 'admin') throw new ForbiddenError('Administrator accounts cannot be suspended here')

  const update = input.suspended
    ? { isSuspended: true, suspensionReason: input.reason, suspendedAt: new Date(), suspendedBy: new mongoose.Types.ObjectId(adminId) }
    : { isSuspended: false, suspensionReason: '', suspendedAt: null, suspendedBy: null }
  const user = await User.findOneAndUpdate(
    { _id: userId, role: { $in: ['founder', 'investor'] } },
    { $set: update },
    { new: true },
  ).select('name email role isSuspended suspensionReason suspendedAt createdAt')
  if (!user) throw new NotFoundError('User not found')

  const suspended = user.isSuspended === true
  emitActivity({
    actorId: adminId,
    type: suspended ? 'admin.user_suspended' : 'admin.user_restored',
    title: suspended ? 'User account suspended' : 'User account restored',
    description: `${user.name} (${user.email}) was ${suspended ? 'suspended' : 'restored'} by an administrator.${suspended && input.reason ? ` Reason: ${input.reason}` : ''}`,
    audienceUserIds: [adminId],
    audienceRoles: ['admin'],
    href: '/workspace',
    notifications: suspended ? [] : [{
      recipientId: userId,
      type: 'account.restored',
      title: 'Your DealRoom account has been restored',
      body: 'An administrator restored access to your account. You can sign in again.',
      href: '/login',
      entityType: 'user',
      entityId: userId,
    }],
  })

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      suspended,
      suspensionReason: user.suspensionReason ?? '',
      suspendedAt: user.suspendedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    },
  }
}

export async function listStartups(options: { search: string; visibility: string; page: number; limit: number }) {
  const filter: QueryFilter<IStartupProfile> = {}
  if (options.visibility === 'hidden') filter.moderationStatus = 'hidden'
  else if (options.visibility === 'visible') filter.moderationStatus = { $ne: 'hidden' }
  if (options.search) {
    const search = new RegExp(escapeRegex(options.search), 'i')
    filter.$or = [{ companyName: search }, { tagline: search }, { industry: search }]
  }
  const skip = (options.page - 1) * options.limit
  const [profiles, total] = await Promise.all([
    StartupProfile.find(filter).select('founder companyName tagline industry stage status moderationStatus moderationReason moderatedAt createdAt').sort({ updatedAt: -1, _id: -1 }).skip(skip).limit(options.limit).lean(),
    StartupProfile.countDocuments(filter),
  ])
  const founderIds = [...new Set(profiles.map((profile) => profile.founder.toString()))]
  const founders = await User.find({ _id: { $in: founderIds } }).select('name email').lean()
  const founderById = new Map(founders.map((founder) => [founder._id.toString(), founder] as const))
  return {
    items: profiles.map((profile) => {
      const founder = founderById.get(profile.founder.toString())
      return {
        id: profile._id.toString(),
        companyName: profile.companyName,
        tagline: profile.tagline,
        industry: profile.industry,
        stage: profile.stage,
        status: profile.status,
        hidden: profile.moderationStatus === 'hidden',
        moderationReason: profile.moderationReason ?? '',
        moderatedAt: profile.moderatedAt?.toISOString() ?? null,
        founder: founder ? { id: founder._id.toString(), name: founder.name, email: founder.email } : null,
        createdAt: profile.createdAt.toISOString(),
      }
    }),
    pagination: { page: options.page, limit: options.limit, total, totalPages: Math.ceil(total / options.limit) },
  }
}

export async function updateStartupModeration(adminId: string, startupId: string, input: UpdateStartupModerationInput) {
  assertObjectId(startupId, 'startup ID')
  const existing = await StartupProfile.findById(startupId).select('founder companyName status moderationStatus')
  if (!existing) throw new NotFoundError('Startup profile not found')

  const update = input.hidden
    ? { moderationStatus: 'hidden', moderationReason: input.reason, moderatedAt: new Date(), moderatedBy: new mongoose.Types.ObjectId(adminId) }
    : { moderationStatus: 'visible', moderationReason: '', moderatedAt: null, moderatedBy: null }
  const startup = await StartupProfile.findByIdAndUpdate(startupId, { $set: update }, { new: true })
  if (!startup) throw new NotFoundError('Startup profile not found')
  const founderId = startup.founder.toString()
  const hidden = startup.moderationStatus === 'hidden'
  emitActivity({
    actorId: adminId,
    type: hidden ? 'admin.startup_hidden' : 'admin.startup_restored',
    title: hidden ? 'Startup listing hidden' : 'Startup listing restored',
    description: `${startup.companyName || 'A startup'} was ${hidden ? 'hidden from discovery' : 'restored to discovery'} by an administrator.${hidden && input.reason ? ` Reason: ${input.reason}` : ''}`,
    audienceUserIds: [adminId, founderId],
    audienceRoles: ['admin'],
    startupId,
    href: '/workspace',
    notifications: [{
      recipientId: founderId,
      type: hidden ? 'startup.hidden' : 'startup.restored',
      title: hidden ? 'Your startup listing was hidden' : 'Your startup listing was restored',
      body: hidden ? (input.reason || 'An administrator temporarily hid this listing from discovery.') : 'Your startup listing is visible in discovery again.',
      href: '/workspace',
      entityType: 'startup',
      entityId: startupId,
    }],
  })
  return { startup: { id: startup._id.toString(), companyName: startup.companyName, hidden, moderationReason: startup.moderationReason ?? '', moderatedAt: startup.moderatedAt?.toISOString() ?? null } }
}
