import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.js';
import { doctorsRouter } from './routes/doctors.js';
import { patientsRouter } from './routes/patients.js';
import { dashboardRouter } from './routes/dashboard.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/error.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true }));
app.use(pinoHttp({ enabled: env.NODE_ENV !== 'test', redact: ['req.headers.cookie', 'req.headers.authorization'] }));
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/doctors', requireAuth, doctorsRouter);
app.use('/api/v1/patients', requireAuth, patientsRouter);
app.use('/api/v1/dashboard', requireAuth, dashboardRouter);
app.use(notFound);
app.use(errorHandler);
