import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../src/common/guards/roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: {
    getAllAndOverride: jest.Mock;
  };

  const contextFactory = (user?: { role?: UserRole }) =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as any;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('allows when no required roles are configured', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    const result = guard.canActivate(contextFactory());

    expect(result).toBe(true);
  });

  it('allows when user role is in required roles', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.USER_B]);

    const result = guard.canActivate(contextFactory({ role: UserRole.USER_B }));

    expect(result).toBe(true);
  });

  it('throws when user role is not allowed', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.USER_A]);

    expect(() => guard.canActivate(contextFactory({ role: UserRole.USER_B }))).toThrow(
      ForbiddenException,
    );
  });
});
