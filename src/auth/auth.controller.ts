import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { BadRequestException } from '@nestjs/common';
import { getAuthCookieName, getAuthCookieOptions } from './auth.cookies';
import { FirebaseAdminService } from './firebase-admin.service';
import { FirebaseLoginDto } from './dto/firebase-login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly firebaseAdminService: FirebaseAdminService,
  ) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, user } = await this.authService.register(dto.email, dto.password, dto.role);
    const origin = req.headers['origin'] as string | undefined;
    const cookieName = getAuthCookieName(this.configService);
    res.cookie(cookieName, token, getAuthCookieOptions(this.configService, origin));
    return { token, id: user.id, email: user.email, role: user.role };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, user } = await this.authService.login(dto.email, dto.password);
    const origin = req.headers['origin'] as string | undefined;
    const cookieName = getAuthCookieName(this.configService);
    res.cookie(cookieName, token, getAuthCookieOptions(this.configService, origin));
    return { token, id: user.id, email: user.email, role: user.role };
  }

  @Post('firebase/login')
  @HttpCode(HttpStatus.OK)
  async firebaseLogin(
    @Body() dto: FirebaseLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const decoded = await this.firebaseAdminService.verifyIdToken(dto.idToken);
    const email = decoded.email;
    if (!email) {
      throw new BadRequestException('Firebase token missing email');
    }

    const origin = req.headers['origin'] as string | undefined;
    const { token, user } = await this.authService.loginOrProvisionByEmail(email, dto.role);
    const cookieName = getAuthCookieName(this.configService);
    res.cookie(cookieName, token, getAuthCookieOptions(this.configService, origin));
    return { token, id: user.id, email: user.email, role: user.role };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const origin = req.headers['origin'] as string | undefined;
    const cookieName = getAuthCookieName(this.configService);
    res.clearCookie(cookieName, getAuthCookieOptions(this.configService, origin));
    return { success: true };
  }
}
