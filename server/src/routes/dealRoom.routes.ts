import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/authenticate'
import { csrfProtection } from '../middleware/csrfProtection'
import { validateBody } from '../middleware/validateRequest'
import * as dealRoomController from '../controllers/dealRoom.controller'
import {
  createInformationRequestSchema,
  createPrivateNoteSchema,
  respondToInformationRequestSchema,
  saveEvaluationSchema,
  updateDealRoomStatusSchema,
  updatePrivateNoteSchema,
} from '../validators/dealRoom.validator'

const router = Router()
router.use(authenticate, requireRole('founder', 'investor'))

router.get('/', dealRoomController.listMyRooms)
router.get('/:dealRoomId', dealRoomController.getRoom)
router.patch('/:dealRoomId/status', requireRole('investor'), csrfProtection, validateBody(updateDealRoomStatusSchema), dealRoomController.changeStatus)

router.get('/:dealRoomId/evaluation', requireRole('investor'), dealRoomController.getEvaluation)
router.put('/:dealRoomId/evaluation', requireRole('investor'), csrfProtection, validateBody(saveEvaluationSchema), dealRoomController.saveEvaluation)

router.get('/:dealRoomId/notes', requireRole('investor'), dealRoomController.listNotes)
router.post('/:dealRoomId/notes', requireRole('investor'), csrfProtection, validateBody(createPrivateNoteSchema), dealRoomController.createNote)
router.patch('/:dealRoomId/notes/:noteId', requireRole('investor'), csrfProtection, validateBody(updatePrivateNoteSchema), dealRoomController.updateNote)
router.delete('/:dealRoomId/notes/:noteId', requireRole('investor'), csrfProtection, dealRoomController.deleteNote)

router.get('/:dealRoomId/information-requests', dealRoomController.listInformationRequests)
router.post('/:dealRoomId/information-requests', requireRole('investor'), csrfProtection, validateBody(createInformationRequestSchema), dealRoomController.createInformationRequest)
router.patch('/:dealRoomId/information-requests/:requestId/respond', requireRole('founder'), csrfProtection, validateBody(respondToInformationRequestSchema), dealRoomController.respondInformationRequest)
router.patch('/:dealRoomId/information-requests/:requestId/close', requireRole('investor'), csrfProtection, dealRoomController.closeInformationRequest)

export default router
