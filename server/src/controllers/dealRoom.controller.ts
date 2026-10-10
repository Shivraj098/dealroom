import type { Request, Response, NextFunction } from 'express'
import type { UserRole } from '../models/User'
import { BadRequestError, ForbiddenError, UnauthorizedError } from '../utils/errors'
import * as dealRoomService from '../services/dealRoom.service'
import type {
  CreateInformationRequestInput,
  PrivateNoteInput,
  RespondToInformationRequestInput,
  SaveEvaluationInput,
  UpdateDealRoomStatusInput,
} from '../validators/dealRoom.validator'

type RoomRole = 'founder' | 'investor'

function authenticatedUser(req: Request) {
  if (!req.user) throw new UnauthorizedError('Authentication required')
  return req.user
}

function roomRole(role: UserRole): RoomRole {
  if (role !== 'founder' && role !== 'investor') throw new ForbiddenError('Deal Rooms are available to founders and investors only')
  return role
}

function routeParam(req: Request, key: string): string {
  const value = req.params[key]
  if (typeof value !== 'string') throw new BadRequestError(`Invalid ${key}`)
  return value
}

export async function listMyRooms(req: Request, res: Response, next: NextFunction) {
  try {
    const user = authenticatedUser(req)
    res.json({ success: true, data: await dealRoomService.listMyDealRooms(user.id, roomRole(user.role)) })
  } catch (error) { next(error) }
}

export async function getRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const user = authenticatedUser(req)
    res.json({ success: true, data: await dealRoomService.getDealRoomDetails(routeParam(req, 'dealRoomId'), user.id, roomRole(user.role)) })
  } catch (error) { next(error) }
}

export async function changeStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const user = authenticatedUser(req)
    if (user.role !== 'investor') throw new ForbiddenError('Only the investor can finalize a Deal Room')
    res.json({ success: true, data: await dealRoomService.updateDealRoomStatus(routeParam(req, 'dealRoomId'), user.id, req.body as UpdateDealRoomStatusInput) })
  } catch (error) { next(error) }
}

export async function getEvaluation(req: Request, res: Response, next: NextFunction) {
  try {
    const user = authenticatedUser(req)
    if (user.role !== 'investor') throw new ForbiddenError('Evaluations are private to the investor')
    res.json({ success: true, data: await dealRoomService.getEvaluation(routeParam(req, 'dealRoomId'), user.id) })
  } catch (error) { next(error) }
}

export async function saveEvaluation(req: Request, res: Response, next: NextFunction) {
  try {
    const user = authenticatedUser(req)
    if (user.role !== 'investor') throw new ForbiddenError('Only the investor can edit an evaluation')
    res.json({ success: true, data: await dealRoomService.saveEvaluation(routeParam(req, 'dealRoomId'), user.id, req.body as SaveEvaluationInput) })
  } catch (error) { next(error) }
}

export async function listNotes(req: Request, res: Response, next: NextFunction) {
  try {
    const user = authenticatedUser(req)
    if (user.role !== 'investor') throw new ForbiddenError('Private notes are only available to the investor')
    res.json({ success: true, data: await dealRoomService.listPrivateNotes(routeParam(req, 'dealRoomId'), user.id) })
  } catch (error) { next(error) }
}

export async function createNote(req: Request, res: Response, next: NextFunction) {
  try {
    const user = authenticatedUser(req)
    if (user.role !== 'investor') throw new ForbiddenError('Only the investor can create private notes')
    res.status(201).json({ success: true, data: await dealRoomService.createPrivateNote(routeParam(req, 'dealRoomId'), user.id, req.body as PrivateNoteInput) })
  } catch (error) { next(error) }
}

export async function updateNote(req: Request, res: Response, next: NextFunction) {
  try {
    const user = authenticatedUser(req)
    if (user.role !== 'investor') throw new ForbiddenError('Only the investor can edit private notes')
    res.json({ success: true, data: await dealRoomService.updatePrivateNote(routeParam(req, 'dealRoomId'), routeParam(req, 'noteId'), user.id, req.body as PrivateNoteInput) })
  } catch (error) { next(error) }
}

export async function deleteNote(req: Request, res: Response, next: NextFunction) {
  try {
    const user = authenticatedUser(req)
    if (user.role !== 'investor') throw new ForbiddenError('Only the investor can delete private notes')
    res.json({ success: true, data: await dealRoomService.deletePrivateNote(routeParam(req, 'dealRoomId'), routeParam(req, 'noteId'), user.id) })
  } catch (error) { next(error) }
}

export async function listInformationRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const user = authenticatedUser(req)
    res.json({ success: true, data: await dealRoomService.listInformationRequests(routeParam(req, 'dealRoomId'), user.id, roomRole(user.role)) })
  } catch (error) { next(error) }
}

export async function createInformationRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const user = authenticatedUser(req)
    if (user.role !== 'investor') throw new ForbiddenError('Only the investor can request information')
    res.status(201).json({ success: true, data: await dealRoomService.createInformationRequest(routeParam(req, 'dealRoomId'), user.id, req.body as CreateInformationRequestInput) })
  } catch (error) { next(error) }
}

export async function respondInformationRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const user = authenticatedUser(req)
    if (user.role !== 'founder') throw new ForbiddenError('Only the founder can respond to information requests')
    res.json({ success: true, data: await dealRoomService.respondToInformationRequest(routeParam(req, 'dealRoomId'), routeParam(req, 'requestId'), user.id, req.body as RespondToInformationRequestInput) })
  } catch (error) { next(error) }
}

export async function closeInformationRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const user = authenticatedUser(req)
    if (user.role !== 'investor') throw new ForbiddenError('Only the investor can close an information request')
    res.json({ success: true, data: await dealRoomService.closeInformationRequest(routeParam(req, 'dealRoomId'), routeParam(req, 'requestId'), user.id) })
  } catch (error) { next(error) }
}
