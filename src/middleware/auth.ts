import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../lib/http.js';

export const SESSION_COOKIE = 'doctor_tracker_session';

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return next(new AppError(401, 'UNAUTHORIZED', 'Authentication is required.'));
  try {
    req.admin = jwt.verify(token, env.JWT_SECRET) as Request['admin'];
    next();
  } catch {
    next(new AppError(401, 'SESSION_EXPIRED', 'Your session has expired. Please sign in again.'));
  }
}
