import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccess, sendNoContent, sendCreated } from '../../../utils/response.utils';
import { validate, extractDeviceContext } from '../../../utils/request.utils';
import * as svc from '../services/admin.team.service';

const inviteSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
});

const tokenSchema = z.object({ token: z.string().min(1) });

const acceptSchema = z.object({
  token:      z.string().min(1),
  password:   z.string().min(8).optional(),
  first_name: z.string().min(1).optional(),
  last_name:  z.string().min(1).optional(),
});

const idSchema = z.object({ id: z.string().min(1) });

export const inviteAdmin = [
  validate(inviteSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await svc.inviteAdmin(req.body.email, req.admin!.sub, req.admin!.email, extractDeviceContext(req));
      sendCreated(res, null, 'Invite sent successfully');
    } catch (err) { next(err); }
  },
];

export const getInviteInfo = [
  validate(tokenSchema, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const info = await svc.getInviteInfo(req.params.token);
      sendSuccess(res, info, 'Invite details retrieved');
    } catch (err) { next(err); }
  },
];

export const acceptInvite = [
  validate(acceptSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await svc.acceptInvite({
        rawToken:   req.body.token,
        password:   req.body.password,
        first_name: req.body.first_name,
        last_name:  req.body.last_name,
        ctx:        extractDeviceContext(req),
      });
      sendSuccess(res, result, 'Invite accepted. Welcome to the team.');
    } catch (err) { next(err); }
  },
];

export const listTeam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const team = await svc.listTeam();
    sendSuccess(res, team, 'Team retrieved');
  } catch (err) { next(err); }
};

export const removeFromTeam = [
  validate(idSchema, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await svc.removeFromTeam(req.params.id, req.admin!.sub, extractDeviceContext(req));
      sendNoContent(res);
    } catch (err) { next(err); }
  },
];

export const revokeInvite = [
  validate(idSchema, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await svc.revokeInvite(req.params.id, req.admin!.sub);
      sendNoContent(res);
    } catch (err) { next(err); }
  },
];
