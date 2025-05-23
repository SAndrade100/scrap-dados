import { Module } from '@nestjs/common';
import { RpisController } from './rpis.controller';
import { RpisService } from './rpis.service';
import { LogsDownloadsRpisWeeklyModule } from 'src/logs-downloads-rpis-weekly/logs-downloads-rpis-weekly.module';
import { PrismaModule } from 'src/database/prisma.module';
import { RPIsRepository } from './rpis.repository';

@Module({
  imports: [LogsDownloadsRpisWeeklyModule, PrismaModule],
  controllers: [RpisController],
  providers: [RpisService, RPIsRepository],
  exports: [RpisService, RPIsRepository],
})
export class RpisModule {}
