import { Router } from 'express';
import { propertyController } from '../controllers/propertyController.js';
import { validate } from '../middleware/validationMiddleware.js';
import {
  bblParamSchema,
  searchQuerySchema,
  autocompleteQuerySchema,
  resolvePropertySchema,
} from '../validators/propertyValidator.js';

const router = Router();

router.get('/autocomplete', validate(autocompleteQuerySchema, 'query'), propertyController.autocomplete);
router.post('/resolve', validate(resolvePropertySchema, 'body'), propertyController.resolveProperty);
router.get('/search', validate(searchQuerySchema, 'query'), propertyController.search);
router.get('/:bbl/permits', validate(bblParamSchema, 'params'), propertyController.getPermitsByBBL);
router.get('/:bbl', validate(bblParamSchema, 'params'), propertyController.getByBBL);

export default router;
