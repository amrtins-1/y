import { Body, Controller, Post, Req, Res, Headers, HttpCode } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthSessionService } from '../services/auth-session.service';
import { LoginRequest } from '../dto/login-request.dto';
import { LoginResponse } from '../dto/login-response.dto';
import { getEnvFlag } from '../config/env';
import { getClientIp } from '../utils/client-ip';

@Controller('api/auth-sessions')
export class AuthSessionController {
  private readonly sessionCookieName = 'SESSION_ID';
  private readonly userCookieName = 'USER_ID';

  constructor(private readonly authSessionService: AuthSessionService) {}

  @Post('login')
  async login(
    @Body() request: LoginRequest,
    @Req() servletRequest: Request,
    @Res({ passthrough: true }) servletResponse: Response,
  ): Promise<LoginResponse> {
    const response = await this.authSessionService.authenticate(
      request,
      getClientIp(servletRequest),
      servletRequest.header('User-Agent') || undefined,
    );
    const expiresAt = new Date(response.expiresAt).getTime();
    this.addSessionCookie(servletResponse, this.sessionCookieName, response.sessionId, expiresAt);
    this.addSessionCookie(servletResponse, this.userCookieName, response.userId, expiresAt);
    return response;
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @Headers('X-Session-Id') sessionIdHeader: string | undefined,
    @Headers('X-User-Id') userIdHeader: string | undefined,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const sessionId = sessionIdHeader || request.cookies?.[this.sessionCookieName];
    const userId = userIdHeader || request.cookies?.[this.userCookieName];
    await this.authSessionService.revokeSession(sessionId, userId);
    this.clearSessionCookie(response, this.sessionCookieName);
    this.clearSessionCookie(response, this.userCookieName);
  }

  private addSessionCookie(response: Response, name: string, value: string, expiresAtEpochMs: number) {
    const secure = getEnvFlag(process.env.APP_AUTH_COOKIE_SECURE, false);
    const sameSite = (process.env.APP_AUTH_COOKIE_SAMESITE || 'Lax') as 'Lax' | 'Strict' | 'None';
    const maxAge = Math.max(1, Math.floor((expiresAtEpochMs - Date.now()) / 1000));
    response.cookie(name, value, {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
      maxAge: maxAge * 1000,
    });
  }

  private clearSessionCookie(response: Response, name: string) {
    const secure = getEnvFlag(process.env.APP_AUTH_COOKIE_SECURE, false);
    const sameSite = (process.env.APP_AUTH_COOKIE_SAMESITE || 'Lax') as 'Lax' | 'Strict' | 'None';
    response.cookie(name, '', {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
      maxAge: 0,
    });
  }
}
