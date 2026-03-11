import { CompanyInputController } from '../src/company-input/company-input.controller';

describe('CompanyInputController', () => {
  let controller: CompanyInputController;
  let service: {
    create: jest.Mock;
    findLatestForOwner: jest.Mock;
  };

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findLatestForOwner: jest.fn(),
    };
    controller = new CompanyInputController(service as any);
  });

  it('create forwards owner id from req.user', async () => {
    service.create.mockResolvedValue({ id: 'ci1' });

    const result = await controller.create(
      { user: { userId: 'owner-1' } } as any,
      {
        companyName: 'Acme',
        numberOfUsers: 100,
        numberOfProducts: 20,
      },
    );

    expect(service.create).toHaveBeenCalledWith({
      ownerId: 'owner-1',
      companyName: 'Acme',
      numberOfUsers: 100,
      numberOfProducts: 20,
    });
    expect(result).toEqual({ id: 'ci1' });
  });

  it('getLatestForOwner delegates to service', async () => {
    service.findLatestForOwner.mockResolvedValue({ id: 'ci-latest' });

    const result = await controller.getLatestForOwner('owner-uuid');

    expect(service.findLatestForOwner).toHaveBeenCalledWith('owner-uuid');
    expect(result).toEqual({ id: 'ci-latest' });
  });
});
