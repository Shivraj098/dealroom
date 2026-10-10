import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'
import * as activityController from '../controllers/activity.controller'

const router = Router()
router.use(authenticate)
router.get('/', activityController.listMine)

export default router
