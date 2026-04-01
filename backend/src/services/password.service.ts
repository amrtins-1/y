import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  private readonly rounds = 12;

  async hash(rawPassword: string): Promise<string> {
    return bcrypt.hash(rawPassword, this.rounds);
  }

  async matches(rawPassword: string, passwordHash: string): Promise<boolean> {
    if (!rawPassword || !passwordHash || !passwordHash.trim()) {
      return false;
    }
    if (!this.isBcryptHash(passwordHash)) {
      return rawPassword === passwordHash;
    }
    return bcrypt.compare(rawPassword, passwordHash);
  }

  isBcryptHash(passwordHash: string | null | undefined): boolean {
    if (!passwordHash) {
      return false;
    }
    return (
      passwordHash.startsWith('$2a$') ||
      passwordHash.startsWith('$2b$') ||
      passwordHash.startsWith('$2y$')
    );
  }
}
