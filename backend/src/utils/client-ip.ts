import { Request } from 'express';
import { getEnvFlag } from '../config/env';

export function getClientIp(req: Request): string {
  const trustProxy = getEnvFlag(process.env.APP_TRUST_PROXY_HEADERS, false);
  if (trustProxy) {
    const forwarded = req.header('X-Forwarded-For');
    if (forwarded) {
      const first = forwarded.split(',')[0]?.trim();
      if (first) {
        return first;
      }
    }
    const realIp = req.header('X-Real-IP');
    if (realIp) {
      return realIp.trim();
    }
  }
  return req.ip || req.connection?.remoteAddress || 'unknown';
}
