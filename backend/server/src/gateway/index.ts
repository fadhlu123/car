import { Router, type Router as RouterType } from 'express';
import apiRouter from './routes';

const gateway: RouterType = Router();

// All module routes are mounted under /api
gateway.use('/api/v1', apiRouter);

export default gateway;
