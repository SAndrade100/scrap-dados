import {
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { LogsDownloadsRpisWeeklyService } from './logs-downloads-rpis-weekly.service';
import { CreateLogDownloadRPIWeeklyDTO } from './dtos/create-log-download-rpi-weekly.dto';

@Controller('logs-downloads-rpis-weekly')
export class LogsDownloadsRpisWeeklyController {
  constructor(
    private readonly logsDownloadsRPIsService: LogsDownloadsRpisWeeklyService,
  ) {}

  @Get()
  async findAllLogsDownloadsRPIs(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Query('sortBy') sortBy: string,
    @Query('sortOrder') sortOrder: string,
    @Query('searchTerm') searchTerm: string,
  ) {
    try {
      return await this.logsDownloadsRPIsService.findAllLogsDownloadsRPIs(
        page,
        perPage,
        sortBy,
        sortOrder,
        searchTerm,
      );
    } catch (error) {
      console.log(error);
      throw new HttpException(error.message, error.status);
    }
  }

  @Get('/:id')
  async findLogById(@Param('id') id: number) {
    try {
      return await this.logsDownloadsRPIsService.findLogById(id);
    } catch (error) {
      console.log(error);
      throw new HttpException(error.message, error.status);
    }
  }

  @Get('number/:number')
  async findLogByNumber(@Param('number') number: string) {
    try {
      return await this.logsDownloadsRPIsService.findLogByNumber(number);
    } catch (error) {
      console.log(error);
      throw new HttpException(error.message, error.status);
    }
  }

  @Post()
  async createLog(@Body() createLogDTO: CreateLogDownloadRPIWeeklyDTO) {
    try {
      return await this.logsDownloadsRPIsService.createLog(createLogDTO);
    } catch (error) {
      console.log(error);
      throw new HttpException(error.message, error.status);
    }
  }
}
