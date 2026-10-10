import mongoose from 'mongoose'
import { DealRoom, type IDealRoom } from '../models/DealRoom'
import { DealRoomEvaluation, EVALUATION_CATEGORIES, type EvaluationCategory, type IDealRoomEvaluation } from '../models/DealRoomEvaluation'
import { InformationRequest, type IInformationRequest } from '../models/InformationRequest'
import { PrivateNote, type IPrivateNote } from '../models/PrivateNote'
import { InvestorProfile } from '../models/InvestorProfile'
import { StartupProfile } from '../models/StartupProfile'
import { User } from '../models/User'
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../utils/errors'
import { emitActivity } from './activity.service'
import type {
  CreateInformationRequestInput,
  PrivateNoteInput,
  RespondToInformationRequestInput,
  SaveEvaluationInput,
  UpdateDealRoomStatusInput,
} from '../validators/dealRoom.validator'

type RoomRole = 'founder' | 'investor'

function assertObjectId(value: string, label: string): void {
  if (!mongoose.isValidObjectId(value)) throw new BadRequestError(`Invalid ${label}`)
}

function roomFilter(roomId: string, userId: string, role: RoomRole) {
  return role === 'founder'
    ? { _id: roomId, founder: userId }
    : { _id: roomId, investor: userId }
}

async function getAccessibleRoom(roomId: string, userId: string, role: RoomRole): Promise<IDealRoom> {
  assertObjectId(roomId, 'Deal Room ID')
  const room = await DealRoom.findOne(roomFilter(roomId, userId, role))
  if (!room) throw new NotFoundError('Deal Room not found')
  return room
}

function assertActive(room: IDealRoom): void {
  if (room.status !== 'active') {
    throw new ConflictError(`This Deal Room is ${room.status} and can no longer be changed`)
  }
}

function roomSummary(room: IDealRoom) {
  return {
    id: room._id.toString(),
    status: room.status,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  }
}

function noteDto(note: IPrivateNote) {
  return {
    id: note._id.toString(),
    title: note.title,
    content: note.content,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  }
}

function informationRequestDto(item: IInformationRequest) {
  return {
    id: item._id.toString(),
    title: item.title,
    description: item.description,
    status: item.status,
    responseText: item.responseText,
    responseLink: item.responseLink,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    respondedAt: item.respondedAt ?? null,
    closedAt: item.closedAt ?? null,
  }
}

function evaluationDto(evaluation: IDealRoomEvaluation | null) {
  if (!evaluation) return null
  const scores = {} as Record<EvaluationCategory, number | null>
  for (const category of EVALUATION_CATEGORIES) {
    scores[category] = evaluation.scores?.[category] ?? null
  }
  return {
    id: evaluation._id.toString(),
    scores,
    summary: evaluation.summary,
    createdAt: evaluation.createdAt,
    updatedAt: evaluation.updatedAt,
  }
}

export async function listMyDealRooms(userId: string, role: RoomRole) {
  const rooms = await DealRoom.find(role === 'founder' ? { founder: userId } : { investor: userId })
    .sort({ updatedAt: -1, _id: -1 })
    .limit(100)
  if (rooms.length === 0) return { items: [] }

  const startupIds = [...new Set(rooms.map((room) => room.startup.toString()))]
  const otherUserIds = [...new Set(rooms.map((room) => (role === 'founder' ? room.investor : room.founder).toString()))]
  const [startups, otherUsers, investorProfiles] = await Promise.all([
    StartupProfile.find({ _id: { $in: startupIds } }).select('companyName tagline industry stage'),
    User.find({ _id: { $in: otherUserIds } }).select('name'),
    role === 'founder'
      ? InvestorProfile.find({ user: { $in: otherUserIds } }).select('user organizationName')
      : Promise.resolve([]),
  ])

  const startupById = new Map(startups.map((startup) => [startup._id.toString(), startup] as const))
  const userById = new Map(otherUsers.map((user) => [user._id.toString(), user] as const))
  const organizationByInvestorId = new Map(investorProfiles.map((profile) => [profile.user.toString(), profile.organizationName] as const))

  const items = rooms.flatMap((room) => {
    const startup = startupById.get(room.startup.toString())
    const otherUserId = (role === 'founder' ? room.investor : room.founder).toString()
    const otherUser = userById.get(otherUserId)
    // A missing related profile/account should not make this list fail entirely.
    if (!startup || !otherUser) return []
    return [{
      ...roomSummary(room),
      startup: {
        id: startup._id.toString(),
        companyName: startup.companyName,
        tagline: startup.tagline,
        industry: startup.industry,
        stage: startup.stage,
      },
      otherParty: {
        id: otherUser._id.toString(),
        name: otherUser.name,
        organizationName: role === 'founder'
          ? organizationByInvestorId.get(otherUserId) || otherUser.name
          : otherUser.name,
      },
    }]
  })
  return { items }
}

export async function getDealRoomDetails(roomId: string, userId: string, role: RoomRole) {
  const room = await getAccessibleRoom(roomId, userId, role)
  const [startup, founder, investor, investorProfile] = await Promise.all([
    StartupProfile.findById(room.startup),
    User.findById(room.founder).select('name'),
    User.findById(room.investor).select('name'),
    InvestorProfile.findOne({ user: room.investor }).select('organizationName'),
  ])

  if (!startup || !founder || !investor) throw new NotFoundError('Deal Room details are unavailable')

  return {
    room: roomSummary(room),
    viewerRole: role,
    startup: {
      id: startup._id.toString(),
      companyName: startup.companyName,
      tagline: startup.tagline,
      description: startup.description,
      website: startup.website,
      industry: startup.industry,
      foundedYear: startup.foundedYear ?? null,
      teamSize: startup.teamSize,
      headquarters: startup.headquarters,
      stage: startup.stage,
      problem: startup.problem,
      solution: startup.solution,
      targetMarket: startup.targetMarket,
      businessModel: startup.businessModel,
      traction: startup.traction,
      fundraising: startup.fundraising,
      teamMembers: startup.teamMembers,
    },
    founder: { id: founder._id.toString(), name: founder.name },
    investor: {
      id: investor._id.toString(),
      name: investor.name,
      organizationName: investorProfile?.organizationName || investor.name,
    },
  }
}

export async function updateDealRoomStatus(
  roomId: string,
  investorId: string,
  input: UpdateDealRoomStatusInput,
): Promise<{ room: ReturnType<typeof roomSummary> }> {
  const room = await getAccessibleRoom(roomId, investorId, 'investor')
  assertActive(room)

  const updated = await DealRoom.findOneAndUpdate(
    { _id: room._id, investor: investorId, status: 'active' },
    { $set: { status: input.status } },
    { new: true, runValidators: true },
  )
  if (!updated) throw new ConflictError('The Deal Room status changed. Refresh and try again.')
  const startup = await StartupProfile.findById(room.startup).select('companyName')
  emitActivity({
    actorId: investorId,
    type: `deal_room.${input.status}`,
    title: input.status === 'approved' ? 'Opportunity approved' : 'Opportunity passed',
    description: `${startup?.companyName || 'The startup'} was marked ${input.status} by the investor.`,
    audienceUserIds: [investorId, room.founder.toString()],
    dealRoomId: room._id.toString(),
    startupId: room.startup.toString(),
    href: `/deal-rooms/${room._id.toString()}`,
    notifications: [{
      recipientId: room.founder.toString(),
      type: `deal_room.${input.status}`,
      title: input.status === 'approved' ? 'Your opportunity was approved' : 'The investor passed on the opportunity',
      body: `${startup?.companyName || 'Your startup'} was marked ${input.status}.`,
      href: `/deal-rooms/${room._id.toString()}`,
      entityType: 'deal-room',
      entityId: room._id.toString(),
    }],
  })
  return { room: roomSummary(updated) }
}

export async function getEvaluation(roomId: string, investorId: string) {
  const room = await getAccessibleRoom(roomId, investorId, 'investor')
  const evaluation = await DealRoomEvaluation.findOne({ dealRoom: room._id, investor: investorId })
  return { evaluation: evaluationDto(evaluation) }
}

export async function saveEvaluation(roomId: string, investorId: string, input: SaveEvaluationInput) {
  const room = await getAccessibleRoom(roomId, investorId, 'investor')
  assertActive(room)
  const setValues: Record<string, unknown> = {}
  for (const [category, score] of Object.entries(input.scores ?? {})) {
    if (score !== undefined) setValues[`scores.${category}`] = score
  }
  if (input.summary !== undefined) setValues.summary = input.summary

  const evaluation = await DealRoomEvaluation.findOneAndUpdate(
    { dealRoom: room._id },
    { $set: setValues, $setOnInsert: { dealRoom: room._id, investor: room.investor } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  )
  return { evaluation: evaluationDto(evaluation) }
}

export async function listPrivateNotes(roomId: string, investorId: string) {
  const room = await getAccessibleRoom(roomId, investorId, 'investor')
  const notes = await PrivateNote.find({ dealRoom: room._id, investor: investorId }).sort({ updatedAt: -1, _id: -1 }).limit(100)
  return { items: notes.map(noteDto) }
}

export async function createPrivateNote(roomId: string, investorId: string, input: PrivateNoteInput) {
  const room = await getAccessibleRoom(roomId, investorId, 'investor')
  assertActive(room)
  const note = await PrivateNote.create({ dealRoom: room._id, investor: investorId, title: input.title, content: input.content })
  return { note: noteDto(note) }
}

export async function updatePrivateNote(roomId: string, noteId: string, investorId: string, input: PrivateNoteInput) {
  assertObjectId(noteId, 'note ID')
  const room = await getAccessibleRoom(roomId, investorId, 'investor')
  assertActive(room)
  const note = await PrivateNote.findOneAndUpdate(
    { _id: noteId, dealRoom: room._id, investor: investorId },
    { $set: { title: input.title, content: input.content } },
    { new: true, runValidators: true },
  )
  if (!note) throw new NotFoundError('Private note not found')
  return { note: noteDto(note) }
}

export async function deletePrivateNote(roomId: string, noteId: string, investorId: string) {
  assertObjectId(noteId, 'note ID')
  const room = await getAccessibleRoom(roomId, investorId, 'investor')
  assertActive(room)
  const note = await PrivateNote.findOneAndDelete({ _id: noteId, dealRoom: room._id, investor: investorId })
  if (!note) throw new NotFoundError('Private note not found')
  return { deleted: true, noteId }
}

export async function listInformationRequests(roomId: string, userId: string, role: RoomRole) {
  const room = await getAccessibleRoom(roomId, userId, role)
  const items = await InformationRequest.find({ dealRoom: room._id }).sort({ createdAt: -1, _id: -1 }).limit(100)
  return { items: items.map(informationRequestDto) }
}

export async function createInformationRequest(roomId: string, investorId: string, input: CreateInformationRequestInput) {
  const room = await getAccessibleRoom(roomId, investorId, 'investor')
  assertActive(room)
  const item = await InformationRequest.create({
    dealRoom: room._id,
    startup: room.startup,
    founder: room.founder,
    investor: room.investor,
    title: input.title,
    description: input.description,
    status: 'open',
  })
  emitActivity({
    actorId: investorId,
    type: 'information_request.created',
    title: 'Information requested',
    description: `The investor requested information: ${item.title}.`,
    audienceUserIds: [investorId, room.founder.toString()],
    dealRoomId: room._id.toString(),
    startupId: room.startup.toString(),
    href: `/deal-rooms/${room._id.toString()}`,
    notifications: [{ recipientId: room.founder.toString(), type: 'information_request.created', title: 'New information request', body: `The investor requested: ${item.title}.`, href: `/deal-rooms/${room._id.toString()}`, entityType: 'information-request', entityId: item._id.toString() }],
  })
  return { item: informationRequestDto(item) }
}

export async function respondToInformationRequest(
  roomId: string,
  requestId: string,
  founderId: string,
  input: RespondToInformationRequestInput,
) {
  assertObjectId(requestId, 'information request ID')
  const room = await getAccessibleRoom(roomId, founderId, 'founder')
  assertActive(room)
  const existing = await InformationRequest.findOne({ _id: requestId, dealRoom: room._id, founder: founderId })
  if (!existing) throw new NotFoundError('Information request not found')
  if (existing.status === 'closed') throw new ConflictError('This information request is closed')

  const updated = await InformationRequest.findOneAndUpdate(
    { _id: requestId, dealRoom: room._id, founder: founderId, status: { $ne: 'closed' } },
    { $set: { responseText: input.responseText, responseLink: input.responseLink, status: 'responded', respondedAt: new Date() } },
    { new: true, runValidators: true },
  )
  if (!updated) throw new ConflictError('The information request was closed. Refresh and try again.')
  emitActivity({
    actorId: founderId,
    type: 'information_request.responded',
    title: 'Information request answered',
    description: `The founder responded to: ${updated.title}.`,
    audienceUserIds: [founderId, updated.investor.toString()],
    dealRoomId: room._id.toString(),
    startupId: room.startup.toString(),
    href: `/deal-rooms/${room._id.toString()}`,
    notifications: [{ recipientId: updated.investor.toString(), type: 'information_request.responded', title: 'A request has been answered', body: `The founder responded to: ${updated.title}.`, href: `/deal-rooms/${room._id.toString()}`, entityType: 'information-request', entityId: updated._id.toString() }],
  })
  return { item: informationRequestDto(updated) }
}

export async function closeInformationRequest(roomId: string, requestId: string, investorId: string) {
  assertObjectId(requestId, 'information request ID')
  const room = await getAccessibleRoom(roomId, investorId, 'investor')
  assertActive(room)
  const existing = await InformationRequest.findOne({ _id: requestId, dealRoom: room._id, investor: investorId })
  if (!existing) throw new NotFoundError('Information request not found')
  if (existing.status === 'closed') return { item: informationRequestDto(existing) }

  const updated = await InformationRequest.findOneAndUpdate(
    { _id: requestId, dealRoom: room._id, investor: investorId, status: { $ne: 'closed' } },
    { $set: { status: 'closed', closedAt: new Date() } },
    { new: true, runValidators: true },
  )
  if (!updated) {
    const latest = await InformationRequest.findOne({ _id: requestId, dealRoom: room._id, investor: investorId })
    if (latest?.status === 'closed') return { item: informationRequestDto(latest) }
    throw new ConflictError('The information request could not be closed. Refresh and try again.')
  }
  emitActivity({
    actorId: investorId,
    type: 'information_request.closed',
    title: 'Information request closed',
    description: `The investor closed the information request: ${updated.title}.`,
    audienceUserIds: [investorId, room.founder.toString()],
    dealRoomId: room._id.toString(),
    startupId: room.startup.toString(),
    href: `/deal-rooms/${room._id.toString()}`,
    notifications: [{ recipientId: room.founder.toString(), type: 'information_request.closed', title: 'Information request closed', body: `The investor closed: ${updated.title}.`, href: `/deal-rooms/${room._id.toString()}`, entityType: 'information-request', entityId: updated._id.toString() }],
  })
  return { item: informationRequestDto(updated) }
}

