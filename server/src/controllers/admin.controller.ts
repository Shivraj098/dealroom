import type { NextFunction, Request, Response } from 'express'
import { BadRequestError, UnauthorizedError } from '../utils/errors'
import * as adminService from '../services/admin.service'
import type { UpdateStartupModerationInput, UpdateUserSuspensionInput } from '../validators/admin.validator'
import { closeChatConnectionsForUser } from '../realtime/chatGateway'

function adminId(req: Request): string {
  if (!req.user) throw new UnauthorizedError('Authentication required')
  return req.user.id
}

function routeParam(req: Request, key: string): string {
  const value = req.params[key]
  if (typeof value !== 'string') throw new BadRequestError(`Invalid ${key}`)
  return value
}

function queryString(req: Request, key: string, fallback = ''): string {
  const value = req.query[key]
  if (value === undefined) return fallback
  if (typeof value !== 'string') throw new BadRequestError(`Invalid ${key}`)
  return value.trim().slice(0, 100)
}

function queryNumber(req: Request, key: string, fallback: number, max: number): number {
  const raw = req.query[key]
  if (raw === undefined) return fallback
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) throw new BadRequestError(`Invalid ${key}`)
  const value = Number(raw)
  if (!Number.isSafeInteger(value) || value < 1 || value > max) throw new BadRequestError(`Invalid ${key}`)
  return value
}

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await adminService.listUsers({
      search: queryString(req, 'search'),
      role: queryString(req, 'role'),
      status: queryString(req, 'status'),
      page: queryNumber(req, 'page', 1, 10000),
      limit: queryNumber(req, 'limit', 20, 50),
    })
    res.json({ success: true, data })
  } catch (error) { next(error) }
}

export async function suspendUser(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = routeParam(req, 'userId')
    const result = await adminService.updateUserSuspension(adminId(req), userId, req.body as UpdateUserSuspensionInput)
    if (result.user.suspended) closeChatConnectionsForUser(userId)
    res.json({ success: true, data: result })
  } catch (error) { next(error) }
}

export async function listStartups(req: Request, res: Response, next: NextFunction) {
  try {
    const visibility = queryString(req, 'visibility', 'all')
    if (!['all', 'visible', 'hidden'].includes(visibility)) throw new BadRequestError('Invalid visibility filter')
    res.json({ success: true, data: await adminService.listStartups({
      search: queryString(req, 'search'),
      visibility,
      page: queryNumber(req, 'page', 1, 10000),
      limit: queryNumber(req, 'limit', 20, 50),
    }) })
  } catch (error) { next(error) }
}

export async function moderateStartup(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await adminService.updateStartupModeration(adminId(req), routeParam(req, 'startupId'), req.body as UpdateStartupModerationInput) }) }
  catch (error) { next(error) }
}
