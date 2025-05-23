import { IsDateString, IsNotEmpty, IsString } from "class-validator";

export class CreateLogDownloadRPIWeeklyDTO {
    @IsString()
    @IsNotEmpty({
        message: 'O número do processo é obrigatório'
    })
    number: string;
    @IsString()
    @IsNotEmpty({
        message: 'O status é obrigatório'
    })
    status: string;
    @IsString()
    @IsNotEmpty({
        message: 'O status é obrigatório'
    })
    message: string;
    @IsDateString()
    @IsNotEmpty({
        message: 'A data do log é obrigatória'
    })
    date: string | Date;
}