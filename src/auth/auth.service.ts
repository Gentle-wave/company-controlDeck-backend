import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';

interface JwtPayload {
  sub: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private async issueJwt(user: { id: string; role: UserRole }) {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
    };
    return await this.jwtService.signAsync(payload);
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const token = await this.issueJwt(user);
    return { token, user };
  }

  async loginByEmail(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('No matching user for this Firebase account');
    }
    const token = await this.issueJwt(user);
    return { token, user };
  }

  async loginOrProvisionByEmail(email: string, role?: UserRole) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      const token = await this.issueJwt(existing);
      return { token, user: existing, isNewUser: false as const };
    }

    if (!role) {
      throw new BadRequestException('role is required on first Firebase login');
    }

    const randomPassword = randomBytes(32).toString('hex');
    const hashed = await bcrypt.hash(randomPassword, 12);

    const created = await this.usersService.create({
      email,
      password: hashed,
      role,
    });

    const token = await this.issueJwt(created);
    return { token, user: created, isNewUser: true as const };
  }

  async register(email: string, password: string, role: UserRole) {
    const hashed = await bcrypt.hash(password, 12);
    const user = await this.usersService.create({
      email,
      password: hashed,
      role,
    });
    return user;
  }
}
