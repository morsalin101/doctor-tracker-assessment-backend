import { Router } from 'express';
import { isValidObjectId } from 'mongoose';
import { z } from 'zod';
import { Patient } from '../models/Patient.js';
import { Doctor } from '../models/Doctor.js';
import { AppError, asyncHandler, dateRange, pagination, validate } from '../lib/http.js';

export const patientsRouter = Router();

const updateSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  dateOfBirth: z.coerce.date().max(new Date()).optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  phone: z.string().trim().min(6).max(24).optional(),
  email: z.union([z.literal(''), z.string().email()]).optional(),
  address: z.string().trim().max(240).optional(),
  condition: z.string().trim().min(2).max(120).optional(),
  doctorId: z.string().refine(isValidObjectId, 'Invalid doctor').optional(),
}).refine((value) => Object.keys(value).length > 0, 'At least one field is required.');

patientsRouter.get('/filter-options', asyncHandler(async (_req, res) => {
  const conditions = await Patient.distinct('condition');
  res.json({ success: true, data: { conditions: conditions.sort() } });
}));

patientsRouter.get('/', asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const filter: any = {};
  if (req.query.search) filter.$text = { $search: String(req.query.search) };
  if (req.query.condition) filter.condition = String(req.query.condition);
  if (req.query.gender) filter.gender = String(req.query.gender);
  if (req.query.doctorId && isValidObjectId(String(req.query.doctorId))) filter.doctorId = String(req.query.doctorId);
  const createdAt = dateRange(req.query.from as string, req.query.to as string);
  if (createdAt) filter.createdAt = createdAt;
  const [data, total] = await Promise.all([
    Patient.find(filter).populate('doctorId', 'name specialization hospital').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Patient.countDocuments(filter),
  ]);
  res.json({ success: true, data, meta: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
}));

patientsRouter.patch('/:id', asyncHandler(async (req, res) => {
  if (!isValidObjectId(String(req.params.id))) throw new AppError(404, 'PATIENT_NOT_FOUND', 'Patient not found.');
  const input = validate(updateSchema, req.body);
  if (input.doctorId && !(await Doctor.exists({ _id: input.doctorId }))) throw new AppError(404, 'DOCTOR_NOT_FOUND', 'Doctor not found.');
  const patient = await Patient.findByIdAndUpdate(String(req.params.id), input, { returnDocument: 'after', runValidators: true }).populate('doctorId', 'name specialization hospital');
  if (!patient) throw new AppError(404, 'PATIENT_NOT_FOUND', 'Patient not found.');
  res.json({ success: true, data: patient });
}));

patientsRouter.delete('/:id', asyncHandler(async (req, res) => {
  if (!isValidObjectId(String(req.params.id))) throw new AppError(404, 'PATIENT_NOT_FOUND', 'Patient not found.');
  const patient = await Patient.findByIdAndDelete(String(req.params.id));
  if (!patient) throw new AppError(404, 'PATIENT_NOT_FOUND', 'Patient not found.');
  res.json({ success: true, data: { id: patient._id } });
}));
