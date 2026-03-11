import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet = require('helmet');
import cookieParser = require('cookie-parser');
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/http-exception.filter';

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

  const corsOriginRaw = configService.get<string>('APP_CORS_ORIGIN');
  const corsOrigin = corsOriginRaw?.includes(',')
    ? corsOriginRaw.split(',').map((s) => s.trim())
    : corsOriginRaw;

  app.enableCors({
    origin: corsOrigin,
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

  const port = configService.get<number>('APP_PORT') ?? 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Application is running on port ${port}`);
}

bootstrap();
