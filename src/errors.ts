import type { DbAdapterError } from '@ankhorage/contracts/db';

export function createDbError(code: string, message: string, cause?: unknown): DbAdapterError {
  return cause === undefined ? { code, message } : { code, message, cause };
}

export function mapNetworkError(error: unknown): DbAdapterError {
  return createDbError('network_error', 'Supabase Database request failed.', error);
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

function readProviderMessage(body: unknown): string | undefined {
  if (!isRecord(body)) {
    return undefined;
  }

  const { message } = body;
  const { error } = body;

  if (typeof message === 'string' && message.trim().length > 0) {
    return message;
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
