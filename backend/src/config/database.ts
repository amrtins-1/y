import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

function normalizeDbUrl(raw: string | undefined): string | undefined {
  if (!raw) {
    return undefined;
  }
  if (raw.startsWith('jdbc:')) {
    return raw.replace('jdbc:', '');
  }
  return raw;
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

  return {
    type: 'postgres',
    url,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    schema: process.env.DB_SCHEMA || 'app',
    ssl: disableSsl ? false : { rejectUnauthorized: false },
    extra: disableSsl ? undefined : { ssl: { rejectUnauthorized: false } },
    synchronize: false,
    logging: false,
  };
}
