import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDTO } from './dto/update-user.dto';

import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findAllUsers(
    page: number,
    perPage: number,
    sortBy: string = 'createdAt',
    sortOrder: string = 'desc',
    searchTerm: string,
    roles?: string,
  ) {
    return await this.usersRepository.findAllUsers(page, perPage, sortBy, sortOrder, searchTerm, roles);
  }

  async findUserById(id: number) {
    const user = await this.usersRepository.findUserById(id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado!');
    }

    return user;
  }

  async findUserByEmail(email: string) {
    const user = await this.usersRepository.findUserByEmail(email);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado!');
    }

    return user;
  }

  async findUserByEmailWithPassword(email: string) {
    const user = await this.usersRepository.findUserByEmailWithPassword(email);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado!');
    }

    return user;
  }

  async createUser(data: CreateUserDTO) {
    const { email, password } = data;

    const user = await this.usersRepository.findUserByEmail(email);

    if (user) {
      throw new BadRequestException('E-mail já cadastrado!');
    }

    const hashPassword = await bcrypt.hash(password, 10);

    return await this.usersRepository.createUser({
      ...data,
      password: hashPassword,
    });
  }

  async updateUser(id: number, data: UpdateUserDTO) {
    const { email, password } = data;

    const user = await this.findUserByEmail(email);

    const isUserIdDifferent = user.id !== id;

    if (user && isUserIdDifferent) {
      throw new BadRequestException('E-mail já pertence a outro usuário!');
    }

    let userObj = data;

    if (password) {
      const hashPassword = await bcrypt.hash(password, 10);
      userObj = {
        ...userObj,
        password: hashPassword,
      };
    }

    return await this.usersRepository.updateUser(id, userObj);
  }

  async deleteUser(id: number) {
    const user = await this.findUserById(id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado!');
    }

    return await this.usersRepository.deleteUser(id);
  }
}
