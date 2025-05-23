import { Injectable } from '@nestjs/common';
import { LogsDownloadsRpisWeeklyRepository } from './logs-downloads-rpis-weekly.repository';
import { CreateLogDownloadRPIWeeklyDTO } from './dtos/create-log-download-rpi-weekly.dto';
import { LogsDownloadsRPIsWeekly } from './entity/logs-downloads-rpis-weekly.entity';

@Injectable()
export class LogsDownloadsRpisWeeklyService {
  constructor(
    private logsDownloadsRPIsRepository: LogsDownloadsRpisWeeklyRepository,
  ) {}

  async createLog(
    logDTO: CreateLogDownloadRPIWeeklyDTO,
  ): Promise<LogsDownloadsRPIsWeekly | null> {
    return await this.logsDownloadsRPIsRepository.createLog(logDTO);
  }

  async findLogById(id: number): Promise<LogsDownloadsRPIsWeekly | null> {
    return await this.logsDownloadsRPIsRepository.findLogById(id);
  }

  async findLogByNumber(
    number: string,
  ): Promise<LogsDownloadsRPIsWeekly | null> {
    return await this.logsDownloadsRPIsRepository.findLogByNumber(number);
  }

  async findAllLogsDownloadsRPIs(
    page: number,
    perPage: number,
    sortBy: string,
    sortOrder: string,
    searchTerm: string,
  ) {
    return await this.logsDownloadsRPIsRepository.findAllLogsDownloadsRPIs(
      page,
      perPage,
      sortBy,
      sortOrder,
      searchTerm,
    );
  }
}
