import type { Request, Response, NextFunction } from 'express'
import * as profileService from '../services/profile.service'
import type { InvestorProfileInput, StartupProfileInput } from '../validators/profile.validator'
import { UnauthorizedError } from '../utils/errors'

function authenticatedUser(req: Request) {
  if (!req.user) throw new UnauthorizedError('Authentication required')
  return req.user
}

export async function getMyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = authenticatedUser(req)
    const data = await profileService.getMyProfile(user.id, user.role)
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function saveStartupProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = authenticatedUser(req)
    const profile = await profileService.saveStartupProfile(user.id, req.body as StartupProfileInput)
    res.json({ success: true, data: { profile } })
  } catch (error) {
    next(error)
  }
}

export async function saveInvestorProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = authenticatedUser(req)
    const profile = await profileService.saveInvestorProfile(user.id, req.body as InvestorProfileInput)
    res.json({ success: true, data: { profile } })
  } catch (error) {
    next(error)
  }
}
