import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppUser } from '../entities/app-user.entity';
import { UserRole } from '../entities/enums';
import { AbstractCrudService } from './abstract-crud.service';
import { EmailValidationService } from './email-validation.service';
import { PasswordService } from './password.service';
import { EmailVerificationService } from './email-verification.service';
import { RegisterRequest } from '../dto/register-request.dto';
import { ProfileUpdateRequest } from '../dto/profile-update-request.dto';

@Injectable()
export class AppUserService extends AbstractCrudService<AppUser, string> {
  constructor(
    @InjectRepository(AppUser) repository: Repository<AppUser>,
    private readonly emailValidationService: EmailValidationService,
    private readonly passwordService: PasswordService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {
    super(repository);
  }

  protected setId(entity: AppUser, id: string): void {
    entity.id = id;
  }

  override async create(entity: AppUser): Promise<AppUser> {
    const rawPassword = (entity.passwordHash || '').trim();
    if (rawPassword.length < 8) {
      throw new Error('A senha deve ter no minimo 8 caracteres.');
    }
    entity.passwordHash = await this.passwordService.hash(rawPassword);
    entity.role = UserRole.MEMBER;
    entity.isActive = false;
    await this.validateAndNormalize(entity, null);
    const saved = await this.repository.save(entity);
    await this.emailVerificationService.sendVerificationForUser(saved);
    return saved;
  }

  async register(request: RegisterRequest): Promise<AppUser> {
    const entity = new AppUser();
    entity.fullName = request.fullName?.trim() || '';
    entity.email = request.email;
    entity.phone = this.normalizeBlankToNull(request.phone);
    entity.passwordHash = request.password;
    return this.create(entity);
  }

  override async update(id: string, entity: AppUser): Promise<AppUser> {
    const existing = await this.findById(id);
    const incomingPassword = entity.passwordHash;
    if (!incomingPassword || !incomingPassword.trim()) {
      entity.passwordHash = existing.passwordHash;
    } else if (!this.passwordService.isBcryptHash(incomingPassword)) {
      if (incomingPassword.trim().length < 8) {
        throw new Error('A senha deve ter no minimo 8 caracteres.');
      }
      entity.passwordHash = await this.passwordService.hash(incomingPassword.trim());
    }
    await this.validateAndNormalize(entity, id);
    return super.update(id, entity);
  }

  async emailExists(email: string): Promise<boolean> {
    if (!email || !email.trim()) {
      return false;
    }
    const normalized = email.trim().toLowerCase();
    const count = await this.repository.count({ where: { email: normalized } });
    return count > 0;
  }

  async updateProfile(id: string, request: ProfileUpdateRequest): Promise<AppUser> {
    const user = await this.findById(id);

    const currentPassword = request.currentPassword || '';
    if (!currentPassword.trim()) {
      throw new Error('Senha atual e obrigatoria.');
    }
    const matches = await this.passwordService.matches(currentPassword, user.passwordHash);
    if (!matches) {
      throw new Error('Senha atual incorreta.');
    }

    const fullName = request.fullName?.trim() || '';
    if (!fullName) {
      throw new Error('Nome completo e obrigatorio.');
    }
    user.fullName = fullName;

    if (request.email) {
      user.email = request.email.trim();
    }

    user.phone = this.normalizeBlankToNull(request.phone);

    const cpfDigits = this.normalizeCpf(request.cpf);
    if (cpfDigits) {
      const exists = await this.repository
        .createQueryBuilder('user')
        .where('user.cpf = :cpf', { cpf: cpfDigits })
        .andWhere('user.id != :id', { id })
        .getCount();
      if (exists > 0) {
        throw new Error('CPF ja cadastrado para outro usuario.');
      }
    }
    user.cpf = cpfDigits;

    const newPassword = request.newPassword?.trim() || '';
    if (newPassword) {
      if (newPassword.length < 8) {
        throw new Error('A nova senha deve ter no minimo 8 caracteres.');
      }
      user.passwordHash = await this.passwordService.hash(newPassword);
    }

    await this.validateAndNormalize(user, id);
    return this.repository.save(user);
  }

  private async validateAndNormalize(entity: AppUser, currentId: string | null): Promise<void> {
    if (!entity.email || !entity.email.trim()) {
      throw new Error('E-mail e obrigatorio.');
    }

    const normalizedEmail = entity.email.trim().toLowerCase();
    if (!this.emailValidationService.hasValidFormat(normalizedEmail)) {
      throw new Error('Formato de e-mail invalido.');
    }
    if (!(await this.emailValidationService.hasDeliverableDomain(normalizedEmail))) {
      throw new Error('Dominio de e-mail invalido ou inexistente.');
    }
    if (this.emailValidationService.isDisposableDomain(normalizedEmail)) {
      throw new Error('E-mail temporario nao permitido. Informe um e-mail real.');
    }

    const existing = await this.repository.findOne({ where: { email: normalizedEmail } });
    if (existing && (!currentId || existing.id !== currentId)) {
      throw new Error('E-mail ja cadastrado.');
    }

    entity.email = normalizedEmail;
  }

  private normalizeBlankToNull(value?: string | null): string | null {
    if (!value) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private normalizeCpf(value?: string | null): string | null {
    if (!value) {
      return null;
    }
    const digits = value.replace(/\D/g, '');
    if (!digits) {
      return null;
    }
    if (digits.length !== 11) {
      throw new Error('CPF deve conter 11 digitos.');
    }
    return digits;
  }
}
