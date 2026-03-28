import { Request, Response, NextFunction } from 'express';
import * as tasksService from '../services/tasks.service';
import { AppError } from '../middlewares/errorHandler';

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projectId = req.query.project_id as string | undefined;
    res.json(await tasksService.getAllTasks(projectId));
  } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = await tasksService.getTaskById(req.params.id);
    if (!task) { const e: AppError = new Error('Task not found'); e.status = 404; return next(e); }
    res.json(task);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { title, department, project_id, description, status, progress_pct, assigned_to } = req.body;
    if (!title || !department || !project_id) {
      const e: AppError = new Error('title, department and project_id are required');
      e.status = 400; return next(e);
    }
    if (progress_pct !== undefined && (progress_pct < 0 || progress_pct > 100)) {
      const e: AppError = new Error('progress_pct must be between 0 and 100');
      e.status = 400; return next(e);
    }
    const task = await tasksService.createTask({ title, department, project_id, description, status, progress_pct, assigned_to });
    res.status(201).json(task);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = await tasksService.updateTask(req.params.id, req.body);
    if (!task) { const e: AppError = new Error('Task not found'); e.status = 404; return next(e); }
    res.json(task);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const deleted = await tasksService.deleteTask(req.params.id);
    if (!deleted) { const e: AppError = new Error('Task not found'); e.status = 404; return next(e); }
    res.json({ message: 'Task deleted' });
  } catch (err) { next(err); }
}
