import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Req, UsePipes } from '@nestjs/common';
import { Request } from 'express';
import { AppUserService } from '../services/app-user.service';
import { AuthSessionService } from '../services/auth-session.service';
import { RegisterRequest } from '../dto/register-request.dto';
import { ProfileUpdateRequest } from '../dto/profile-update-request.dto';
import { AppUser } from '../entities/app-user.entity';
import { STRICT_BODY_VALIDATION_PIPE } from '../validation/strict-body-validation.pipe';

@Controller('api/users')
export class AppUserController {
  constructor(
    private readonly appUserService: AppUserService,
    private readonly authSessionService: AuthSessionService,
  ) {}

  @Post()
  @UsePipes(STRICT_BODY_VALIDATION_PIPE)
  create(@Body() body: RegisterRequest): Promise<AppUser> {
    return this.appUserService.register(body);
  }

  @Get(':id')
  async getById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Req() request: Request): Promise<AppUser> {
    const userId = await this.getAuthenticatedUserId(request);
    if (id !== userId) {
      throw new Error('Usuario nao autorizado.');
    }
    return this.appUserService.findById(id);
  }

  @Put(':id/profile')
  @UsePipes(STRICT_BODY_VALIDATION_PIPE)
  async updateProfile(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() requestBody: ProfileUpdateRequest,
    @Req() request: Request,
  ): Promise<AppUser> {
    const userId = await this.getAuthenticatedUserId(request);
    if (id !== userId) {
      throw new Error('Usuario nao autorizado.');
    }
    return this.appUserService.updateProfile(id, requestBody);
  }

  private async getAuthenticatedUserId(request: Request): Promise<string> {
    const value = (request as any).AUTH_USER_ID;
    if (typeof value === 'string') {
      return value;
    }

    const sessionId = request.header('X-Session-Id') || request.cookies?.['SESSION_ID'];
    const userId = request.header('X-User-Id') || request.cookies?.['USER_ID'];

    if (sessionId && userId) {
      await this.authSessionService.assertActiveSession(sessionId, userId);
      return userId;
    }

    throw new Error('Usuario nao autenticado.');
  }
}
