import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { env } from '../config/env.js';
import { Admin } from '../models/Admin.js';
import { asyncHandler, AppError, validate } from '../lib/http.js';
import { requireAuth, SESSION_COOKIE } from '../middleware/auth.js';

export const authRouter = Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false });
const credentialsSchema = z.object({ email: z.string().email(), password: z.string().min(8) });
const cookieOptions = () => ({
  httpOnly: true,
  secure: env.COOKIE_SECURE === 'true' || env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 8 * 60 * 60 * 1000,
});

authRouter.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  const { email, password } = validate(credentialsSchema, req.body);
  const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+passwordHash').lean<any>();
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }
  const payload = { id: admin._id.toString(), email: admin.email, role: admin.role };
  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '8h' });
  res.cookie(SESSION_COOKIE, token, cookieOptions()).json({ success: true, data: payload });
}));

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(SESSION_COOKIE, { ...cookieOptions(), maxAge: undefined }).json({ success: true, data: null });
});

authRouter.get('/me', requireAuth, (req, res) => res.json({ success: true, data: req.admin }));
