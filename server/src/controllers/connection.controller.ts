import type { Request, Response, NextFunction } from 'express'
import type { UserRole } from '../models/User'
import { BadRequestError, ForbiddenError, UnauthorizedError } from '../utils/errors'
import * as connectionService from '../services/connection.service'
import type { CreateConnectionRequestInput } from '../validators/connection.validator'

function authenticatedUser(req: Request) {
  if (!req.user) throw new UnauthorizedError('Authentication required')
  return req.user
}

function routeParam(req: Request, key: string): string {
  const value = req.params[key]
  if (typeof value !== 'string') throw new BadRequestError(`Invalid ${key}`)
  return value
}

function connectionRole(role: UserRole): 'founder' | 'investor' {
  if (role !== 'founder' && role !== 'investor') {
    throw new ForbiddenError('This action is available to founders and investors only')
  }
  return role
}

export async function listRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const user = authenticatedUser(req)
    const data = await connectionService.listConnectionRequests(user.id, connectionRole(user.role))
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function getStartupStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const user = authenticatedUser(req)
    connectionRole(user.role)
    const data = await connectionService.getStartupConnectionStatus(user.id, routeParam(req, 'startupId'))
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function createRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const user = authenticatedUser(req)
    if (user.role !== 'investor') throw new ForbiddenError('Only investors can request startup connections')
    const data = await connectionService.createConnectionRequest(
      user.id,
      routeParam(req, 'startupId'),
      req.body as CreateConnectionRequestInput,
    )
    res.status(201).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function acceptRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const user = authenticatedUser(req)
    if (user.role !== 'founder') throw new ForbiddenError('Only founders can accept connection requests')
    const data = await connectionService.acceptConnectionRequest(user.id, routeParam(req, 'requestId'))
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function rejectRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const user = authenticatedUser(req)
    if (user.role !== 'founder') throw new ForbiddenError('Only founders can reject connection requests')
    const data = await connectionService.rejectConnectionRequest(user.id, routeParam(req, 'requestId'))
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}
