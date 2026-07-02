import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../../utils/response.utils';
import * as svc from '../services/content.service';

export const getAbout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const blocks = await svc.getAboutContent();
    sendSuccess(res, blocks, 'About content retrieved');
  } catch (err) { next(err); }
};

export const getContactInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const info = await svc.getContactInfo();
    sendSuccess(res, info, 'Contact info retrieved');
  } catch (err) { next(err); }
};
