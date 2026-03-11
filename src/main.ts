import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet = require('helmet');
import cookieParser = require('cookie-parser');
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { corsOptions } from './common/cors.config';
import type { Request, Response, NextFunction } from 'express';

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
    httpAdapter.getInstance().set('trust proxy', 1);
  }

  app.enableCors(corsOptions);

  const authLogger = new Logger('AuthDiag');
  const cookieName = configService.get<string>('COOKIE_NAME') ?? 'takehome_auth';
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const origin = req.headers['origin'] ?? '(no origin)';
    const hasCookieHeader = !!req.headers['cookie'];
    const hasBearerHeader =
      typeof req.headers['authorization'] === 'string' &&
      req.headers['authorization'].startsWith('Bearer ');
    const cookieHeader = req.headers['cookie'] ?? '';
    const hasCookieToken = cookieHeader
      .split(';')
      .some((part) => part.trim().startsWith(`${cookieName}=`));

    const authSource = hasCookieToken
      ? 'cookie'
      : hasBearerHeader
        ? 'bearer'
        : hasCookieHeader
          ? 'cookie(no-token)'
          : 'none';

    authLogger.log(
      `${req.method} ${req.path} | origin=${origin} | auth=${authSource}`,
    );
    next();
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
  console.log(`Application is running on port ${port}`);
}

bootstrap();
