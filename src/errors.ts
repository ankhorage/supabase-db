import type { DbAdapterError } from '@ankhorage/contracts/db';

export function createDbError(
  code: string,
  message: string,
  cause?: unknown,
): DbAdapterError {
  return cause === undefined ? { code, message } : { code, message, cause };
}

export function mapNetworkError(error: unknown): DbAdapterError {
  return createDbError('network_error', 'Supabase Database request failed.', error);
}

export function mapProviderError(error: unknown): DbAdapterError {
  if (isProviderError(error)) {
    return createDbError(
      mapProviderCode(error.code, error.message),
      error.message,
      error,
    );
  }

  return createDbError('provider_error', 'Supabase Database returned an error.', error);
}

export function mapHttpError(status: number, body: unknown): DbAdapterError {
  const providerMessage = readProviderMessage(body);

  if (status === 401 || status === 403) {
    return createDbError(
      'permission_denied',
      providerMessage ?? 'Supabase Database denied the request.',
      body,
    );
  }

  if (status === 404) {
    return createDbError(
      'missing_table',
      providerMessage ?? 'Supabase Database resource was not found.',
      body,
    );
  }

  if (status >= 400 && status < 500) {
    return createDbError(
      'invalid_query',
      providerMessage ?? 'Supabase Database rejected the query.',
      body,
    );
  }

  return createDbError(
    'provider_error',
    providerMessage ?? 'Supabase Database returned an unexpected error.',
    body,
  );
}

function mapProviderCode(code: string | undefined, message: string): string {
  const normalizedMessage = message.toLowerCase();

  if (code === 'PGRST116' || normalizedMessage.includes('not found')) {
    return 'missing_table';
  }

  if (normalizedMessage.includes('permission') || normalizedMessage.includes('policy')) {
    return 'permission_denied';
  }

  if (normalizedMessage.includes('invalid') || normalizedMessage.includes('syntax')) {
    return 'invalid_query';
  }

  return 'provider_error';
}

function readProviderMessage(body: unknown): string | undefined {
  if (!isRecord(body)) {
    return undefined;
  }

  const message = body.message;
  const error = body.error;

  if (typeof message === 'string' && message.trim().length > 0) {
    return message;
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }

  return undefined;
}

function isProviderError(value: unknown): value is { code?: string; message: string } {
  return (
    isRecord(value) &&
    typeof value.message === 'string' &&
    (value.code === undefined || typeof value.code === 'string')
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
