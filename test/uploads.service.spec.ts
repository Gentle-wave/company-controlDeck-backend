import { UploadsService } from '../src/uploads/uploads.service';

describe('UploadsService', () => {
  let service: UploadsService;
  let prisma: {
    imageUpload: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      imageUpload: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    service = new UploadsService(prisma as any);
  });

  it('recordUpload writes upload metadata', async () => {
    prisma.imageUpload.create.mockResolvedValue({ id: 'img1' });

    await service.recordUpload({
      ownerId: 'owner-1',
      uploaderId: 'uploader-1',
      filename: 'x.png',
      mimetype: 'image/png',
      size: 1234,
      storagePath: '/tmp/x.png',
    });

    expect(prisma.imageUpload.create).toHaveBeenCalledWith({
      data: {
        ownerId: 'owner-1',
        uploaderId: 'uploader-1',
        filename: 'x.png',
        mimetype: 'image/png',
        size: 1234,
        storagePath: '/tmp/x.png',
      },
    });
  });

  it('findLatestForOwner queries latest by createdAt', async () => {
    prisma.imageUpload.findFirst.mockResolvedValue({ id: 'latest' });

    const result = await service.findLatestForOwner('owner-1');

    expect(prisma.imageUpload.findFirst).toHaveBeenCalledWith({
      where: { ownerId: 'owner-1' },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual({ id: 'latest' });
  });

  it('findById delegates to findUnique', async () => {
    prisma.imageUpload.findUnique.mockResolvedValue({ id: 'img2' });

    const result = await service.findById('img2');

    expect(prisma.imageUpload.findUnique).toHaveBeenCalledWith({ where: { id: 'img2' } });
    expect(result).toEqual({ id: 'img2' });
  });

  it('findByFilename returns latest matching filename', async () => {
    prisma.imageUpload.findFirst.mockResolvedValue({ id: 'img3' });

    const result = await service.findByFilename('x.png');

    expect(prisma.imageUpload.findFirst).toHaveBeenCalledWith({
      where: { filename: 'x.png' },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual({ id: 'img3' });
  });
});
