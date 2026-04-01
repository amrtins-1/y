import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppUser } from '../entities/app-user.entity';
import { EmailVerificationToken } from '../entities/email-verification-token.entity';
import { EmailDeliveryService } from './email-delivery.service';
import { EmailValidationService } from './email-validation.service';
import { randomBytes, createHash } from 'crypto';
import { getEnvNumber } from '../config/env';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    @InjectRepository(AppUser) private readonly appUserRepository: Repository<AppUser>,
    @InjectRepository(EmailVerificationToken)
    private readonly tokenRepository: Repository<EmailVerificationToken>,
    private readonly emailDeliveryService: EmailDeliveryService,
    private readonly emailValidationService: EmailValidationService,
  ) {}

  async sendVerificationForUser(user: AppUser | null | undefined): Promise<void> {
    if (!user?.id || !user.email) {
      return;
    }

    await this.invalidateOpenTokens(user.id);

    const rawToken = this.generateRawToken();
    const rawCode = this.generateNumericCode();
    const codeSalt = cryptoRandomUuid();
    const token = this.tokenRepository.create({
      user,
      tokenHash: this.sha256(rawToken),
      codeSalt,
      codeHash: this.sha256(`${rawCode}:${codeSalt}`),
      expiresAt: new Date(Date.now() + this.ttlHours() * 3600 * 1000),
    });
    await this.tokenRepository.save(token);

    const verificationUrl = `${this.normalizeBaseUrl(process.env.APP_API_BASE_URL || 'http://localhost:8080')}/api/email-verification/confirm?token=${rawToken}`;
    const subject = 'Confirme seu e-mail';
    const body =
      `Ola ${user.fullName},\n\n` +
      `Seu codigo de confirmacao e: ${rawCode}\n\n` +
      'Digite este codigo na pagina de confirmacao do site.\n\n' +
      'Ou, se preferir, confirme clicando no link abaixo:\n' +
      `${verificationUrl}\n\n` +
      `Este link expira em ${this.ttlHours()} horas.\n\n` +
      'Se voce nao solicitou este cadastro, ignore esta mensagem.';

    try {
      await this.emailDeliveryService.send(user.email, subject, body);
    } catch (error) {
      this.logger.error(`Falha ao enviar e-mail de verificacao para ${user.email}`, error as Error);
    }
  }

  async requestVerification(email: string): Promise<void> {
    if (!(await this.emailValidationService.isAllowedForSignup(email))) {
      return;
    }

    const user = await this.appUserRepository.findOne({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user) {
      return;
    }
    if (user.isActive) {
      return;
    }

    await this.sendVerificationForUser(user);
  }

  async confirmByCode(email: string, code: string): Promise<boolean> {
    if (!this.emailValidationService.hasValidFormat(email)) {
      return false;
    }
    if (!code || !/^\d{6}$/.test(code)) {
      return false;
    }

    const user = await this.appUserRepository.findOne({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user) {
      return false;
    }
    if (user.isActive) {
      return true;
    }

    const openTokens = await this.tokenRepository.find({
      where: {
        user: { id: user.id },
        usedAt: null as unknown as Date,
      },
      order: { createdAt: 'DESC' },
    });

    const now = Date.now();
    for (const token of openTokens) {
      if (token.expiresAt && token.expiresAt.getTime() <= now) {
        continue;
      }
      const expectedHash = this.sha256(`${code}:${token.codeSalt}`);
      if (expectedHash === token.codeHash) {
        token.usedAt = new Date();
        await this.tokenRepository.save(token);
        user.isActive = true;
        await this.appUserRepository.save(user);
        return true;
      }
    }

    return false;
  }

  async confirmByToken(rawToken: string): Promise<boolean> {
    if (!rawToken || !rawToken.trim()) {
      return false;
    }

    const token = await this.tokenRepository.findOne({
      where: {
        tokenHash: this.sha256(rawToken),
        usedAt: null as unknown as Date,
      },
      relations: ['user'],
    });
    if (!token || !token.user) {
      return false;
    }
    if (token.expiresAt && token.expiresAt.getTime() <= Date.now()) {
      return false;
    }

    token.usedAt = new Date();
    await this.tokenRepository.save(token);
    token.user.isActive = true;
    await this.appUserRepository.save(token.user);
    return true;
  }

  private async invalidateOpenTokens(userId: string): Promise<void> {
    const tokens = await this.tokenRepository.find({
      where: { user: { id: userId }, usedAt: null as unknown as Date },
      relations: ['user'],
    });
    if (tokens.length === 0) {
      return;
    }
    const now = new Date();
    for (const token of tokens) {
      token.usedAt = now;
    }
    await this.tokenRepository.save(tokens);
  }

  private generateRawToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private generateNumericCode(): string {
    return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
  }

  private sha256(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private normalizeBaseUrl(baseUrl: string): string {
    if (!baseUrl || !baseUrl.trim()) {
      return 'http://localhost:4321';
    }
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  private ttlHours(): number {
    return getEnvNumber(process.env.APP_EMAIL_VERIFICATION_TTL_HOURS, 24);
  }
}

function cryptoRandomUuid(): string {
  return randomBytes(16).toString('hex');
}
