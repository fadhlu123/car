import { HelmetOptions } from 'helmet';

export const helmetOptions: HelmetOptions = {
  // Allow Cloudinary-hosted images to load cross-origin
  crossOriginResourcePolicy: { policy: 'cross-origin' },
};
