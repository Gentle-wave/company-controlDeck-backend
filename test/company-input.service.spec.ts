import { CompanyInputService } from '../src/company-input/company-input.service';

describe('CompanyInputService', () => {
  let service: CompanyInputService;
  let prisma: {
    companyInput: {
      create: jest.Mock;
      findFirst: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      companyInput: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    service = new CompanyInputService(prisma as any);
  });

  it('computes percentage when creating a company input', async () => {
    prisma.companyInput.create.mockResolvedValue({ id: 'c1' });

    await service.create({
      ownerId: 'owner-1',
      companyName: 'Acme',
      numberOfUsers: 200,
      numberOfProducts: 50,
    });

    expect(prisma.companyInput.create).toHaveBeenCalledWith({
      data: {
        ownerId: 'owner-1',
        companyName: 'Acme',
        numberOfUsers: 200,
        numberOfProducts: 50,
        percentage: 25,
      },
    });
  });

  it('defaults percentage to 0 when numberOfUsers is 0', async () => {
    prisma.companyInput.create.mockResolvedValue({ id: 'c2' });

    await service.create({
      ownerId: 'owner-1',
      companyName: 'Zero Users Inc',
      numberOfUsers: 0,
      numberOfProducts: 50,
    });

    expect(prisma.companyInput.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ percentage: 0 }),
      }),
    );
  });

  it('findLatestForOwner queries descending by createdAt', async () => {
    prisma.companyInput.findFirst.mockResolvedValue({ id: 'latest' });

    const result = await service.findLatestForOwner('owner-1');

    expect(prisma.companyInput.findFirst).toHaveBeenCalledWith({
      where: { ownerId: 'owner-1' },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual({ id: 'latest' });
  });
});
