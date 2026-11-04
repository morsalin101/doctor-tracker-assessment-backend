import { Router } from 'express';
import { isValidObjectId } from 'mongoose';
import { z } from 'zod';
import { Doctor } from '../models/Doctor.js';
import { Patient } from '../models/Patient.js';
import { AppError, asyncHandler, dateRange, pagination, validate } from '../lib/http.js';

export const doctorsRouter = Router();

const doctorSchema = z.object({
  name: z.string().trim().min(2).max(100),
  specialization: z.string().trim().min(2).max(100),
  hospital: z.string().trim().min(2).max(140),
  phone: z.string().trim().min(6).max(24),
  email: z.string().email().transform((v) => v.toLowerCase()),
});

const patientCreateSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  dateOfBirth: z.coerce.date().max(new Date()),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  phone: z.string().trim().min(6).max(24),
  email: z.union([z.literal(''), z.string().email()]).optional().default(''),
  address: z.string().trim().max(240).optional().default(''),
  condition: z.string().trim().min(2).max(120),
});

doctorsRouter.get('/filter-options', asyncHandler(async (_req, res) => {
  const [specializations, hospitals] = await Promise.all([
    Doctor.distinct('specialization'),
    Doctor.distinct('hospital'),
  ]);
  res.json({ success: true, data: { specializations: specializations.sort(), hospitals: hospitals.sort() } });
}));

doctorsRouter.get('/', asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const filter: any = {};
  if (req.query.search) filter.$text = { $search: String(req.query.search) };
  if (req.query.specialization) filter.specialization = String(req.query.specialization);
  if (req.query.hospital) filter.hospital = String(req.query.hospital);
  const createdAt = dateRange(req.query.from as string, req.query.to as string);
  if (createdAt) filter.createdAt = createdAt;

  const [data, total] = await Promise.all([
    Doctor.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Doctor.countDocuments(filter),
  ]);
  res.json({ success: true, data, meta: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
}));

doctorsRouter.post('/', asyncHandler(async (req, res) => {
  const input = validate(doctorSchema, req.body);
  const doctor = await Doctor.create(input);
  res.status(201).json({ success: true, data: doctor });
}));

doctorsRouter.get('/:id', asyncHandler(async (req, res) => {
  if (!isValidObjectId(String(req.params.id))) throw new AppError(404, 'DOCTOR_NOT_FOUND', 'Doctor not found.');
  const [doctor, patientCount] = await Promise.all([
    Doctor.findById(String(req.params.id)).lean(),
    Patient.countDocuments({ doctorId: String(req.params.id) }),
  ]);
  if (!doctor) throw new AppError(404, 'DOCTOR_NOT_FOUND', 'Doctor not found.');
  res.json({ success: true, data: { ...doctor, patientCount } });
}));

doctorsRouter.post('/:id/patients', asyncHandler(async (req, res) => {
  if (!isValidObjectId(String(req.params.id)) || !(await Doctor.exists({ _id: String(req.params.id) }))) {
    throw new AppError(404, 'DOCTOR_NOT_FOUND', 'Doctor not found.');
  }
  const input = validate(patientCreateSchema, req.body);
  const patient = await Patient.create({ ...input, doctorId: String(req.params.id) });
  const populated = await patient.populate('doctorId', 'name specialization hospital');
  res.status(201).json({ success: true, data: populated });
}));
