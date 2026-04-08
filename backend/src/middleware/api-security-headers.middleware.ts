import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { getEnvFlag } from '../config/env';
import { resolveApiPath } from './api-path.util';

@Injectable()
export class ApiSecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const path = resolveApiPath(req);
    if (!path.startsWith('/api/')) {
      return next();
    }

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('Cache-Control', 'no-store');

    const hstsEnabled = getEnvFlag(process.env.APP_SECURITY_HSTS_ENABLED, false);
    const trustProxy = getEnvFlag(process.env.APP_TRUST_PROXY_HEADERS, false);

    const isHttps = req.secure || (trustProxy && (req.header('X-Forwarded-Proto') || '').toLowerCase() === 'https');
    if (hstsEnabled && isHttps) {
      res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    }

    return next();
  }
}
