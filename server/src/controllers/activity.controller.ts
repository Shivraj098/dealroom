import type { NextFunction, Request, Response } from 'express'
import { UnauthorizedError } from '../utils/errors'
import * as activityService from '../services/activity.service'

export async function listMine(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required')
    res.json({ success: true, data: await activityService.listUserActivity(req.user.id) })
  } catch (error) { next(error) }
}

export async function listAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: await activityService.listAdminActivity() })
  } catch (error) { next(error) }
}
