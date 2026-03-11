import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
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
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto.email, dto.password, dto.role);
    return { id: user.id, email: user.email, role: user.role };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { token, user } = await this.authService.login(dto.email, dto.password);

    const cookieName = getAuthCookieName(this.configService);
    res.cookie(cookieName, token, getAuthCookieOptions(this.configService));

    return { id: user.id, email: user.email, role: user.role };
  }

  @Post('firebase/login')
  @HttpCode(HttpStatus.OK)
  async firebaseLogin(
    @Body() dto: FirebaseLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const decoded = await this.firebaseAdminService.verifyIdToken(dto.idToken);
    const email = decoded.email;
    if (!email) {
      // Some providers can return tokens without email; we keep the system email-based.
      throw new BadRequestException('Firebase token missing email');
    }

    const { token, user } = await this.authService.loginOrProvisionByEmail(email, dto.role);
    const cookieName = getAuthCookieName(this.configService);
    res.cookie(cookieName, token, getAuthCookieOptions(this.configService));
    return { id: user.id, email: user.email, role: user.role };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    const cookieName = getAuthCookieName(this.configService);
    res.clearCookie(cookieName, getAuthCookieOptions(this.configService));
    return { success: true };
  }
}
