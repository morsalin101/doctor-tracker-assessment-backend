import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/http.js';

export const notFound: RequestHandler = (_req, _res, next) => next(new AppError(404, 'NOT_FOUND', 'Resource not found.'));

export const errorHandler: ErrorRequestHandler = (error: any, _req, res, _next) => {
  void _next;
  if (error instanceof ZodError) {
    return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request.', fields: error.flatten().fieldErrors } });
  }
  const status = error instanceof AppError ? error.status : error?.code === 11000 ? 409 : 500;
  const code = error instanceof AppError ? error.code : error?.code === 11000 ? 'DUPLICATE_RECORD' : 'INTERNAL_ERROR';
  const message = error instanceof AppError ? error.message : error?.code === 11000 ? 'A record with that value already exists.' : 'Something went wrong.';
  return res.status(status).json({ success: false, error: { code, message, ...(error.fields ? { fields: error.fields } : {}) } });
};
