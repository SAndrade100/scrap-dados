import { Module } from '@nestjs/common';
import { LogsDownloadsRpisWeeklyService } from './logs-downloads-rpis-weekly.service';
import { LogsDownloadsRpisWeeklyController } from './logs-downloads-rpis-weekly.controller';
import { PrismaModule } from 'src/database/prisma.module';
import { LogsDownloadsRpisWeeklyRepository } from './logs-downloads-rpis-weekly.repository';

@Module({
  imports: [PrismaModule],
  controllers: [LogsDownloadsRpisWeeklyController],
  providers: [LogsDownloadsRpisWeeklyService, LogsDownloadsRpisWeeklyRepository],
  exports: [LogsDownloadsRpisWeeklyRepository, LogsDownloadsRpisWeeklyService]
})
export class LogsDownloadsRpisWeeklyModule {}
