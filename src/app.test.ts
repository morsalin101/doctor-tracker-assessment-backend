import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from './app.js';
import { Admin } from './models/Admin.js';
import { Doctor } from './models/Doctor.js';
import { Patient } from './models/Patient.js';

let mongo: MongoMemoryServer | undefined;
let agent: ReturnType<typeof request.agent>;
let doctorId: string;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: 'doctor_tracker_test' });
  await Promise.all([Admin.syncIndexes(), Doctor.syncIndexes(), Patient.syncIndexes()]);
  await Admin.create({ email: 'admin@test.local', passwordHash: await bcrypt.hash('StrongPassword123!', 4) });
  agent = request.agent(app);
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
}, 60_000);

describe('Doctor Tracker API', () => {
  it('rejects protected resources without a session', async () => {
    const response = await request(app).get('/api/v1/doctors');
    expect(response.status).toBe(401);
  });

  it('logs in and returns the current administrator', async () => {
    const login = await agent.post('/api/v1/auth/login').send({ email: 'admin@test.local', password: 'StrongPassword123!' });
    expect(login.status).toBe(200);
    const me = await agent.get('/api/v1/auth/me');
    expect(me.body.data.email).toBe('admin@test.local');
  });

  it('creates and paginates doctors', async () => {
    const created = await agent.post('/api/v1/doctors').send({
      name: 'Dr Test', specialization: 'Cardiology', hospital: 'Test Hospital', phone: '+8801700000000', email: 'doctor@test.local',
    });
    expect(created.status).toBe(201);
    doctorId = created.body.data._id;
    const list = await agent.get('/api/v1/doctors?page=1&limit=10');
    expect(list.body.meta.total).toBe(1);
  });

  it('creates, edits, filters, and deletes a patient', async () => {
    const created = await agent.post(`/api/v1/doctors/${doctorId}/patients`).send({
      fullName: 'Patient One', dateOfBirth: '1990-05-10', gender: 'female', phone: '+8801800000000', email: 'patient@test.local', address: 'Dhaka', condition: 'Hypertension',
    });
    expect(created.status).toBe(201);
    const id = created.body.data._id;
    const list = await agent.get(`/api/v1/patients?doctorId=${doctorId}&condition=Hypertension`);
    expect(list.body.meta.total).toBe(1);
    const edited = await agent.patch(`/api/v1/patients/${id}`).send({ condition: 'Diabetes' });
    expect(edited.body.data.condition).toBe('Diabetes');
    expect((await agent.delete(`/api/v1/patients/${id}`)).status).toBe(200);
  });

  it('returns dashboard aggregations', async () => {
    const response = await agent.get('/api/v1/dashboard/summary');
    expect(response.status).toBe(200);
    expect(response.body.data.totals.doctors).toBe(1);
  });
});
