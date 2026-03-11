import { NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsersService } from '../src/users/users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };

    service = new UsersService(prisma as any);
  });

  it('create delegates to prisma.user.create', async () => {
    prisma.user.create.mockResolvedValue({ id: 'u1' });

    const data = { email: 'a@a.com', password: 'hash', role: UserRole.USER_A };
    await service.create(data as any);

    expect(prisma.user.create).toHaveBeenCalledWith({ data });
  });

  it('findByEmail delegates to prisma.user.findUnique', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });

    const result = await service.findByEmail('a@a.com');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'a@a.com' } });
    expect(result).toEqual({ id: 'u1' });
  });

  it('findById throws when user is missing', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
  });

  it('findById returns user when present', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u2' });

    const result = await service.findById('u2');

    expect(result).toEqual({ id: 'u2' });
  });

  it('listByRole delegates to prisma.user.findMany', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 'u1' }]);

    const result = await service.listByRole(UserRole.USER_B);

    expect(prisma.user.findMany).toHaveBeenCalledWith({ where: { role: UserRole.USER_B } });
    expect(result).toEqual([{ id: 'u1' }]);
  });
});
