import { AuthController } from '../src/auth/auth.controller';
import { UserRole } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    register: jest.Mock;
    login: jest.Mock;
    loginOrProvisionByEmail: jest.Mock;
  };
  let configService: {
    get: jest.Mock;
  };
  let firebaseAdminService: {
    verifyIdToken: jest.Mock;
  };

  beforeEach(() => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      loginOrProvisionByEmail: jest.fn(),
    };
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'COOKIE_NAME') {
          return 'takehome_auth';
        }
        if (key === 'NODE_ENV') {
          return 'development';
        }
        return undefined;
      }),
    };
    firebaseAdminService = {
      verifyIdToken: jest.fn(),
    };
    controller = new AuthController(
      authService as any,
      configService as any,
      firebaseAdminService as any,
    );
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

  it('login sets auth cookie and returns user projection with token', async () => {
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

    const mockReq = { headers: { origin: 'http://localhost:3000' } };
    const result = await controller.login(
      { email: 'b@example.com', password: 'Password123!' },
      mockReq as any,
      res as any,
    );

    expect(res.cookie).toHaveBeenCalledWith(
      'takehome_auth',
      'jwt-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60,
      }),
    );
    expect(result).toEqual({
      token: 'jwt-token',
      id: 'u2',
      email: 'b@example.com',
      role: UserRole.USER_B,
    });
  });

  it('logout clears cookie and returns success', async () => {
    const res = {
      clearCookie: jest.fn(),
    };

    const mockReq = { headers: { origin: 'http://localhost:3000' } };
    const result = await controller.logout(mockReq as any, res as any);

    expect(res.clearCookie).toHaveBeenCalledWith(
      'takehome_auth',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60,
      }),
    );
    expect(result).toEqual({ success: true });
  });

  it('firebase login provisions/returns user projection with token and sets cookie', async () => {
    firebaseAdminService.verifyIdToken.mockResolvedValue({ email: 'fb@example.com' });
    authService.loginOrProvisionByEmail.mockResolvedValue({
      token: 'jwt-token',
      user: { id: 'u3', email: 'fb@example.com', role: UserRole.USER_A },
      isNewUser: true,
    });

    const mockReq = { headers: { origin: 'http://localhost:3000' } };
    const res = { cookie: jest.fn() };
    const result = await controller.firebaseLogin(
      { idToken: 'some-firebase-id-token', role: UserRole.USER_A } as any,
      mockReq as any,
      res as any,
    );

    expect(firebaseAdminService.verifyIdToken).toHaveBeenCalledWith('some-firebase-id-token');
    expect(authService.loginOrProvisionByEmail).toHaveBeenCalledWith('fb@example.com', UserRole.USER_A);
    expect(res.cookie).toHaveBeenCalledWith(
      'takehome_auth',
      'jwt-token',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(result).toEqual({
      token: 'jwt-token',
      id: 'u3',
      email: 'fb@example.com',
      role: UserRole.USER_A,
    });
  });
});
