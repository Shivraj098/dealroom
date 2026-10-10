import mongoose from 'mongoose'
import { ConnectionRequest, type IConnectionRequest, type ConnectionRequestStatus } from '../models/ConnectionRequest'
import { DealRoom, type IDealRoom } from '../models/DealRoom'
import { InvestorProfile, type IInvestorProfile } from '../models/InvestorProfile'
import { StartupProfile, type IStartupProfile } from '../models/StartupProfile'
import { User, type IUser } from '../models/User'
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../utils/errors'
import type { CreateConnectionRequestInput } from '../validators/connection.validator'
import { emitActivity } from './activity.service'

type ConnectionRole = 'founder' | 'investor'

type RequestStatusDto = {
  id: string
  status: ConnectionRequestStatus
  message: string
  createdAt: Date
  respondedAt: Date | null
}

type DealRoomSummaryDto = {
  id: string
  status: IDealRoom['status']
  createdAt: Date
  updatedAt: Date
}

function assertObjectId(value: string, label: string): void {
  if (!mongoose.isValidObjectId(value)) throw new BadRequestError(`Invalid ${label}`)
}

function isDuplicateKeyError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 11000)
}

function requestStatusDto(request: IConnectionRequest): RequestStatusDto {
  return {
    id: request._id.toString(),
    status: request.status,
    message: request.message,
    createdAt: request.createdAt,
    respondedAt: request.respondedAt ?? null,
  }
}

function dealRoomSummary(room: IDealRoom | null): DealRoomSummaryDto | null {
  if (!room) return null
  return {
    id: room._id.toString(),
    status: room.status,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  }
}

async function ensureDealRoom(request: IConnectionRequest): Promise<IDealRoom> {
  let room = await DealRoom.findOne({ startup: request.startup, investor: request.investor })
  if (room) return room

  try {
    room = await DealRoom.create({
      startup: request.startup,
      founder: request.founder,
      investor: request.investor,
      connectionRequest: request._id,
      status: 'active',
    })
    return room
  } catch (error) {
    // Concurrent accepts can race. The compound unique index decides the winner;
    // the losing request reuses the room created by the winning request.
    if (!isDuplicateKeyError(error)) throw error
    const existingRoom = await DealRoom.findOne({ startup: request.startup, investor: request.investor })
    if (!existingRoom) throw error
    return existingRoom
  }
}

async function buildRequestItems(requests: IConnectionRequest[]) {
  if (requests.length === 0) return []

  const startupIds = [...new Set(requests.map((request) => request.startup.toString()))]
  const investorIds = [...new Set(requests.map((request) => request.investor.toString()))]
  const [startups, investors, investorProfiles, rooms] = await Promise.all([
    StartupProfile.find({ _id: { $in: startupIds } }).select('companyName tagline industry stage headquarters'),
    User.find({ _id: { $in: investorIds } }).select('name'),
    InvestorProfile.find({ user: { $in: investorIds } }).select('user organizationName'),
    DealRoom.find({ startup: { $in: startupIds }, investor: { $in: investorIds } }),
  ])

  const startupById = new Map<string, IStartupProfile>()
  for (const startup of startups) startupById.set(startup._id.toString(), startup as IStartupProfile)
  const investorById = new Map<string, IUser>()
  for (const investor of investors) investorById.set(investor._id.toString(), investor as IUser)
  const profileByInvestorId = new Map<string, IInvestorProfile>()
  for (const profile of investorProfiles) profileByInvestorId.set(profile.user.toString(), profile as IInvestorProfile)
  const roomByPair = new Map<string, IDealRoom>()
  for (const room of rooms) roomByPair.set(`${room.startup.toString()}:${room.investor.toString()}`, room)

  return requests.flatMap((request) => {
    const startup = startupById.get(request.startup.toString())
    const investor = investorById.get(request.investor.toString())
    // Do not return a partial card if one of the related accounts has been removed.
    if (!startup || !investor) return []

    const investorProfile = profileByInvestorId.get(investor._id.toString())
    const room = roomByPair.get(`${request.startup.toString()}:${request.investor.toString()}`) ?? null

    return [{
      id: request._id.toString(),
      status: request.status,
      message: request.message,
      createdAt: request.createdAt,
      respondedAt: request.respondedAt ?? null,
      startup: {
        id: startup._id.toString(),
        companyName: startup.companyName,
        tagline: startup.tagline,
        industry: startup.industry,
        stage: startup.stage,
        headquarters: startup.headquarters,
      },
      investor: {
        id: investor._id.toString(),
        name: investor.name,
        organizationName: investorProfile?.organizationName || investor.name,
      },
      dealRoom: dealRoomSummary(room),
    }]
  })
}

export async function listConnectionRequests(userId: string, role: ConnectionRole) {
  const filter = role === 'investor' ? { investor: userId } : { founder: userId }
  const requests = await ConnectionRequest.find(filter).sort({ createdAt: -1, _id: -1 }).limit(100)

  // Heal accepted requests if a transient database error interrupted room creation.
  // ensureDealRoom is idempotent and the unique pair index handles concurrent reads.
  await Promise.all(requests.filter((request) => request.status === 'accepted').map(ensureDealRoom))
  return { items: await buildRequestItems(requests) }
}

export async function getStartupConnectionStatus(investorId: string, startupId: string) {
  assertObjectId(startupId, 'startup ID')
  const startup = await StartupProfile.findOne({ _id: startupId, status: 'published', moderationStatus: { $ne: 'hidden' } }).select('_id')
  if (!startup) throw new NotFoundError('Startup not found')

  const request = await ConnectionRequest.findOne({ investor: investorId, startup: startup._id }).sort({ createdAt: -1, _id: -1 })
  let room: IDealRoom | null = await DealRoom.findOne({ investor: investorId, startup: startup._id })
  // Self-heal the rare case where the request status was committed but room creation failed.
  if (request?.status === 'accepted' && !room) room = await ensureDealRoom(request)

  return {
    request: request ? requestStatusDto(request) : null,
    dealRoom: dealRoomSummary(room),
  }
}

export async function createConnectionRequest(investorId: string, startupId: string, input: CreateConnectionRequestInput) {
  assertObjectId(startupId, 'startup ID')

  const startup = await StartupProfile.findOne({ _id: startupId, status: 'published', moderationStatus: { $ne: 'hidden' } })
  if (!startup) throw new NotFoundError('Startup not found')

  const investorProfile = await InvestorProfile.findOne({ user: investorId })
  if (!investorProfile || investorProfile.status !== 'published') {
    throw new ForbiddenError('Publish your investor profile before requesting a connection')
  }

  const existingRoom = await DealRoom.findOne({ startup: startup._id, investor: investorId })
  if (existingRoom) throw new ConflictError('A Deal Room already exists for this startup and investor')

  const priorAccepted = await ConnectionRequest.findOne({ investor: investorId, startup: startup._id, status: 'accepted' })
  if (priorAccepted) {
    // Recover a previously accepted request if the room was not persisted for an earlier attempt.
    await ensureDealRoom(priorAccepted)
    throw new ConflictError('This connection has already been accepted')
  }

  const pending = await ConnectionRequest.findOne({ investor: investorId, startup: startup._id, status: 'pending' })
  if (pending) throw new ConflictError('A connection request is already pending')

  const request = new ConnectionRequest({
    startup: startup._id,
    founder: startup.founder,
    investor: new mongoose.Types.ObjectId(investorId),
    message: input.message ?? '',
    status: 'pending',
  })

  try {
    await request.save()
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new ConflictError('A connection request is already pending')
    }
    throw error
  }

  emitActivity({
    actorId: investorId,
    type: 'connection.requested',
    title: 'Connection request sent',
    description: `An investor requested an introduction to ${startup.companyName}.`,
    audienceUserIds: [investorId, startup.founder.toString()],
    startupId: startup._id.toString(),
    href: '/workspace',
    notifications: [{
      recipientId: startup.founder.toString(),
      type: 'connection.requested',
      title: 'New investor introduction',
      body: `An investor requested a connection with ${startup.companyName}.`,
      href: '/workspace',
      entityType: 'connection-request',
      entityId: request._id.toString(),
    }],
  })

  return { request: requestStatusDto(request), dealRoom: null }
}

export async function acceptConnectionRequest(founderId: string, requestId: string) {
  assertObjectId(requestId, 'connection request ID')
  let request = await ConnectionRequest.findOne({ _id: requestId, founder: founderId })
  if (!request) throw new NotFoundError('Connection request not found')
  if (request.status === 'rejected') throw new ConflictError('This connection request was already rejected')

  let newlyAccepted = false
  if (request.status === 'pending') {
    const publishedStartup = await StartupProfile.findOne({
      _id: request.startup,
      founder: founderId,
      status: 'published',
      moderationStatus: { $ne: 'hidden' },
    }).select('_id')
    if (!publishedStartup) throw new ConflictError('Publish your startup profile before accepting connection requests')

    const updated = await ConnectionRequest.findOneAndUpdate(
      { _id: request._id, founder: founderId, status: 'pending' },
      { $set: { status: 'accepted', respondedAt: new Date() } },
      { new: true },
    )
    if (updated) {
      newlyAccepted = true
      request = updated
    } else {
      const latest = await ConnectionRequest.findOne({ _id: request._id, founder: founderId })
      if (!latest) throw new NotFoundError('Connection request not found')
      if (latest.status === 'rejected') throw new ConflictError('This connection request was already rejected')
      request = latest
    }
  }

  const room = await ensureDealRoom(request)
  if (newlyAccepted) {
    const startup = await StartupProfile.findById(request.startup).select('companyName')
    emitActivity({
      actorId: founderId,
      type: 'connection.accepted',
      title: 'Connection request accepted',
      description: `Your introduction request for ${startup?.companyName || 'a startup'} was accepted and a Deal Room was created.`,
      audienceUserIds: [founderId, request.investor.toString()],
      startupId: request.startup.toString(),
      dealRoomId: room._id.toString(),
      href: `/deal-rooms/${room._id.toString()}`,
      notifications: [{
        recipientId: request.investor.toString(),
        type: 'connection.accepted',
        title: 'Your introduction was accepted',
        body: `A private Deal Room for ${startup?.companyName || 'the startup'} is ready.`,
        href: `/deal-rooms/${room._id.toString()}`,
        entityType: 'deal-room',
        entityId: room._id.toString(),
      }],
    })
  }
  return { request: requestStatusDto(request), dealRoom: dealRoomSummary(room) }
}

export async function rejectConnectionRequest(founderId: string, requestId: string) {
  assertObjectId(requestId, 'connection request ID')
  const request = await ConnectionRequest.findOne({ _id: requestId, founder: founderId })
  if (!request) throw new NotFoundError('Connection request not found')
  if (request.status === 'accepted') throw new ConflictError('An accepted connection cannot be rejected')
  if (request.status === 'rejected') return { request: requestStatusDto(request), dealRoom: null }

  const updated = await ConnectionRequest.findOneAndUpdate(
    { _id: request._id, founder: founderId, status: 'pending' },
    { $set: { status: 'rejected', respondedAt: new Date() } },
    { new: true },
  )
  if (updated) {
    const startup = await StartupProfile.findById(updated.startup).select('companyName')
    emitActivity({
      actorId: founderId,
      type: 'connection.rejected',
      title: 'Connection request declined',
      description: `The introduction request for ${startup?.companyName || 'a startup'} was declined.`,
      audienceUserIds: [founderId, updated.investor.toString()],
      startupId: updated.startup.toString(),
      href: '/workspace',
      notifications: [{
        recipientId: updated.investor.toString(),
        type: 'connection.rejected',
        title: 'Your introduction was declined',
        body: `The request for ${startup?.companyName || 'the startup'} was declined. You can send a new request later.`,
        href: '/workspace',
        entityType: 'connection-request',
        entityId: updated._id.toString(),
      }],
    })
    return { request: requestStatusDto(updated), dealRoom: null }
  }

  const latest = await ConnectionRequest.findOne({ _id: request._id, founder: founderId })
  if (!latest) throw new NotFoundError('Connection request not found')
  if (latest.status === 'accepted') throw new ConflictError('An accepted connection cannot be rejected')
  return { request: requestStatusDto(latest), dealRoom: null }
}
