import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateId(req: Request, _res: Response, next: NextFunction): void {
  const { id } = req.params;
  if (!UUID_REGEX.test(id)) {
    const err: AppError = new Error('Invalid ID format');
    err.status = 400;
    next(err);
    return;
  }
  next();
}
