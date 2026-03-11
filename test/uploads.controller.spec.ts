import { NotFoundException } from '@nestjs/common';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { UploadsController } from '../src/uploads/uploads.controller';

describe('UploadsController', () => {
  let controller: UploadsController;
  let service: {
    recordUpload: jest.Mock;
    findLatestForOwner: jest.Mock;
    findById: jest.Mock;
    findByFilename: jest.Mock;
  };

  beforeEach(() => {
    service = {
      recordUpload: jest.fn(),
      findLatestForOwner: jest.fn(),
      findById: jest.fn(),
      findByFilename: jest.fn(),
    };

    controller = new UploadsController(service as any);
  });

  it('uploadImage stores metadata with uploader from req.user', async () => {
    service.recordUpload.mockResolvedValue({ id: 'img1' });

    const result = await controller.uploadImage(
      { user: { userId: 'uploader-1' } } as any,
      { ownerId: 'owner-1' },
      {
        filename: 'stored-file.png',
        originalname: 'original.png',
        mimetype: 'image/png',
        size: 123,
        path: '/tmp/stored-file.png',
      } as any,
    );

    expect(service.recordUpload).toHaveBeenCalledWith({
      ownerId: 'owner-1',
      uploaderId: 'uploader-1',
      filename: 'stored-file.png',
      mimetype: 'image/png',
      size: 123,
      storagePath: '/tmp/stored-file.png',
    });
    expect(result).toEqual({ id: 'img1' });
  });

  it('getLatestForOwner decorates with preview url/path', async () => {
    service.findLatestForOwner.mockResolvedValue({
      id: 'img1',
      filename: 'x.png',
    });

    const req = {
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:4000'),
    };

    const result = await controller.getLatestForOwner(req as any, 'owner-1');

    expect(result).toEqual(
      expect.objectContaining({
        id: 'img1',
        url: 'http://localhost:4000/uploads/img1',
        path: '/uploads/img1',
      }),
    );
  });

  it('getUploadedImage serves by id when found', async () => {
    const filePath = join(tmpdir(), `copilot-upload-${Date.now()}.txt`);
    writeFileSync(filePath, 'ok');

    service.findById.mockResolvedValue({ storagePath: filePath });
    const res = {
      sendFile: jest.fn(),
    };

    await controller.getUploadedImage('img-id', res as any);

    expect(service.findById).toHaveBeenCalledWith('img-id');
    expect(res.sendFile).toHaveBeenCalledWith(filePath);
  });

  it('getUploadedImage falls back to filename lookup', async () => {
    const filePath = join(tmpdir(), `copilot-upload-fallback-${Date.now()}.txt`);
    writeFileSync(filePath, 'ok');

    service.findById.mockResolvedValue(null);
    service.findByFilename.mockResolvedValue({ storagePath: filePath });
    const res = {
      sendFile: jest.fn(),
    };

    await controller.getUploadedImage('name.png', res as any);

    expect(service.findByFilename).toHaveBeenCalledWith('name.png');
    expect(res.sendFile).toHaveBeenCalledWith(filePath);
  });

  it('getUploadedImage throws not found for unknown identifier', async () => {
    service.findById.mockResolvedValue(null);
    service.findByFilename.mockResolvedValue(null);

    await expect(controller.getUploadedImage('unknown', { sendFile: jest.fn() } as any)).rejects.toThrow(
      NotFoundException,
    );
  });
});
