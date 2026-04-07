import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { AuthSession } from '../entities/auth-session.entity';
import { AppUser } from '../entities/app-user.entity';
import { UserRole } from '../entities/enums';
import { AbstractCrudService } from './abstract-crud.service';
import { EmailValidationService } from './email-validation.service';
import { PasswordService } from './password.service';
import { LoginAttemptService } from './login-attempt.service';
import { LoginRequest } from '../dto/login-request.dto';
import { LoginResponse } from '../dto/login-response.dto';
import { InvalidCredentialsException } from '../utils/errors';
import { createHash, randomUUID } from 'crypto';

@Injectable()
export class AuthSessionService extends AbstractCrudService<AuthSession, string> {
  constructor(
    @InjectRepository(AuthSession) repository: Repository<AuthSession>,
    @InjectRepository(AppUser) private readonly appUserRepository: Repository<AppUser>,
    private readonly emailValidationService: EmailValidationService,
    private readonly passwordService: PasswordService,
    private readonly loginAttemptService: LoginAttemptService,
  ) {
    super(repository);
  }

  protected setId(entity: AuthSession, id: string): void {
    entity.id = id;
  }

  async authenticate(request: LoginRequest, ip?: string, userAgent?: string): Promise<LoginResponse> {
    const email = (request.email || '').trim().toLowerCase();
    const password = request.password || '';
    const attemptKey = this.buildAttemptKey(email, ip);

    if (this.loginAttemptService.isBlocked(attemptKey)) {
      throw new InvalidCredentialsException('Muitas tentativas. Tente novamente em alguns minutos.');
    }

    if (!this.emailValidationService.hasValidFormat(email)) {
      this.loginAttemptService.registerFailure(attemptKey);
      throw new InvalidCredentialsException('Credenciais invalidas.');
    }

    const user = await this.appUserRepository.findOne({ where: { email } });
    if (!user) {
      this.loginAttemptService.registerFailure(attemptKey);
      throw new InvalidCredentialsException('Credenciais invalidas.');
    }

    const passwordMatches = await this.passwordService.matches(password, user.passwordHash);
    if (!passwordMatches) {
      this.loginAttemptService.registerFailure(attemptKey);
      throw new InvalidCredentialsException('Credenciais invalidas.');
    }

    if (!user.isActive) {
      this.loginAttemptService.registerFailure(attemptKey);
      throw new InvalidCredentialsException('Credenciais invalidas.');
    }

    if (!this.passwordService.isBcryptHash(user.passwordHash)) {
      user.passwordHash = await this.passwordService.hash(password);
    }

    const savedSession = await this.createSessionForUser(
      user,
      Boolean(request.rememberMe),
      ip,
      userAgent,
      email,
    );
    this.loginAttemptService.registerSuccess(attemptKey);

    return {
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      sessionId: savedSession.id,
      expiresAt: savedSession.expiresAt.toISOString(),
      isActive: Boolean(user.isActive),
      role: user.role,
    };
  }

  async authenticateSupabaseUser(
    appUser: AppUser,
    options?: { rememberMe?: boolean; ip?: string; userAgent?: string; providerUserId?: string },
  ): Promise<LoginResponse> {
    const savedSession = await this.createSessionForUser(
      appUser,
      Boolean(options?.rememberMe),
      options?.ip,
      options?.userAgent,
      options?.providerUserId || appUser.email,
    );

    return {
      userId: appUser.id,
      fullName: appUser.fullName,
      email: appUser.email,
      sessionId: savedSession.id,
      expiresAt: savedSession.expiresAt.toISOString(),
      isActive: Boolean(appUser.isActive),
      role: appUser.role,
    };
  }

  async assertActiveSession(sessionId: string, expectedUserId: string): Promise<void> {
    await this.requireActiveUser(sessionId, expectedUserId);
  }

  async requireActiveUser(sessionId: string, expectedUserId: string): Promise<AppUser> {
    if (!sessionId || !expectedUserId) {
      throw new InvalidCredentialsException('Sessao invalida.');
    }

    const session = await this.repository.findOne({
      where: {
        id: sessionId,
        revokedAt: IsNull(),
      },
      relations: ['user'],
    });

    if (!session || !session.user) {
      throw new InvalidCredentialsException('Sessao expirada ou invalida.');
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      throw new InvalidCredentialsException('Sessao expirada ou invalida.');
    }

    if (session.user.id !== expectedUserId) {
      throw new InvalidCredentialsException('Sessao nao autorizada para este usuario.');
    }
    if (!session.user.isActive) {
      throw new InvalidCredentialsException('Conta sem confirmacao de e-mail.');
    }

    return session.user;
  }

  async assertAdminSession(sessionId: string, expectedUserId: string): Promise<void> {
    const sessionUser = await this.requireActiveUser(sessionId, expectedUserId);
    if (sessionUser.role !== UserRole.ADMIN) {
      throw new InvalidCredentialsException('Acesso restrito a administradores.');
    }
  }

  async revokeSession(sessionId?: string | null, expectedUserId?: string | null): Promise<void> {
    if (!sessionId || !expectedUserId) {
      return;
    }

    const session = await this.repository.findOne({ where: { id: sessionId }, relations: ['user'] });
    if (!session || !session.user) {
      return;
    }

    if (session.user.id === expectedUserId && !session.revokedAt) {
      session.revokedAt = new Date();
      await this.repository.save(session);
    }
  }

  private sha256(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private async createSessionForUser(
    user: AppUser,
    rememberMe: boolean,
    ip?: string,
    userAgent?: string,
    entropySeed?: string,
  ): Promise<AuthSession> {
    const now = Date.now();
    const expiresAt = new Date(now + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000);

    const session = this.repository.create({
      user,
      rememberMe,
      ip: ip || null,
      userAgent: this.limit(userAgent, 255),
      refreshTokenHash: this.sha256(`${randomUUID()}:${entropySeed || user.email}:${now}`),
      expiresAt,
    });

    const savedSession = await this.repository.save(session);
    user.lastLoginAt = new Date();
    await this.appUserRepository.save(user);
    return savedSession;
  }

  private limit(value?: string, maxLength?: number): string | null {
    if (!value) {
      return null;
    }
    if (!maxLength) {
      return value;
    }
    return value.length <= maxLength ? value : value.substring(0, maxLength);
  }

  private buildAttemptKey(email?: string, ip?: string): string {
    const safeEmail = (email || '').trim().toLowerCase();
    const safeIp = (ip || 'unknown').trim();
    return `${safeEmail}|${safeIp}`;
  }
}
