import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccess, sendCreated } from '../../../utils/response.utils';
import { validate } from '../../../utils/request.utils';
import * as svc from '../services/contact.service';

const messageSchema = z.object({ body: z.string().min(1, 'Message cannot be empty').max(2000) });

export const getConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const convo = await svc.getOrCreateConversation(req.user!.sub);
    sendSuccess(res, convo, 'Conversation retrieved');
  } catch (err) { next(err); }
};

export const postMessage = [
  validate(messageSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const message = await svc.postMessage(req.user!.sub, req.body.body);
      sendCreated(res, message, 'Message sent');
    } catch (err) { next(err); }
  },
];

export const editMessage = [
  validate(messageSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const message = await svc.editMessage(req.user!.sub, req.params.id, req.body.body);
      sendSuccess(res, message, 'Message updated');
    } catch (err) { next(err); }
  },
];

export const markSeen = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.markSeenByUser(req.user!.sub);
    sendSuccess(res, null, 'Marked as seen');
  } catch (err) { next(err); }
};
