import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthSessionService } from '../services/auth-session.service';

interface RouteRule {
  method?: string;
  pattern: string;
}

@Injectable()
export class ApiSessionAuthMiddleware implements NestMiddleware {
  private readonly publicRoutes: RouteRule[] = [
    { pattern: '/api/email-verification/**' },
    { method: 'POST', pattern: '/api/auth-sessions/login' },
    { method: 'POST', pattern: '/api/users' },
    { method: 'POST', pattern: '/api/contact-messages' },
    { method: 'POST', pattern: '/api/newsletter-subscribers' },
    { method: 'POST', pattern: '/api/donations' },
    { method: 'GET', pattern: '/api/market-quotes' },
    { method: 'GET', pattern: '/api/market-quotes/{id}' },
    { method: 'GET', pattern: '/api/market-assets' },
    { method: 'GET', pattern: '/api/market-assets/{id}' },
    { method: 'GET', pattern: '/api/news-articles' },
    { method: 'GET', pattern: '/api/news-articles/{id}' },
    { method: 'GET', pattern: '/api/videos' },
    { method: 'GET', pattern: '/api/videos/{id}' },
    { method: 'GET', pattern: '/api/services' },
    { method: 'GET', pattern: '/api/services/{id}' },
    { method: 'GET', pattern: '/api/products' },
    { method: 'GET', pattern: '/api/products/{id}' },
    { method: 'GET', pattern: '/api/membership-plans' },
    { method: 'GET', pattern: '/api/membership-plans/{id}' },
  ];

  private readonly adminRoutes: RouteRule[] = [
    { pattern: '/api/user-addresses/**' },
    { pattern: '/api/user-subscriptions/**' },
    { pattern: '/api/market-watchlist/**' },
    { pattern: '/api/market-assets/**' },
    { pattern: '/api/market-quotes/**' },
    { pattern: '/api/news-articles/**' },
    { pattern: '/api/videos/**' },
    { pattern: '/api/services/**' },
    { pattern: '/api/products/**' },
    { method: 'POST', pattern: '/api/membership-plans' },
    { method: 'PUT', pattern: '/api/membership-plans/{id}' },
    { method: 'DELETE', pattern: '/api/membership-plans/{id}' },
    { method: 'GET', pattern: '/api/donations' },
    { method: 'GET', pattern: '/api/donations/{id}' },
    { method: 'PUT', pattern: '/api/donations/{id}' },
    { method: 'DELETE', pattern: '/api/donations/{id}' },
    { method: 'GET', pattern: '/api/newsletter-subscribers' },
    { method: 'GET', pattern: '/api/newsletter-subscribers/{id}' },
    { method: 'PUT', pattern: '/api/newsletter-subscribers/{id}' },
    { method: 'DELETE', pattern: '/api/newsletter-subscribers/{id}' },
    { method: 'GET', pattern: '/api/contact-messages' },
    { method: 'GET', pattern: '/api/contact-messages/{id}' },
    { method: 'GET', pattern: '/api/consultancy-requests' },
    { method: 'GET', pattern: '/api/consultancy-requests/{id}' },
  ];

  constructor(private readonly authSessionService: AuthSessionService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const path = req.path || req.url;
    if (!path.startsWith('/api/')) {
      return next();
    }
    if (req.method.toUpperCase() === 'OPTIONS') {
      return next();
    }

    if (this.matchesRule(this.publicRoutes, req.method, path)) {
      return next();
    }

    const sessionIdRaw = this.resolveSessionId(req);
    const userIdRaw = this.resolveUserId(req);

    if (!sessionIdRaw || !userIdRaw) {
      return this.unauthorized(res, 'Sessao obrigatoria.');
    }

    try {
      const sessionId = sessionIdRaw.trim();
      const userId = userIdRaw.trim();
      if (this.matchesRule(this.adminRoutes, req.method, path)) {
        await this.authSessionService.assertAdminSession(sessionId, userId);
      } else {
        await this.authSessionService.assertActiveSession(sessionId, userId);
      }
      (req as any).AUTH_USER_ID = userId;
      return next();
    } catch {
      return this.unauthorized(res, 'Sessao expirada ou invalida.');
    }
  }

  private matchesRule(rules: RouteRule[], method: string, path: string): boolean {
    for (const rule of rules) {
      if (rule.method && rule.method.toUpperCase() !== method.toUpperCase()) {
        continue;
      }
      if (this.matchesPattern(rule.pattern, path)) {
        return true;
      }
    }
    return false;
  }

  private matchesPattern(pattern: string, path: string): boolean {
    if (pattern.endsWith('/**')) {
      const base = pattern.slice(0, -3);
      return path === base || path.startsWith(`${base}/`);
    }
    if (!pattern.includes('{')) {
      return path === pattern;
    }
    const regex = new RegExp(
      `^${pattern.replace(/\{[^/]+\}/g, '[^/]+')}$`,
      'i',
    );
    return regex.test(path);
  }

  private resolveSessionId(req: Request): string | undefined {
    const headerValue = req.header('X-Session-Id');
    if (headerValue && headerValue.trim()) {
      return headerValue;
    }
    return req.cookies?.['SESSION_ID'];
  }

  private resolveUserId(req: Request): string | undefined {
    const headerValue = req.header('X-User-Id');
    if (headerValue && headerValue.trim()) {
      return headerValue;
    }
    return req.cookies?.['USER_ID'];
  }

  private unauthorized(res: Response, message: string) {
    return res.status(401).json({
      status: 401,
      error: 'Unauthorized',
      message,
    });
  }
}
