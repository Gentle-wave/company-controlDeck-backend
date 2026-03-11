import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const hasCookie = !!req.cookies && Object.keys(req.cookies).length > 0;
    const hasBearer =
      typeof req.headers['authorization'] === 'string' &&
      req.headers['authorization'].startsWith('Bearer ');

    this.logger.debug(
      `Guard hit: ${req.method} ${req.path} | cookie=${hasCookie} bearer=${hasBearer}`,
    );

    return super.canActivate(context);
  }
}
