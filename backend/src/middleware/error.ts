import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger.js';

export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'validation_error', issues: err.issues });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.code || 'error', message: err.message });
  }
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'internal_error' });
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'not_found' });
}
