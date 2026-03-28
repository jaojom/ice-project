import { Request, Response, NextFunction } from 'express';
import * as projectsService from '../services/projects.service';
import { AppError } from '../middlewares/errorHandler';

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await projectsService.getAllProjects());
  } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await projectsService.getProjectById(req.params.id);
    if (!project) { const e: AppError = new Error('Project not found'); e.status = 404; return next(e); }
    res.json(project);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, owner_id, description, status } = req.body;
    if (!name || !owner_id) {
      const e: AppError = new Error('name and owner_id are required');
      e.status = 400; return next(e);
    }
    const project = await projectsService.createProject(name, owner_id, description, status);
    res.status(201).json(project);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await projectsService.updateProject(req.params.id, req.body);
    if (!project) { const e: AppError = new Error('Project not found'); e.status = 404; return next(e); }
    res.json(project);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const deleted = await projectsService.deleteProject(req.params.id);
    if (!deleted) { const e: AppError = new Error('Project not found'); e.status = 404; return next(e); }
    res.json({ message: 'Project deleted' });
  } catch (err) { next(err); }
}
