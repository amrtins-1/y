import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { getAllowedOrigins } from '../config/env';

@Injectable()
export class ApiCsrfProtectionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const path = req.path || req.url;
    if (!path.startsWith('/api/')) {
      return next();
    }

    const method = req.method.toUpperCase();
    if (['GET', 'HEAD', 'TRACE'].includes(method) || method === 'OPTIONS') {
      return next();
    }

    if (this.isHeaderAuthenticated(req)) {
      return next();
    }

    if (!this.hasSessionCookies(req)) {
      return next();
    }

    let origin: string | undefined = req.header('Origin') || undefined;
    if (!origin) {
      origin = this.originFromReferer(req.header('Referer')) || undefined;
    }

    if (!origin) {
      return res.status(403).send('Origem nao permitida.');
    }

    const normalized = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    if (!getAllowedOrigins().includes(normalized)) {
      return res.status(403).send('Origem nao permitida.');
    }

    return next();
  }

  private isHeaderAuthenticated(req: Request): boolean {
    const sessionId = req.header('X-Session-Id');
    const userId = req.header('X-User-Id');
    return Boolean(sessionId && sessionId.trim()) && Boolean(userId && userId.trim());
  }

  private hasSessionCookies(req: Request): boolean {
    const cookies = req.cookies || {};
    return Boolean(cookies['SESSION_ID']) && Boolean(cookies['USER_ID']);
  }

  private originFromReferer(referer?: string): string | undefined {
    if (!referer) {
      return undefined;
    }
    try {
      const url = new URL(referer);
      if (!url.protocol || !url.hostname) {
        return undefined;
      }
      if (url.port) {
        return `${url.protocol}//${url.hostname}:${url.port}`;
      }
      return `${url.protocol}//${url.hostname}`;
    } catch {
      return undefined;
    }
  }
}
