import { Router } from 'express';
import apiRouter from './routes';

const gateway = Router();

// All module routes are mounted under /api
gateway.use('/api/v1', apiRouter);

export default gateway;
