import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'COOKIE_NAME') {
          return 'takehome_auth';
        }
        if (key === 'JWT_SECRET') {
          return 'super-secret';
        }
        return undefined;
      }),
    };

    strategy = new JwtStrategy(configService as any);
  });

  it('validate returns mapped user object', async () => {
    const result = await strategy.validate({
      sub: 'user-1',
      role: UserRole.USER_A,
    });

    expect(result).toEqual({ userId: 'user-1', role: UserRole.USER_A });
  });

  it('validate throws when sub is missing', async () => {
    await expect(strategy.validate({ sub: '' as any, role: UserRole.USER_A })).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
