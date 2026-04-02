import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

function normalizeDbUrl(raw: string | undefined): string | undefined {
  if (!raw) {
    return undefined;
  }

  const trimmed = raw.trim().replace(/^"(.*)"$/, '$1');
  const withoutJdbc = trimmed.startsWith('jdbc:') ? trimmed.replace('jdbc:', '') : trimmed;

  try {
    const parsed = new URL(withoutJdbc);
    parsed.searchParams.delete('sslmode');
    parsed.searchParams.delete('sslcert');
    parsed.searchParams.delete('sslkey');
    parsed.searchParams.delete('sslrootcert');
    return parsed.toString();
  } catch {
    return withoutJdbc;
  }
}

export function getDatabaseConfig(): PostgresConnectionOptions {
  const rawUrl =
    process.env.DB_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    'postgresql://localhost:5432/instituto_site';
  const url = normalizeDbUrl(rawUrl);
  const disableSsl = ['0', 'false', 'no', 'off'].includes((process.env.DB_SSL || '').toLowerCase());
  const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED
    ? !['0', 'false', 'no', 'off'].includes(process.env.DB_SSL_REJECT_UNAUTHORIZED.toLowerCase())
    : false;

  return {
    type: 'postgres',
    url,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    schema: process.env.DB_SCHEMA || 'app',
    ssl: disableSsl ? false : { rejectUnauthorized },
    extra: disableSsl ? undefined : { ssl: { rejectUnauthorized } },
    synchronize: false,
    logging: false,
  };
}
