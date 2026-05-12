import type { DbFilter } from '@ankhorage/contracts/db';

export function validateUrl(url: string): string {
  const trimmed = url.trim();

  if (trimmed.length === 0) {
    throw new TypeError('Supabase URL is required.');
  }

  try {
    new URL(trimmed);
  } catch {
    throw new TypeError('Supabase URL must be a valid URL.');
  }

  return trimmed.replace(/\/+$/, '');
}

export function validateKey(value: string, label: string): string {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new TypeError(`${label} is required.`);
  }

  return trimmed;
}

export function validateIdentifier(value: string, label: string): string {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new TypeError(`${label} is required.`);
  }

  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmed)) {
    throw new TypeError(`${label} must be a valid SQL identifier.`);
  }

  return trimmed;
}

export function validateFilters(filters: readonly DbFilter[], label: string): void {
  if (filters.length === 0) {
    throw new TypeError(`${label} requires at least one filter.`);
  }

  for (const filter of filters) {
    validateIdentifier(filter.field, 'Filter field');
  }
}

export function quoteIdentifier(value: string): string {
  const identifier = validateIdentifier(value, 'SQL identifier');

  return `"${identifier.replaceAll('"', '""')}"`;
}
