import { Router } from 'express';
import usersRouter from './users';
import projectsRouter from './projects';
import tasksRouter from './tasks';
import reportsRouter from './reports';

const router = Router();

router.use('/users', usersRouter);
router.use('/projects', projectsRouter);
router.use('/tasks', tasksRouter);
router.use('/reports', reportsRouter);

export default router;
