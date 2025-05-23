import { Roles } from '@prisma/client';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserDTO {
  @IsString()
  @IsNotEmpty({
    message: 'Nome é obrigatório',
  })
  name: string;
  @IsEmail()
  @IsNotEmpty({
    message: 'E-mail é obrigatório'
  })
  email: string;
  @IsString()
  @IsNotEmpty({
    message: 'Senha é obrigatório',
  })
  password: string;
  @IsOptional()
  role?: Roles;
}
