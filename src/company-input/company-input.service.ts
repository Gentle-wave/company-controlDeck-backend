import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

interface CreateCompanyInputParams {
  ownerId: string;
  companyName: string;
  numberOfUsers: number;
  numberOfProducts: number;
}

@Injectable()
export class CompanyInputService {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: CreateCompanyInputParams) {
    const { ownerId, companyName, numberOfUsers, numberOfProducts } = params;

    const percentage =
      numberOfUsers > 0 ? (numberOfProducts / numberOfUsers) * 100 : 0;

    return this.prisma.companyInput.create({
      data: {
        ownerId,
        companyName,
        numberOfUsers,
        numberOfProducts,
        percentage,
      },
    });
  }

  async findLatestForOwner(ownerId: string) {
    return this.prisma.companyInput.findFirst({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
