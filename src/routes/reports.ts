import { Router } from 'express';
import * as ctrl from '../controllers/reports.controller';

const router = Router();

router.get('/progress-by-department', ctrl.progressByDepartment);
router.get('/export', ctrl.exportTasks);

export default router;
