import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CompanyInputService } from './company-input.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { CreateCompanyInputDto } from './dto/create-company-input.dto';

@Controller('company-input')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompanyInputController {
  constructor(private readonly companyInputService: CompanyInputService) {}

  @Post()
  @Roles(UserRole.USER_A)
  async create(@Req() req: Request, @Body() dto: CreateCompanyInputDto) {
    const currentUser = req.user as { userId: string };
    const record = await this.companyInputService.create({
      ownerId: currentUser.userId,
      companyName: dto.companyName,
      numberOfUsers: dto.numberOfUsers,
      numberOfProducts: dto.numberOfProducts,
    });

    return record;
  }

  @Get('latest/:ownerId')
  @Roles(UserRole.USER_B)
  async getLatestForOwner(@Param('ownerId', new ParseUUIDPipe()) ownerId: string) {
    const record = await this.companyInputService.findLatestForOwner(ownerId);
    return record;
  }
}
