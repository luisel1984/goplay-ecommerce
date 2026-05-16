import { ZodError } from 'zod';
import { logger } from '../config/logger.js';
export class HttpError extends Error {
    status;
    code;
    constructor(status, message, code) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
export function errorHandler(err, _req, res, _next) {
    if (err instanceof ZodError) {
        return res.status(400).json({ error: 'validation_error', issues: err.issues });
    }
    if (err instanceof HttpError) {
        return res.status(err.status).json({ error: err.code || 'error', message: err.message });
    }
    logger.error({ err }, 'Unhandled error');
    res.status(500).json({ error: 'internal_error' });
}
export function notFound(_req, res) {
    res.status(404).json({ error: 'not_found' });
}
