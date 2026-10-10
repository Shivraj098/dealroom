import type { Request, Response, NextFunction } from 'express'
import { BadRequestError, UnauthorizedError } from '../utils/errors'
import { startupDiscoveryQuerySchema } from '../validators/startupDiscovery.validator'
import * as startupDiscoveryService from '../services/startupDiscovery.service'

function investorIdFromRequest(req: Request): string {
  if (!req.user) throw new UnauthorizedError('Authentication required')
  return req.user.id
}

function startupIdFromRequest(req: Request): string {
  const startupId = req.params.startupId
  if (typeof startupId !== 'string') throw new BadRequestError('Invalid startup ID')
  return startupId
}

export async function getFilters(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await startupDiscoveryService.getStartupDiscoveryFilters()
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function listStartups(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = startupDiscoveryQuerySchema.safeParse(req.query)
    if (!parsed.success) return next(parsed.error)

    const data = await startupDiscoveryService.listDiscoverableStartups(investorIdFromRequest(req), parsed.data)
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function getStartup(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await startupDiscoveryService.getDiscoverableStartup(investorIdFromRequest(req), startupIdFromRequest(req))
    res.json({ success: true, data: { startup: data } })
  } catch (error) {
    next(error)
  }
}

export async function saveStartup(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await startupDiscoveryService.saveStartup(investorIdFromRequest(req), startupIdFromRequest(req))
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function unsaveStartup(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await startupDiscoveryService.unsaveStartup(investorIdFromRequest(req), startupIdFromRequest(req))
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}
