import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RpisModule } from './rpis/rpis.module';
import { LogsDownloadsRpisWeeklyModule } from './logs-downloads-rpis-weekly/logs-downloads-rpis-weekly.module';

@Module({
  imports: [RpisModule, LogsDownloadsRpisWeeklyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
