import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet = require('helmet');
import cookieParser = require('cookie-parser');
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/http-exception.filter';

function normalizeOrigin(origin: string): string {
  const trimmed = origin.trim();
  if (!trimmed) return '';
  if (trimmed === '*') return '*';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(trimmed)) return `http://${trimmed}`;
  return `https://${trimmed}`;
}

function parseCorsOrigins(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw
    .split(',')
    .map((v) => normalizeOrigin(v))
    .filter((v) => v.length > 0);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: false,
  });

  const configService = app.get(ConfigService);

  const nodeEnv =
    (configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV ?? 'development').toLowerCase();
  const trustProxy = (configService.get<string>('TRUST_PROXY') ?? '').toLowerCase() === 'true';
  if (nodeEnv === 'production' || trustProxy) {
    const httpAdapter = app.getHttpAdapter();
    // Express behind Render/other proxies needs this for secure cookies, IP, etc.
    httpAdapter.getInstance().set('trust proxy', 1);
  }

  const corsOriginRaw = configService.get<string>('APP_CORS_ORIGIN') ?? '';
  const allowedCorsOrigins = parseCorsOrigins(corsOriginRaw);
  const isDev = nodeEnv === 'development';

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean | string) => void,
    ) => {
      if (!origin) return callback(null, true);
      if (isDev || allowedCorsOrigins.length === 0 || allowedCorsOrigins.includes('*')) {
        return callback(null, origin);
      }
      if (allowedCorsOrigins.includes(origin)) {
        return callback(null, origin);
      }
      return callback(new Error(`CORS blocked origin: ${origin}`), false);
    },
    credentials: true,
  });

  app.use(helmet.default());
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const port =
  configService.get<number>('APP_PORT') ??
  Number(process.env.APP_PORT) ??
  4001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Application is running on port ${port}`);
}

bootstrap();
