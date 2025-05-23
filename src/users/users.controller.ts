import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDTO } from './dto/update-user.dto';
import { Roles } from './enums/roles.enum';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Get()
  async findAllUsers(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('sortOrder') sortOrder: string = 'desc',
    @Query('searchTerm') searchTerm: string,
    @Query('role') roles?: string,
  ) {
    try {
      return await this.usersService.findAllUsers(page, perPage, sortBy, sortOrder, searchTerm, roles);
    } catch (error) {
      console.log(error);
      throw new HttpException(error.response, error.status);
    }
  }
  @Get('/:id')
  async findUserById(@Param('id') id: number) {
    try {
      return await this.usersService.findUserById(id);
    } catch (error) {
      console.log(error);
      throw new HttpException(error.response, error.status);
    }
  }
  @Get('/:email')
  async findUserByEmail(@Param('email') email: string) {
    try {
      return await this.usersService.findUserByEmail(email);
    } catch (error) {
      console.log(error);
      throw new HttpException(error.response, error.status);
    }
  }
  @Post()
  async createUser(@Body() data: CreateUserDTO) {
    try {
      return await this.usersService.createUser(data);
    } catch (error) {
      console.log(error);
      throw new HttpException(error.response, error.status);
    }
  }
  @Put('/:id')
  async updateUser(@Param('id') id: number, @Body() data: UpdateUserDTO) {
    try {
      return await this.usersService.updateUser(id, data);
    } catch (error) {
      console.log(error);
      throw new HttpException(error.response, error.status);
    }
  }
  @Delete('/:id')
  async deleteUser(@Param('id') id: number) {
    try {
      return await this.usersService.deleteUser(id);
    } catch (error) {
      console.log(error);
      throw new HttpException(error.response, error.status);
    }
  }
}
