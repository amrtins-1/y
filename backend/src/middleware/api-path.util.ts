import { Request } from 'express';

function normalizePath(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const withoutQuery = String(value).split('?')[0].split('#')[0].trim();
  if (!withoutQuery) {
    return null;
  }

  const withLeadingSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  return withLeadingSlash.length > 1 && withLeadingSlash.endsWith('/')
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash;
}

export function resolveApiPath(req: Request): string {
  const candidates = [
    req.originalUrl,
    req.url,
    req.path,
    req.baseUrl,
  ]
    .map((value) => normalizePath(value))
    .filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    if (candidate === '/api' || candidate.startsWith('/api/')) {
      return candidate;
    }
  }

  const best = candidates.find((candidate) => candidate !== '/') || '/';
  if (best === '/') {
    return '/';
  }

  return `/api${best}`;
}
