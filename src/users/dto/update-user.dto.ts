import { Roles } from '@prisma/client';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserDTO {
  @IsString()
  @IsNotEmpty({
    message: 'Nome é obrigatório',
  })
  name: string;
  @IsEmail()
  @IsOptional()
  email: string;
  @IsOptional({
    message: 'Senha é obrigatório',
  })
  password: string;
  @IsOptional()
  role: Roles;
}
