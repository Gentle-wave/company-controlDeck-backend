import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '@prisma/client';
import { Request, Response } from 'express';
import { UploadImageDto } from './dto/upload-image.dto';
import { existsSync } from 'fs';
import { isAbsolute, join } from 'path';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER_B)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Req() req: Request,
    @Body() dto: UploadImageDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const currentUser = req.user as { userId: string };

    const record = await this.uploadsService.recordUpload({
      ownerId: dto.ownerId,
      uploaderId: currentUser.userId,
      filename: file.filename ?? file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      storagePath: file.path,
    });

    return record;
  }

  @Get('latest/:ownerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER_B)
  async getLatestForOwner(
    @Req() req: Request,
    @Param('ownerId', new ParseUUIDPipe()) ownerId: string,
  ) {
    const record = await this.uploadsService.findLatestForOwner(ownerId);
    if (!record) {
      return null;
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return {
      ...record,
      url: `${baseUrl}/uploads/${record.id}`,
      path: `/uploads/${record.id}`,
    };
  }

  @Get(':identifier')
  async getUploadedImage(@Param('identifier') identifier: string, @Res() res: Response) {
    const byId = await this.uploadsService.findById(identifier);
    const record = byId ?? (await this.uploadsService.findByFilename(identifier));

    if (!record) {
      throw new NotFoundException('Image not found');
    }

    const storagePath = isAbsolute(record.storagePath)
      ? record.storagePath
      : join(process.cwd(), record.storagePath);

    if (!existsSync(storagePath)) {
      throw new NotFoundException('Image file missing on disk');
    }

    return res.sendFile(storagePath);
  }
}
