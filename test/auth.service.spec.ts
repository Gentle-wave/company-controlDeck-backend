import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findByEmail: jest.Mock;
    create: jest.Mock;
  };
  let jwtService: {
    signAsync: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('hashes password on register', async () => {
    usersService.create.mockResolvedValue({
      id: 'user-id',
      email: 'test@example.com',
      role: UserRole.USER_A,
    });

    await service.register('test@example.com', 'password123', UserRole.USER_A);

    expect(usersService.create).toHaveBeenCalledTimes(1);
    const arg = usersService.create.mock.calls[0][0];
    expect(arg.password).not.toEqual('password123');
    const matches = await bcrypt.compare('password123', arg.password);
    expect(matches).toBe(true);
  });

  it('throws when user does not exist', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(service.validateUser('missing@example.com', 'password123')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws when password is invalid', async () => {
    const wrongHash = await bcrypt.hash('different-password', 12);
    usersService.findByEmail.mockResolvedValue({
      id: 'u1',
      email: 'test@example.com',
      password: wrongHash,
      role: UserRole.USER_A,
    });

    await expect(service.validateUser('test@example.com', 'password123')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('returns token and user on login', async () => {
    const hash = await bcrypt.hash('password123', 12);
    const user = {
      id: 'u1',
      email: 'test@example.com',
      password: hash,
      role: UserRole.USER_B,
    };
    usersService.findByEmail.mockResolvedValue(user);

    const result = await service.login('test@example.com', 'password123');

    expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: 'u1', role: UserRole.USER_B });
    expect(result).toEqual({ token: 'signed-token', user });
  });

  it('provisions new user on first firebase login when role provided', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockImplementation(async (data: any) => ({
      id: 'new-id',
      email: data.email,
      password: data.password,
      role: data.role,
    }));

    const result = await service.loginOrProvisionByEmail('new@example.com', UserRole.USER_A);

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new@example.com',
        role: UserRole.USER_A,
        password: expect.any(String),
      }),
    );
    expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: 'new-id', role: UserRole.USER_A });
    expect(result.isNewUser).toBe(true);
  });

  it('rejects first firebase login without role', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    await expect(service.loginOrProvisionByEmail('new@example.com')).rejects.toThrow(
      BadRequestException,
    );
  });
});
