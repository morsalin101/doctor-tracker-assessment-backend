import mongoose, { Schema, type Model, type Types } from 'mongoose';

export interface IPatient {
  fullName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  phone: string;
  email: string;
  address: string;
  condition: string;
  doctorId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const patientSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'], required: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    address: { type: String, trim: true, default: '' },
    condition: { type: String, required: true, trim: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  },
  { timestamps: true },
);

patientSchema.index({ fullName: 'text', condition: 'text', email: 'text', phone: 'text' });
patientSchema.index({ doctorId: 1, createdAt: -1 });
patientSchema.index({ condition: 1, createdAt: -1 });
patientSchema.index({ gender: 1, createdAt: -1 });
patientSchema.index({ createdAt: -1 });

export const Patient = (mongoose.models.Patient as Model<IPatient> | undefined) || mongoose.model<IPatient>('Patient', patientSchema);
