import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { corsOptions } from './configs/cors.config';
import { helmetOptions } from './configs/helmet.config';
import { notFound, errorHandler } from './utils/error.utils';
import { sendSuccess } from './utils/response.utils';
import gateway from './gateway';

const app: Application = express();

// Security headers
app.use(helmet(helmetOptions));
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API gateway — all module routes live here
app.use(gateway);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  sendSuccess(res, { uptime: Math.floor(process.uptime()) }, 'Server is healthy');
});

// 404 then global error handler — must be last
app.use(notFound);
app.use(errorHandler);

export default app;
