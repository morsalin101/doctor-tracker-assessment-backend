import mongoose, { Schema, type Model } from 'mongoose';

export interface IAdmin {
  email: string;
  passwordHash: string;
  role: 'admin';
}

const adminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin'], default: 'admin' },
  },
  { timestamps: true },
);

export const Admin = (mongoose.models.Admin as Model<IAdmin> | undefined) || mongoose.model<IAdmin>('Admin', adminSchema);
