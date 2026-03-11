import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const ALLOWED_ORIGINS: Array<string | RegExp> = [
  // Local development
  'http://localhost:3000',
  'http://localhost:5173',
  /^http:\/\/localhost(:\d+)?$/,

  // LAN / device testing
  /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,

  // Production frontend
  'https://main.d1743nh08586oa.amplifyapp.com',

  // Dev tunnels (for local testing via tunnel tools)
  /^https:\/\/.*\.devtunnels\.ms$/,
  /^https:\/\/.*\.ngrok\.io$/,
  /^https:\/\/.*\.ngrok-free\.app$/,
  /^https:\/\/.*\.loca\.lt$/,
  /^https:\/\/.*\.serveo\.net$/,
];

export const corsOptions: CorsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin) return callback(null, true);

    const allowed = ALLOWED_ORIGINS.some((pattern) =>
      typeof pattern === 'string' ? origin === pattern : pattern.test(origin),
    );

    if (allowed) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'Cookie',
    'Set-Cookie',
  ],
  exposedHeaders: ['set-cookie', 'authorization'],
};
