import { Controller, Get, HttpException, Param, Query } from '@nestjs/common';
import { RpisService } from './rpis.service';
import { Roles } from 'src/users/enums/roles.enum';

@Controller('rpis')
export class RpisController {
  constructor(private readonly rpiService: RpisService) {}

  @Get('/all')
  async findAllRPIs(@Query('rpiNumber') rpiNumber: string) {
    try {
      return await this.rpiService.findAllRPis(rpiNumber);
    } catch (error) {
      console.log(error);
      throw new HttpException(error.message, error.status);
    }
  }

  @Get('old')
  async fetchOldRPIsData(
    @Query('rpiNumber') rpiNumber: string,
    @Query('totalDownloads') totalDownloads: number,
    @Query('extractFullINPIData') extractFullINPIData?: string,
  ) {
    try {
      return await this.rpiService.fetchOldRPIsData(rpiNumber, totalDownloads, extractFullINPIData);
    } catch (error) {
      console.log(error);
      throw new HttpException(error.message, error.status);
    }
  }

  @Get('inpi')
  async fetchINPIProcessData(
    @Query('rpiNumber') rpiNumber?: string,
    @Query('onlyBunkerProcess') onlyBunkerProcess?: string,
  ) {
    try {
      let numerosRevistas = rpiNumber.includes(',') ? String(rpiNumber).split(',').map(num => num) : [rpiNumber];
      return await this.rpiService.readAllMarcasProcessosINPIPageData(numerosRevistas, onlyBunkerProcess);
    } catch (error) {
      console.log(error);
      throw new HttpException(error.message, error.status);
    }
  }

  @Get('/inpi/process/:number')
  async getProcessoINPIPageData(@Param('number') number: string) {
    try {
      return await this.rpiService.readProcessoINPIPageData(number);
    } catch (error) {
      console.log(error);
      throw new HttpException(error.message, error.status);
    }
  }

  @Get('weekly')
  async fetchWeeklyRPI() {
    try {
      return await this.rpiService.fetchWeeklyRPI();
    } catch (error) {
      console.log({ error });
      throw new HttpException(error.message, error.status);
    }
  }
}
