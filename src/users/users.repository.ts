import { PrismaService } from 'src/database/prisma.service';
import { CreateUserDTO } from './dto/create-user.dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllUsers(
    page: number,
    perPage: number,
    sortBy: string = 'createdAt',
    sortOrder: string = 'desc',
    searchTerm: string,
    roles?: string,
  ) {
    let skip = page * perPage;
    let where: any = {}

    if (searchTerm) {
      where = {
        ...where,
        OR: [
          {
            name: {
              contains: searchTerm ?? '%'
            }
          },
          {
            email: {
              contains: searchTerm ?? '%'
            }
          }
        ]
      }
    }

    if (roles) {
      where = {
        ...where,
        role: {
          in: roles.split(',')
        }
      }
    }

    where.deletedAt = null;

    const fetchedUsers = await this.prisma.user.findMany({
      where,
      skip,
      take: perPage,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });
    const users = [];

    for (const user of fetchedUsers) {
      delete user?.password;
      users.push(user);
    }

    const count = await this.prisma.user.count({where});

    return {users, count};
  }

  async findUserById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
    });
    delete user?.password;
    return user;
  }

  async findUserByEmail(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    delete user?.password;
    return user;
  }

  async findUserByEmailWithPassword(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    return user;
  }

  async createUser(data: CreateUserDTO) {
    const user = await this.prisma.user.create({ data });
    delete user.password;
    return user;
  }

  async updateUser(id: number, data: { name?: string; email?: string }) {
    const user = await this.prisma.user.update({ where: { id }, data });
    delete user.password;
    return user;
  }

  async deleteUser(id: number) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    delete user?.password;
    return user;
  }
}
