import { IsNotEmpty, IsString, IsDate, IsArray, IsNumber } from 'class-validator';

export class CreateRevistaRPIDTO {
  @IsString()
  @IsNotEmpty({ message: 'Número é obrigatório' })
  numero: string;

  @IsDate()
  @IsNotEmpty({ message: 'Data é obrigatória' })
  data: Date;

  @IsArray()
  @IsNumber()
  processos: number[]
}
