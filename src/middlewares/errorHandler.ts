import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  status?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // PostgreSQL unique violation
  if (err.code === '23505') {
    res.status(400).json({ error: 'Duplicate value: ' + err.message });
    return;
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    res.status(409).json({ error: 'Conflict: referenced record exists or does not exist' });
    return;
  }

  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
}
