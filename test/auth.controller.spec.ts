import { AuthController } from '../src/auth/auth.controller';
import { UserRole } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    register: jest.Mock;
    login: jest.Mock;
  };
  let configService: {
    get: jest.Mock;
  };

  beforeEach(() => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
    };
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'COOKIE_NAME') {
          return 'takehome_auth';
        }
        if (key === 'COOKIE_DOMAIN') {
          return 'localhost';
        }
        return undefined;
      }),
    };
    controller = new AuthController(authService as any, configService as any);
  });

  it('register returns projected user shape', async () => {
    authService.register.mockResolvedValue({
      id: 'u1',
      email: 'user@example.com',
      role: UserRole.USER_A,
      password: 'hashed',
    });

    const result = await controller.register({
      email: 'user@example.com',
      password: 'Password123!',
      role: UserRole.USER_A,
    });

    expect(authService.register).toHaveBeenCalledWith(
      'user@example.com',
      'Password123!',
      UserRole.USER_A,
    );
    expect(result).toEqual({ id: 'u1', email: 'user@example.com', role: UserRole.USER_A });
  });

  it('login sets auth cookie and returns user projection', async () => {
    authService.login.mockResolvedValue({
      token: 'jwt-token',
      user: {
        id: 'u2',
        email: 'b@example.com',
        role: UserRole.USER_B,
      },
    });
    const res = {
      cookie: jest.fn(),
    };

    const result = await controller.login(
      { email: 'b@example.com', password: 'Password123!' },
      res as any,
    );

    expect(res.cookie).toHaveBeenCalledWith(
      'takehome_auth',
      'jwt-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        domain: 'localhost',
        maxAge: 1000 * 60 * 60,
      }),
    );
    expect(result).toEqual({ id: 'u2', email: 'b@example.com', role: UserRole.USER_B });
  });

  it('logout clears cookie and returns success', async () => {
    const res = {
      clearCookie: jest.fn(),
    };

    const result = await controller.logout(res as any);

    expect(res.clearCookie).toHaveBeenCalledWith('takehome_auth');
    expect(result).toEqual({ success: true });
  });
});
