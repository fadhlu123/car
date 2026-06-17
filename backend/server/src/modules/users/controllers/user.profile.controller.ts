import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccess } from '../../../utils/response.utils';
import { validate } from '../../../utils/request.utils';
import * as svc from '../services/user.profile.service';

const updateSchema = z.object({
  first_name: z.string().min(1).max(50).optional(),
  last_name:  z.string().min(1).max(50).optional(),
  // avatar_url is set via Cloudinary upload in Phase 3 — not accepted as raw input here
}).strict();

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await svc.getProfile(req.user!.sub);
    sendSuccess(res, profile, 'Profile retrieved');
  } catch (err) { next(err); }
};

export const updateProfile = [
  validate(updateSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await svc.updateProfile(req.user!.sub, req.body);
      sendSuccess(res, updated, 'Profile updated');
    } catch (err) { next(err); }
  },
];
