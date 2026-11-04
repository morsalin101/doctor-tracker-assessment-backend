import { Router } from 'express';
import { Patient } from '../models/Patient.js';
import { Doctor } from '../models/Doctor.js';
import { asyncHandler, dateRange } from '../lib/http.js';

export const dashboardRouter = Router();

dashboardRouter.get('/summary', asyncHandler(async (req, res) => {
  const createdAt = dateRange(req.query.from as string, req.query.to as string);
  const patientMatch: any = createdAt ? { createdAt } : {};
  const [totalDoctors, totalPatients, patientsPerDoctor, registrationsByMonth, conditionDistribution, recentPatients] = await Promise.all([
    Doctor.countDocuments(),
    Patient.countDocuments(patientMatch),
    Patient.aggregate([
      { $match: patientMatch },
      { $group: { _id: '$doctorId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'doctors', localField: '_id', foreignField: '_id', as: 'doctor' } },
      { $unwind: '$doctor' },
      { $project: { _id: 0, doctorId: '$_id', doctorName: '$doctor.name', count: 1 } },
    ]),
    Patient.aggregate([
      { $match: patientMatch },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, period: '$_id', count: 1 } },
    ]),
    Patient.aggregate([
      { $match: patientMatch },
      { $group: { _id: '$condition', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      { $project: { _id: 0, condition: '$_id', count: 1 } },
    ]),
    Patient.find(patientMatch).populate('doctorId', 'name').sort({ createdAt: -1 }).limit(5).lean(),
  ]);
  res.json({
    success: true,
    data: { totals: { doctors: totalDoctors, patients: totalPatients }, patientsPerDoctor, registrationsByMonth, conditionDistribution, recentPatients },
  });
}));
