import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccess, sendCreated, sendNoContent } from '../../../utils/response.utils';
import { validate } from '../../../utils/request.utils';
import { withMediaUpload } from '../../../utils/upload.utils';
import * as svc from '../services/admin.content.service';

const addBlockSchema = z.object({
  type:    z.enum(['paragraph', 'image', 'video']),
  text:    z.string().max(5000).optional(),
  caption: z.string().max(300).optional(),
  float:   z.enum(['left', 'right', 'none']).optional(),
});

const updateBlockSchema = z.object({
  text:    z.string().max(5000).optional(),
  caption: z.string().max(300).optional(),
  float:   z.enum(['left', 'right', 'none']).optional(),
});

const reorderSchema = z.array(z.object({ id: z.string(), order: z.coerce.number() }));

const contactInfoSchema = z.object({
  phone:   z.string().max(50).optional().default(''),
  email:   z.string().max(200).optional().default(''),
  address: z.string().max(300).optional().default(''),
});

export const listBlocks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const blocks = await svc.listBlocks();
    sendSuccess(res, blocks, 'Blocks retrieved');
  } catch (err) { next(err); }
};

export const addBlock = [
  withMediaUpload('file'),
  validate(addBlockSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const block = await svc.addBlock(req.body, req.file, req.admin!.sub);
      sendCreated(res, block, 'Block added');
    } catch (err) { next(err); }
  },
];

export const updateBlock = [
  validate(updateBlockSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const block = await svc.updateBlock(req.params.id, req.body, req.admin!.sub);
      sendSuccess(res, block, 'Block updated');
    } catch (err) { next(err); }
  },
];

export const reorderBlocks = [
  validate(reorderSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const blocks = await svc.reorderBlocks(req.body, req.admin!.sub);
      sendSuccess(res, blocks, 'Blocks reordered');
    } catch (err) { next(err); }
  },
];

export const deleteBlock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.deleteBlock(req.params.id);
    sendNoContent(res);
  } catch (err) { next(err); }
};

export const updateContactInfo = [
  validate(contactInfoSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const info = await svc.updateContactInfo(req.body, req.admin!.sub);
      sendSuccess(res, info, 'Contact info updated');
    } catch (err) { next(err); }
  },
];
