import { AppError } from '../../../utils/error.utils';
import { getOrCreateSiteContent, IAboutBlock } from '../../../models/site-content.model';
import {
  uploadImageBuffer,
  deleteImageFromCloud,
  uploadVideoBuffer,
  deleteVideoFromCloud,
} from '../../../utils/upload.utils';
import { AboutBlockDTO, AddBlockInput, UpdateBlockInput, ReorderInput, ContactInfoDTO } from '../content.types';

const MEDIA_FOLDER = 'auto-majid/about';

const ERRORS = {
  BLOCK_NOT_FOUND: 'Content block not found',
  FILE_REQUIRED:   'A file is required for image/video blocks',
} as const;

const toDTO = (b: IAboutBlock): AboutBlockDTO => ({
  id:      b._id.toString(),
  type:    b.type,
  text:    b.text,
  url:     b.url,
  caption: b.caption,
  float:   b.float,
  order:   b.order,
});

export const listBlocks = async (): Promise<AboutBlockDTO[]> => {
  const doc = await getOrCreateSiteContent();
  return doc.about_blocks.slice().sort((a, b) => a.order - b.order).map(toDTO);
};

export const addBlock = async (
  input: AddBlockInput,
  file: Express.Multer.File | undefined,
  adminId: string
): Promise<AboutBlockDTO> => {
  const doc = await getOrCreateSiteContent();
  const nextOrder = doc.about_blocks.length
    ? Math.max(...doc.about_blocks.map((b) => b.order)) + 1
    : 0;

  let media: { url?: string; public_id?: string } = {};
  if (input.type === 'image' || input.type === 'video') {
    if (!file) throw new AppError(ERRORS.FILE_REQUIRED, 400);
    const result = input.type === 'image'
      ? await uploadImageBuffer(file.buffer, MEDIA_FOLDER)
      : await uploadVideoBuffer(file.buffer, MEDIA_FOLDER);
    media = { url: result.url, public_id: result.public_id };
  }

  doc.about_blocks.push({
    type:    input.type,
    text:    input.text,
    caption: input.caption,
    float:   input.float ?? 'none',
    order:   nextOrder,
    ...media,
  } as IAboutBlock);
  doc.updated_by = adminId as any;
  await doc.save();

  const added = doc.about_blocks[doc.about_blocks.length - 1];
  return toDTO(added);
};

export const updateBlock = async (
  blockId: string,
  input: UpdateBlockInput,
  adminId: string
): Promise<AboutBlockDTO> => {
  const doc = await getOrCreateSiteContent();
  const block = (doc.about_blocks as any).id(blockId);
  if (!block) throw new AppError(ERRORS.BLOCK_NOT_FOUND, 404);

  if (input.text    !== undefined) block.text    = input.text;
  if (input.caption !== undefined) block.caption = input.caption;
  if (input.float   !== undefined) block.float   = input.float;
  doc.updated_by = adminId as any;
  await doc.save();

  return toDTO(block);
};

export const reorderBlocks = async (items: ReorderInput[], adminId: string): Promise<AboutBlockDTO[]> => {
  const doc = await getOrCreateSiteContent();
  const orderMap = new Map(items.map((i) => [i.id, i.order]));
  doc.about_blocks.forEach((b) => {
    const newOrder = orderMap.get(b._id.toString());
    if (newOrder !== undefined) b.order = newOrder;
  });
  doc.updated_by = adminId as any;
  await doc.save();

  return doc.about_blocks.slice().sort((a, b) => a.order - b.order).map(toDTO);
};

export const deleteBlock = async (blockId: string): Promise<void> => {
  const doc = await getOrCreateSiteContent();
  const block = (doc.about_blocks as any).id(blockId);
  if (!block) throw new AppError(ERRORS.BLOCK_NOT_FOUND, 404);

  const { type, public_id } = block;
  block.deleteOne();
  await doc.save();

  if (public_id) {
    if (type === 'image') await deleteImageFromCloud(public_id);
    if (type === 'video') await deleteVideoFromCloud(public_id);
  }
};

export const updateContactInfo = async (data: ContactInfoDTO, adminId: string): Promise<ContactInfoDTO> => {
  const doc = await getOrCreateSiteContent();
  doc.contact_phone   = data.phone;
  doc.contact_email   = data.email;
  doc.contact_address = data.address;
  doc.updated_by = adminId as any;
  await doc.save();

  return { phone: doc.contact_phone ?? '', email: doc.contact_email ?? '', address: doc.contact_address ?? '' };
};
