import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5001),
  MONGODB_URI: z.string().min(1),
  MONGODB_DB_NAME: z.string().default('doctor_tracking'),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:3000'),
  JWT_SECRET: z.string().min(32),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(12).optional(),
  COOKIE_SECURE: z.enum(['true', 'false']).default('false'),
});

export const env = schema.parse(process.env);
