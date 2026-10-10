import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/authenticate'
import { csrfProtection } from '../middleware/csrfProtection'
import * as startupDiscoveryController from '../controllers/startupDiscovery.controller'

const router = Router()

// Discovery and saved lists are investor-only; authorization is enforced server-side.
router.use(authenticate, requireRole('investor'))

router.get('/filters', startupDiscoveryController.getFilters)
router.get('/', startupDiscoveryController.listStartups)
router.put('/:startupId/saved', csrfProtection, startupDiscoveryController.saveStartup)
router.delete('/:startupId/saved', csrfProtection, startupDiscoveryController.unsaveStartup)
router.get('/:startupId', startupDiscoveryController.getStartup)

export default router
