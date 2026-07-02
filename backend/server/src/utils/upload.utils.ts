import multer from 'multer';
import { Readable } from 'stream';
import { Request, Response, NextFunction } from 'express';
import { cloudinary } from '../configs/cloudinary.configs';
import { AppError } from './error.utils';
import { env } from '../configs/env.config';

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      cb(new Error('Only JPEG, PNG, and WebP images are accepted'));
      return;
    }
    cb(null, true);
  },
});

const ALLOWED_VIDEO_MIME = ['video/mp4', 'video/webm'];
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB

const mediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO_SIZE },
  fileFilter: (_req, file, cb) => {
    if (![...ALLOWED_MIME, ...ALLOWED_VIDEO_MIME].includes(file.mimetype)) {
      cb(new Error('Only JPEG, PNG, WebP images or MP4/WebM videos are accepted'));
      return;
    }
    cb(null, true);
  },
});

// Wraps multer.array() and converts MulterError → AppError so the global handler handles it cleanly.
export const withImageUpload =
  (fieldName: string, maxCount: number) =>
  (req: Request, res: Response, next: NextFunction): void => {
    imageUpload.array(fieldName, maxCount)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        const msg =
          err.code === 'LIMIT_FILE_SIZE'
            ? 'Image too large — maximum size is 5 MB'
            : err.code === 'LIMIT_FILE_COUNT'
            ? `Too many files — maximum is ${maxCount}`
            : err.message;
        return next(new AppError(msg, 400));
      }
      if (err) {
        return next(
          err.message?.includes('JPEG') || err.message?.includes('image')
            ? new AppError(err.message, 400)
            : err
        );
      }
      next();
    });
  };

// Wraps multer.single() for a mixed image-or-video field and converts
// MulterError → AppError, same as withImageUpload. Used where an admin
// uploads one media file at a time (e.g. an About Us content block).
export const withMediaUpload =
  (fieldName: string) =>
  (req: Request, res: Response, next: NextFunction): void => {
    mediaUpload.single(fieldName)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        const msg =
          err.code === 'LIMIT_FILE_SIZE'
            ? 'File too large — maximum size is 50 MB'
            : err.message;
        return next(new AppError(msg, 400));
      }
      if (err) {
        return next(
          err.message?.includes('image') || err.message?.includes('video')
            ? new AppError(err.message, 400)
            : err
        );
      }
      next();
    });
  };

export interface UploadResult {
  url: string;
  public_id: string;
}

export const uploadImageBuffer = (
  buffer: Buffer,
  folder: string
): Promise<UploadResult> => {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    return Promise.reject(
      new AppError('Image upload is not configured on this server', 503)
    );
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new AppError('Image upload failed', 500));
          return;
        }
        resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );
    Readable.from(buffer).pipe(stream);
  });
};

export const deleteImageFromCloud = async (public_id: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(public_id);
  } catch {
    // Log but don't throw — orphaned Cloudinary images are not a fatal error.
    // A cleanup job can reconcile them later.
  }
};

export const uploadVideoBuffer = (
  buffer: Buffer,
  folder: string
): Promise<UploadResult> => {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    return Promise.reject(
      new AppError('Media upload is not configured on this server', 503)
    );
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'video' },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new AppError('Video upload failed', 500));
          return;
        }
        resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );
    Readable.from(buffer).pipe(stream);
  });
};

export const deleteVideoFromCloud = async (public_id: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(public_id, { resource_type: 'video' });
  } catch {
    // Orphaned Cloudinary videos are not fatal — same rationale as deleteImageFromCloud.
  }
};
