import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { Admin } from './models/Admin.js';
import { Doctor } from './models/Doctor.js';
import { Patient } from './models/Patient.js';

if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required for seeding.');

const doctors = [
  ['Ayesha Rahman', 'Cardiology', 'Dhaka Medical Centre'],
  ['Farhan Ahmed', 'Neurology', 'Evercare Hospital'],
  ['Nusrat Jahan', 'Pediatrics', 'Square Hospital'],
  ['Imran Hossain', 'Orthopedics', 'United Hospital'],
  ['Samira Khan', 'Dermatology', 'Labaid Hospital'],
  ['Tanvir Islam', 'Internal Medicine', 'Popular Medical College'],
  ['Maliha Chowdhury', 'Gynecology', 'Ibn Sina Hospital'],
  ['Rafiq Hasan', 'Ophthalmology', 'Bangladesh Eye Hospital'],
  ['Tasmia Noor', 'Endocrinology', 'BIRDEM General Hospital'],
  ['Shahriar Kabir', 'Oncology', 'Ahsania Mission Cancer Hospital'],
  ['Rehana Sultana', 'Psychiatry', 'National Institute of Mental Health'],
  ['Mahmud Karim', 'ENT', 'Central Hospital'],
] as const;

const firstNames = ['Arif', 'Nabila', 'Sakib', 'Mim', 'Fahim', 'Raisa', 'Adnan', 'Jannat', 'Rashed', 'Tania', 'Nafis', 'Sadia'];
const lastNames = ['Hasan', 'Akter', 'Rahman', 'Islam', 'Ahmed', 'Khan', 'Hossain', 'Chowdhury'];
const conditions = ['Hypertension', 'Diabetes', 'Migraine', 'Asthma', 'Arthritis', 'Dermatitis', 'Anxiety', 'Thyroid disorder'];
const genders = ['male', 'female', 'other', 'prefer_not_to_say'] as const;

export async function seedData() {
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD!, 12);
  await Admin.updateOne(
    { email: env.ADMIN_EMAIL!.toLowerCase() },
    { $set: { passwordHash, role: 'admin' }, $setOnInsert: { email: env.ADMIN_EMAIL!.toLowerCase() } },
    { upsert: true },
  );

  const doctorDocs = [];
  for (let index = 0; index < doctors.length; index += 1) {
    const [name, specialization, hospital] = doctors[index]!;
    const email = `doctor${index + 1}@doctortracker.local`;
    const doc = await Doctor.findOneAndUpdate(
      { email },
      { $setOnInsert: { name, specialization, hospital, phone: `+8801700${String(100000 + index)}`, email } },
      { upsert: true, returnDocument: 'after' },
    );
    doctorDocs.push(doc);
  }

  const now = new Date();
  for (let index = 0; index < 96; index += 1) {
    const doctor = doctorDocs[index % doctorDocs.length]!;
    const fullName = `${firstNames[index % firstNames.length]} ${lastNames[Math.floor(index / firstNames.length) % lastNames.length]}`;
    const email = `patient${index + 1}@example.local`;
    const createdAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (index % 12), 3 + (index % 24)));
    await Patient.updateOne(
      { email },
      {
        $setOnInsert: {
          fullName,
          dateOfBirth: new Date(Date.UTC(1960 + (index % 45), index % 12, 1 + (index % 27))),
          gender: genders[index % genders.length],
          phone: `+8801800${String(200000 + index)}`,
          email,
          address: `${10 + index}, Dhaka, Bangladesh`,
          condition: conditions[index % conditions.length],
          doctorId: doctor._id,
          createdAt,
          updatedAt: createdAt,
        },
      },
      { upsert: true, timestamps: false },
    );
  }

  console.log('Seed complete: 1 admin, 12 doctors, and 96 patients are available.');
}

async function run() {
  await connectDatabase();
  await seedData();
  await disconnectDatabase();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  run().catch(async (error) => {
    console.error(error instanceof Error ? error.message : error);
    await disconnectDatabase();
    process.exit(1);
  });
}
