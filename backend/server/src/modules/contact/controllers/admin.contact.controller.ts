import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccess, sendCreated } from '../../../utils/response.utils';
import { validate } from '../../../utils/request.utils';
import * as svc from '../services/admin.contact.service';

const messageSchema = z.object({ body: z.string().min(1, 'Message cannot be empty').max(2000) });

const listQuerySchema = z.object({
  page:  z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const listConversations = [
  validate(listQuerySchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await svc.listConversations(req.query as any);
      sendSuccess(res, result, 'Conversations retrieved');
    } catch (err) { next(err); }
  },
];

export const getConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const convo = await svc.getConversation(req.params.id, req.admin!.sub);
    sendSuccess(res, convo, 'Conversation retrieved');
  } catch (err) { next(err); }
};

export const postReply = [
  validate(messageSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const message = await svc.postAdminReply(req.params.id, req.admin!.sub, req.body.body);
      sendCreated(res, message, 'Reply sent');
    } catch (err) { next(err); }
  },
];

export const markSeen = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.markSeenByAdmin(req.params.id);
    sendSuccess(res, null, 'Marked as seen');
  } catch (err) { next(err); }
};
