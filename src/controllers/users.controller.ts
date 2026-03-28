import { Request, Response, NextFunction } from 'express';
import * as usersService from '../services/users.service';
import { AppError } from '../middlewares/errorHandler';

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await usersService.getAllUsers();
    res.json(users);
  } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await usersService.getUserById(req.params.id);
    if (!user) { const e: AppError = new Error('User not found'); e.status = 404; return next(e); }
    res.json(user);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, department } = req.body;
    if (!name || !email || !department) {
      const e: AppError = new Error('name, email and department are required');
      e.status = 400; return next(e);
    }
    const user = await usersService.createUser(name, email, department);
    res.status(201).json(user);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await usersService.updateUser(req.params.id, req.body);
    if (!user) { const e: AppError = new Error('User not found'); e.status = 404; return next(e); }
    res.json(user);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const deleted = await usersService.deleteUser(req.params.id);
    if (!deleted) { const e: AppError = new Error('User not found'); e.status = 404; return next(e); }
    res.json({ message: 'User deleted' });
  } catch (err) { next(err); }
}
