import { Body, Controller, Get, Param, Post, Put, Req } from '@nestjs/common';
import { Request } from 'express';
import { AppUserService } from '../services/app-user.service';
import { RegisterRequest } from '../dto/register-request.dto';
import { ProfileUpdateRequest } from '../dto/profile-update-request.dto';
import { AppUser } from '../entities/app-user.entity';

@Controller('api/users')
export class AppUserController {
  constructor(private readonly appUserService: AppUserService) {}

  @Post()
  create(@Body() body: RegisterRequest): Promise<AppUser> {
    return this.appUserService.register(body);
  }

  @Get(':id')
  async getById(@Param('id') id: string, @Req() request: Request): Promise<AppUser> {
    const userId = this.getAuthenticatedUserId(request);
    if (id !== userId) {
      throw new Error('Usuario nao autorizado.');
    }
    return this.appUserService.findById(id);
  }

  @Put(':id/profile')
  async updateProfile(
    @Param('id') id: string,
    @Body() requestBody: ProfileUpdateRequest,
    @Req() request: Request,
  ): Promise<AppUser> {
    const userId = this.getAuthenticatedUserId(request);
    if (id !== userId) {
      throw new Error('Usuario nao autorizado.');
    }
    return this.appUserService.updateProfile(id, requestBody);
  }

  private getAuthenticatedUserId(request: Request): string {
    const value = (request as any).AUTH_USER_ID;
    if (typeof value === 'string') {
      return value;
    }
    throw new Error('Usuario nao autenticado.');
  }
}
