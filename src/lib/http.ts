import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

export class AppError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: unknown) {
    super(message);
  }
}

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => void fn(req, res, next).catch(next);

export function validate<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError(422, 'VALIDATION_ERROR', 'Please correct the highlighted fields.', result.error.flatten().fieldErrors);
  }
  return result.data;
}

export function dateRange(from?: string, to?: string) {
  if (!from && !to) return undefined;
  const range: Record<string, Date> = {};
  if (from) range.$gte = new Date(`${from}T00:00:00.000Z`);
  if (to) range.$lte = new Date(`${to}T23:59:59.999Z`);
  return range;
}

export function pagination(query: Record<string, unknown>) {
  const page = Math.max(1, Number(query.page) || 1);
  const allowed = [10, 20, 50];
  const requested = Number(query.limit) || 10;
  const limit = allowed.includes(requested) ? requested : 10;
  return { page, limit, skip: (page - 1) * limit };
}
