import { Injectable } from '@nestjs/common';
import { promises as dns } from 'dns';
import { DisposableEmailDomainService } from './disposable-email-domain.service';

@Injectable()
export class EmailValidationService {
  private readonly emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

  constructor(private readonly disposableEmailDomainService: DisposableEmailDomainService) {}

  hasValidFormat(email: string | null | undefined): boolean {
    return Boolean(email) && this.emailPattern.test(email as string);
  }

  async hasDeliverableDomain(email: string | null | undefined): Promise<boolean> {
    const domain = this.extractDomain(email);
    if (!domain) {
      return false;
    }
    return (await this.hasMxRecord(domain)) || (await this.hasARecord(domain));
  }

  isDisposableDomain(email: string | null | undefined): boolean {
    const domain = this.extractDomain(email);
    if (!domain) {
      return true;
    }
    return this.disposableEmailDomainService.isDisposableDomain(domain);
  }

  async isAllowedForSignup(email: string | null | undefined): Promise<boolean> {
    return (
      this.hasValidFormat(email) &&
      (await this.hasDeliverableDomain(email)) &&
      !this.isDisposableDomain(email)
    );
  }

  private extractDomain(email: string | null | undefined): string | null {
    if (!this.hasValidFormat(email)) {
      return null;
    }
    const atIndex = (email as string).lastIndexOf('@');
    if (atIndex < 0 || atIndex === (email as string).length - 1) {
      return null;
    }
    return (email as string).substring(atIndex + 1).trim().toLowerCase();
  }

  private async hasMxRecord(domain: string): Promise<boolean> {
    try {
      const records = await dns.resolveMx(domain);
      return records && records.length > 0;
    } catch {
      return false;
    }
  }

  private async hasARecord(domain: string): Promise<boolean> {
    try {
      const v4 = await dns.resolve4(domain);
      if (v4 && v4.length > 0) {
        return true;
      }
    } catch {
      // noop
    }
    try {
      const v6 = await dns.resolve6(domain);
      return Boolean(v6 && v6.length > 0);
    } catch {
      return false;
    }
  }
}
