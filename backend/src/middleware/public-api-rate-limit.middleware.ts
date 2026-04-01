import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { getClientIp } from '../utils/client-ip';

interface WindowCounter {
  windowStart: number;
  count: number;
}

@Injectable()
export class PublicApiRateLimitMiddleware implements NestMiddleware {
  private readonly counters = new Map<string, WindowCounter>();
  private readonly protectedRoutes = new Set([
    'POST:/api/auth-sessions/login',
    'POST:/api/users',
    'POST:/api/email-verification/request',
    'POST:/api/email-verification/confirm-code',
    'POST:/api/contact-messages',
    'POST:/api/consultancy-requests',
    'POST:/api/newsletter-subscribers',
    'POST:/api/donations',
  ]);

  private readonly limitPerMinute = 30;
  private readonly windowSeconds = 60;

  use(req: Request, res: Response, next: NextFunction) {
    const path = req.path || req.url;
    if (!path.startsWith('/api/')) {
      return next();
    }
    if (req.method.toUpperCase() === 'OPTIONS') {
      return next();
    }

    const key = `${req.method.toUpperCase()}:${path}`;
    if (!this.protectedRoutes.has(key)) {
      return next();
    }

    const ip = getClientIp(req);
    const counterKey = `${key}:${ip}`;
    const now = Math.floor(Date.now() / 1000);

    const counter = this.counters.get(counterKey);
    if (!counter || now - counter.windowStart >= this.windowSeconds) {
      this.counters.set(counterKey, { windowStart: now, count: 1 });
      return next();
    }

    counter.count += 1;
    if (counter.count > this.limitPerMinute) {
      res.status(429).json({
        status: 429,
        error: 'Too Many Requests',
        message: 'Limite de requisicoes atingido. Tente novamente em instantes.',
      });
      return;
    }

    next();
  }
}
