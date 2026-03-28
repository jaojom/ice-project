import { Router } from 'express';
import { validateId } from '../middlewares/validateId';
import * as ctrl from '../controllers/tasks.controller';

const router = Router();

router.get('/', ctrl.getAll);
router.get('/:id', validateId, ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', validateId, ctrl.update);
router.delete('/:id', validateId, ctrl.remove);

export default router;
