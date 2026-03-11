import { Module } from '@nestjs/common';
import { CompanyInputService } from './company-input.service';
import { CompanyInputController } from './company-input.controller';
import { PrismaModule } from '../common/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CompanyInputService],
  controllers: [CompanyInputController],
})
export class CompanyInputModule {}
