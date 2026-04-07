import { Body, Controller, Headers, HttpCode, Post, Req, Res, UsePipes } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthSessionService } from '../services/auth-session.service';
import { LoginRequest } from '../dto/login-request.dto';
import { LoginResponse } from '../dto/login-response.dto';
import { getEnvFlag } from '../config/env';
import { getClientIp } from '../utils/client-ip';
import { SupabaseLoginRequest } from '../dto/supabase-login-request.dto';
import { AppUserService } from '../services/app-user.service';
import { STRICT_BODY_VALIDATION_PIPE } from '../validation/strict-body-validation.pipe';

@Controller('api/auth-sessions')
export class AuthSessionController {
  private readonly sessionCookieName = 'SESSION_ID';
  private readonly userCookieName = 'USER_ID';

  constructor(
    private readonly authSessionService: AuthSessionService,
    private readonly appUserService: AppUserService,
  ) {}

  @Post('login')
  @UsePipes(STRICT_BODY_VALIDATION_PIPE)
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

  @Post('supabase')
  @UsePipes(STRICT_BODY_VALIDATION_PIPE)
  async loginWithSupabase(
    @Body() request: SupabaseLoginRequest,
    @Req() servletRequest: Request,
    @Res({ passthrough: true }) servletResponse: Response,
  ): Promise<LoginResponse> {
    const accessToken = (request.accessToken || '').trim();
    if (!accessToken) {
      throw new Error('Token do Supabase nao informado.');
    }

    const providerUser = await this.fetchSupabaseUser(accessToken);
    const email = typeof providerUser?.email === 'string' ? providerUser.email : '';
    const fullName =
      providerUser?.user_metadata?.full_name ||
      providerUser?.user_metadata?.name ||
      email;
    const phone =
      typeof providerUser?.user_metadata?.phone === 'string'
        ? providerUser.user_metadata.phone
        : null;

    const appUser = await this.appUserService.findOrCreateSupabaseUser({
      email,
      fullName,
      phone,
    });

    const response = await this.authSessionService.authenticateSupabaseUser(appUser, {
      rememberMe: Boolean(request.rememberMe),
      ip: getClientIp(servletRequest),
      userAgent: servletRequest.header('User-Agent') || undefined,
      providerUserId: typeof providerUser?.id === 'string' ? providerUser.id : appUser.id,
    });

    const expiresAt = new Date(response.expiresAt).getTime();
    this.addSessionCookie(servletResponse, this.sessionCookieName, response.sessionId, expiresAt);
    this.addSessionCookie(servletResponse, this.userCookieName, response.userId, expiresAt);
    return response;
  }

  private async fetchSupabaseUser(accessToken: string): Promise<any> {
    const supabaseUrl = (process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || '').trim();
    const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY || '').trim();

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase Auth nao configurado no backend.');
    }

    const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
      method: 'GET',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Token do Supabase invalido ou expirado.');
    }

    return response.json();
  }

  private addSessionCookie(response: Response, name: string, value: string, expiresAtEpochMs: number) {
    const secure = getEnvFlag(process.env.APP_AUTH_COOKIE_SECURE, false);
    const sameSite = ((process.env.APP_AUTH_COOKIE_SAMESITE || 'Lax').toLowerCase() as 'lax' | 'strict' | 'none');
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
    const sameSite = ((process.env.APP_AUTH_COOKIE_SAMESITE || 'Lax').toLowerCase() as 'lax' | 'strict' | 'none');
    response.cookie(name, '', {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
      maxAge: 0,
    });
  }
}
