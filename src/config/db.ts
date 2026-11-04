import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB_NAME,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10_000,
  });
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
