import { UsersController } from '../src/users/users.controller';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(() => {
    controller = new UsersController();
  });

  it('getMe returns user from request', () => {
    const req = {
      user: {
        userId: 'u1',
        role: 'USER_A',
      },
    };

    const result = controller.getMe(req as any);

    expect(result).toEqual({ userId: 'u1', role: 'USER_A' });
  });
});
