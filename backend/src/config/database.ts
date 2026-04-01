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
  const url = normalizeDbUrl(process.env.DB_URL || 'postgresql://localhost:5432/instituto_site');

  return {
    type: 'postgres',
    url,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    schema: process.env.DB_SCHEMA || 'app',
    synchronize: false,
    logging: false,
  };
}
