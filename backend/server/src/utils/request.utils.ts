import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from './error.utils';

// Device context — attached to auth events for audit/security tracking
export interface DeviceContext {
  ip_address: string;
  user_agent: string;
  country?: string;
}

export const detectDeviceType = (user_agent: string): 'mobile' | 'tablet' | 'desktop' => {
  const ua = user_agent.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|windows phone/.test(ua)) return 'mobile';
  if (/tablet|ipad/.test(ua)) return 'tablet';
  return 'desktop';
};

export const extractDeviceContext = (req: Request): DeviceContext => ({
  ip_address:
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown',
  user_agent: req.headers['user-agent'] || 'unknown',
});

// Zod validation middleware — validates req.body / req.query / req.params
export const validate =
  (schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const message = (result.error as ZodError).errors.map((e) => e.message).join(', ');
      next(new AppError(message, 422));
      return;
    }
    Object.assign(req, { [target]: result.data });
    next();
  };
