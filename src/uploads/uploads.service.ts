import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class UploadsService {
  constructor(private readonly prisma: PrismaService) {}

  async recordUpload(params: {
    ownerId: string;
    uploaderId: string;
    filename: string;
    mimetype: string;
    size: number;
    storagePath: string;
  }) {
    const { ownerId, uploaderId, filename, mimetype, size, storagePath } = params;
    return this.prisma.imageUpload.create({
      data: {
        ownerId,
        uploaderId,
        filename,
        mimetype,
        size,
        storagePath,
      },
    });
  }

  async findLatestForOwner(ownerId: string) {
    return this.prisma.imageUpload.findFirst({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.imageUpload.findUnique({ where: { id } });
  }

  async findByFilename(filename: string) {
    return this.prisma.imageUpload.findFirst({
      where: { filename },
      orderBy: { createdAt: 'desc' },
    });
  }
}
