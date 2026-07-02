import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccess } from '../../../utils/response.utils';
import { validate } from '../../../utils/request.utils';
import { AppError } from '../../../utils/error.utils';
import { withImageUpload } from '../../../utils/upload.utils';
// An admin is a User document too — reuse the exact same profile service
// rather than duplicating the update/avatar logic for a second role.
import * as svc from '../services/user.profile.service';

const updateSchema = z.object({
  first_name: z.string().min(1).max(50).optional(),
  last_name:  z.string().min(1).max(50).optional(),
}).strict();

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await svc.getProfile(req.admin!.sub);
    sendSuccess(res, profile, 'Profile retrieved');
  } catch (err) { next(err); }
};

export const updateProfile = [
  validate(updateSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await svc.updateProfile(req.admin!.sub, req.body);
      sendSuccess(res, updated, 'Profile updated');
    } catch (err) { next(err); }
  },
];

export const updateAvatar = [
  withImageUpload('avatar', 1),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = (req.files as Express.Multer.File[]) ?? [];
      if (!files.length) throw new AppError('No image provided', 400);
      const updated = await svc.updateAvatar(req.admin!.sub, files[0].buffer);
      sendSuccess(res, updated, 'Avatar updated');
    } catch (err) { next(err); }
  },
];
