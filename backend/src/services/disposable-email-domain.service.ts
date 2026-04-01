import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { promises as fs } from 'fs';
import path from 'path';
import { getEnvFlag, getEnvNumber } from '../config/env';

@Injectable()
export class DisposableEmailDomainService implements OnModuleInit {
  private readonly logger = new Logger(DisposableEmailDomainService.name);
  private readonly resourceName = 'disposable_email_domains.txt';
  private domainSet: Set<string> = new Set();

  async onModuleInit() {
    await this.refreshDomainSet();
  }

  @Interval(() => getEnvNumber(process.env.APP_EMAIL_DISPOSABLE_REFRESH_MS, 86400000))
  async scheduledRefresh() {
    if (!getEnvFlag(process.env.APP_EMAIL_DISPOSABLE_UPDATE_ENABLED, true)) {
      return;
    }
    await this.refreshDomainSet();
  }

  isDisposableDomain(domain: string): boolean {
    if (!domain || !domain.trim()) {
      return true;
    }
    const normalized = domain.trim().toLowerCase();
    if (this.domainSet.has(normalized)) {
      return true;
    }

    let idx = normalized.indexOf('.');
    while (idx > 0 && idx < normalized.length - 1) {
      const suffix = normalized.substring(idx + 1);
      if (this.domainSet.has(suffix)) {
        return true;
      }
      idx = normalized.indexOf('.', idx + 1);
    }
    return false;
  }

  private async refreshDomainSet(): Promise<void> {
    const merged = new Set<string>(await this.loadFromResource());
    const localCount = merged.size;

    if (getEnvFlag(process.env.APP_EMAIL_DISPOSABLE_UPDATE_ENABLED, true)) {
      const sources = this.splitSources(
        process.env.APP_EMAIL_DISPOSABLE_SOURCES ||
          'https://raw.githubusercontent.com/disposable/disposable-email-domains/master/domains.txt,https://raw.githubusercontent.com/7c/fakefilter/main/txt/data.txt',
      );
      for (const source of sources) {
        const list = await this.loadFromRemoteSource(source);
        list.forEach((item) => merged.add(item));
      }
    }

    if (merged.size === 0) {
      this.logger.warn('Lista de dominios temporarios vazia. Mantendo cache anterior.');
      return;
    }

    this.domainSet = new Set(merged);
    this.logger.log(`Dominios temporarios carregados: total=${this.domainSet.size}, local=${localCount}`);
  }

  private async loadFromResource(): Promise<Set<string>> {
    const resourcePath = path.join(__dirname, '..', 'resources', this.resourceName);
    try {
      const content = await fs.readFile(resourcePath, 'utf8');
      return this.parseDomains(content.split(/\r?\n/));
    } catch (error) {
      this.logger.warn(`Recurso '${this.resourceName}' nao encontrado.`);
      return new Set();
    }
  }

  private async loadFromRemoteSource(sourceUrl: string): Promise<Set<string>> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(sourceUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'instituto-api-disposable-domain-updater/1.0' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) {
        this.logger.warn(`Falha ao baixar lista disposable de ${sourceUrl} (status ${response.status}).`);
        return new Set();
      }
      const text = await response.text();
      const parsed = this.parseDomains(text.split(/\r?\n/));
      this.logger.log(`Fonte disposable carregada: ${sourceUrl} (${parsed.size} dominios)`);
      return parsed;
    } catch (error) {
      this.logger.warn(`Falha ao atualizar lista disposable via ${sourceUrl}.`);
      return new Set();
    }
  }

  private parseDomains(lines: string[]): Set<string> {
    const domains = new Set<string>();
    for (const line of lines) {
      let value = line.trim().toLowerCase();
      if (!value || value.startsWith('#')) {
        continue;
      }
      if (value.startsWith('http://') || value.startsWith('https://')) {
        continue;
      }
      if (value.startsWith('@')) {
        value = value.substring(1);
      }
      if (/^[a-z0-9.-]+\.[a-z]{2,}$/.test(value)) {
        domains.add(value);
      }
    }
    return domains;
  }

  private splitSources(rawSources: string): string[] {
    if (!rawSources || !rawSources.trim()) {
      return [];
    }
    return rawSources
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }
}
