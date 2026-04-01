export function getAllowedOrigins(): string[] {
  const raw = process.env.APP_ALLOWED_ORIGINS || 'http://localhost:4321,http://127.0.0.1:4321';
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .map((value) => (value.endsWith('/') ? value.slice(0, -1) : value));
}

export function getEnvFlag(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

export function getEnvNumber(value: string | undefined, defaultValue: number): number {
  if (!value) {
    return defaultValue;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}
