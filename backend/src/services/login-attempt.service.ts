import { Injectable } from '@nestjs/common';
import { getEnvNumber } from '../config/env';

interface AttemptWindow {
  windowStart: number;
  count: number;
  blockedUntil: number;
}

@Injectable()
export class LoginAttemptService {
  private readonly attempts = new Map<string, AttemptWindow>();

  private get maxAttempts(): number {
    return getEnvNumber(process.env.APP_AUTH_LOGIN_MAX_ATTEMPTS, 10);
  }

  private get windowSeconds(): number {
    return getEnvNumber(process.env.APP_AUTH_LOGIN_WINDOW_SECONDS, 900);
  }

  private get blockSeconds(): number {
    return getEnvNumber(process.env.APP_AUTH_LOGIN_BLOCK_SECONDS, 900);
  }

  isBlocked(key: string): boolean {
    const window = this.attempts.get(key);
    if (!window) {
      return false;
    }
    const now = Math.floor(Date.now() / 1000);
    if (window.blockedUntil > now) {
      return true;
    }
    if (now - window.windowStart >= this.windowSeconds) {
      this.attempts.delete(key);
    }
    return false;
  }

  registerFailure(key: string): void {
    const now = Math.floor(Date.now() / 1000);
    const existing = this.attempts.get(key);
    if (!existing || now - existing.windowStart >= this.windowSeconds) {
      this.attempts.set(key, { windowStart: now, count: 1, blockedUntil: 0 });
      return;
    }
    const next = existing.count + 1;
    const blockedUntil = next >= this.maxAttempts ? now + this.blockSeconds : existing.blockedUntil;
    this.attempts.set(key, { windowStart: existing.windowStart, count: next, blockedUntil });
  }

  registerSuccess(key: string): void {
    this.attempts.delete(key);
  }
}
