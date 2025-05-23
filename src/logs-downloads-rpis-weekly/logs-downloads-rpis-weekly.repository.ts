import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateLogDownloadRPIWeeklyDTO } from './dtos/create-log-download-rpi-weekly.dto';
import { LogsDownloadsRPIsWeekly } from './entity/logs-downloads-rpis-weekly.entity';

@Injectable()
export class LogsDownloadsRpisWeeklyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllLogsDownloadsRPIs(
    page: number = 0,
    perPage: number = 10,
    sortBy: string = 'createdAt',
    sortOrder: string = 'desc',
    searchTerm: string = null,
  ) {
    let where: any = {};

    let skip = page * perPage;

    if (searchTerm) {
      where = {
        ...where,
        message: {
          contains: searchTerm,
        },
      };
    }

    where.deletedAt = null;

    const logs = await this.prisma.logs_Downloads_RPIs_Weekly.findMany({
      where,
      skip,
      take: perPage,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    const total = await this.prisma.logs_Downloads_RPIs_Weekly.count({
      where,
    });

    return { logs, total };
  }

  async createLog(
    logDTO: CreateLogDownloadRPIWeeklyDTO,
  ): Promise<LogsDownloadsRPIsWeekly | null> {
    try {
      return await this.prisma.logs_Downloads_RPIs_Weekly.create({
        data: logDTO,
      });
    } catch (error) {
      console.log(error);
    }
  }

  async findLogById(id: number): Promise<LogsDownloadsRPIsWeekly | null> {
    try {
      return await this.prisma.logs_Downloads_RPIs_Weekly.findUnique({
        where: {
          id,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  async findLogByNumber(
    number: string,
  ): Promise<LogsDownloadsRPIsWeekly | null> {
    try {
      return await this.prisma.logs_Downloads_RPIs_Weekly.findFirst({
        where: {
          number,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }
}
