import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class RPIsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllRPIs(rpiNumber: string) {
    try {
      let where: any = {};

      if (rpiNumber) {
        where = {
          ...where,
          numero: {
            contains: rpiNumber,
          },
        };
      }

      where.deletedAt = null;

      return await this.prisma.revistas_RPI.findMany({
        where,
        select: {
          id: true,
          numero: true,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }
}
