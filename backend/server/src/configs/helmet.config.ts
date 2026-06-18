import { HelmetOptions } from 'helmet';
import { env } from './env.config';

export const helmetOptions: HelmetOptions = {
  // Content-Security-Policy — production-only.
  // In dev it breaks API tools (Postman, Bruno, etc.); the frontend framework
  // (React) handles its own CSP via Vite in dev mode.
  contentSecurityPolicy: env.isProduction
    ? {
        directives: {
          defaultSrc:              ["'self'"],
          scriptSrc:               ["'self'"],
          styleSrc:                ["'self'", "'unsafe-inline'"],
          imgSrc:                  ["'self'", 'data:', 'https://res.cloudinary.com'],
          connectSrc:              ["'self'"],
          fontSrc:                 ["'self'"],
          objectSrc:               ["'none'"],
          frameSrc:                ["'none'"],
          upgradeInsecureRequests: [],
        },
      }
    : false,

  // HSTS — instruct browsers to only reach this server over HTTPS.
  // Only meaningful in production (where HTTPS is enforced).
  strictTransportSecurity: env.isProduction
    ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
    : false,

  // Allow Cloudinary-hosted product images to load cross-origin.
  crossOriginResourcePolicy: { policy: 'cross-origin' },

  // Prevent our origin from being embedded by other sites (tab-napping defence).
  crossOriginOpenerPolicy: { policy: 'same-origin' },

  // Limit referrer info sent to third parties.
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

  // Prevent browsers from MIME-sniffing a response away from the declared Content-Type.
  noSniff: true,

  // Legacy XSS filter header — still useful for older browsers; CSP covers modern ones.
  xssFilter: true,

  // Refuse to be rendered inside an iframe — blocks clickjacking.
  frameguard: { action: 'deny' },

  // Remove the "X-Powered-By: Express" fingerprinting header.
  hidePoweredBy: true,
};
