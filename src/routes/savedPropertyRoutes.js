import { Router } from 'express';
import { savedPropertyController } from '../controllers/savedPropertyController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import { createSavedPropertySchema } from '../validators/savedPropertyValidator.js';

const router = Router();

// Protect all saved property routes with requireAuth
router.use(requireAuth);

router.get('/', savedPropertyController.getSavedProperties);
router.post('/', validate(createSavedPropertySchema), savedPropertyController.createSavedProperty);
router.get('/check/:bbl', savedPropertyController.checkIsSaved);
router.delete('/bbl/:bbl', savedPropertyController.deleteSavedPropertyByBbl);
router.get('/:id', savedPropertyController.getSavedPropertyById);
router.delete('/:id', savedPropertyController.deleteSavedProperty);

export default router;
