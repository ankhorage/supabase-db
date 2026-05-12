import type {
  DbAdapter,
  DbDeleteInput,
  DbFindByIdInput,
  DbInsertInput,
  DbRecord,
  DbResult,
  DbSelectInput,
  DbUpdateInput,
} from '@ankhorage/contracts/db';

import { createDbError, mapHttpError, mapNetworkError } from './errors.js';
import { buildMutationUrl, buildSelectUrl } from './query.js';
import { createRealtimeApi } from './realtime.js';
import type { SupabaseDbAdapter, SupabaseDbAdapterOptions } from './types.js';
import { validateFilters, validateKey, validateUrl } from './validation.js';

interface NormalizedConfig {
  readonly url: string;
  readonly anonKey: string;
  readonly schema: string;
  readonly fetch: typeof fetch;
  readonly realtime: boolean;
  readonly realtimeClient: SupabaseDbAdapterOptions['realtimeClient'];
}

export function createSupabaseDbAdapter(options: SupabaseDbAdapterOptions): SupabaseDbAdapter {
  const config = normalizeConfig(options);
  const baseAdapter: DbAdapter = {
    capabilities: {
      supportsTransactions: false,
      supportsReturning: true,
      supportsRealtime: config.realtime && config.realtimeClient !== undefined,
    },

    async select<TRecord extends object = DbRecord>(
      input: DbSelectInput,
    ): Promise<DbResult<TRecord[]>> {
      return requestRows<TRecord>(config, buildSelectUrl(config.url, input), {
        method: 'GET',
      });
    },

    async findById<TRecord extends object = DbRecord>(
      input: DbFindByIdInput,
    ): Promise<DbResult<TRecord | null>> {
      const result = await requestRows<TRecord>(
        config,
        buildSelectUrl(config.url, {
          table: input.table,
          columns: input.columns,
          filters: [{ field: 'id', operator: 'eq', value: input.id }],
          page: { limit: 1 },
        }),
        { method: 'GET' },
      );

      if (!result.ok) {
        return result;
      }

      return { ok: true, data: result.data[0] ?? null };
    },

    async insert<TRecord extends object = DbRecord>(
      input: DbInsertInput<TRecord>,
    ): Promise<DbResult<TRecord[]>> {
      const url = buildMutationUrl(config.url, input.table, []);

      return requestRows<TRecord>(config, url, {
        method: 'POST',
        body: JSON.stringify(input.values),
      });
    },

    async update<TRecord extends object = DbRecord>(
      input: DbUpdateInput<TRecord>,
    ): Promise<DbResult<TRecord[]>> {
      validateFilters(input.filters, 'Update');
      const url = buildMutationUrl(config.url, input.table, input.filters);

      return requestRows<TRecord>(config, url, {
        method: 'PATCH',
        body: JSON.stringify(input.values),
      });
    },

    async delete<TRecord extends object = DbRecord>(
      input: DbDeleteInput,
    ): Promise<DbResult<TRecord[]>> {
      validateFilters(input.filters, 'Delete');
      const url = buildMutationUrl(config.url, input.table, input.filters);

      return requestRows<TRecord>(config, url, {
        method: 'DELETE',
      });
    },
  };

  if (!config.realtime || config.realtimeClient === undefined) {
    return baseAdapter;
  }

  return {
    ...baseAdapter,
    realtime: createRealtimeApi({
      client: config.realtimeClient,
      defaultSchema: config.schema,
    }),
  };
}

function normalizeConfig(options: SupabaseDbAdapterOptions): NormalizedConfig {
  const fetchImplementation = options.fetch ?? globalThis.fetch;

  if (typeof fetchImplementation !== 'function') {
    throw new TypeError('A fetch implementation is required to use Supabase Database.');
  }

  return {
    url: validateUrl(options.url),
    anonKey: validateKey(options.anonKey, 'Supabase anon key'),
    schema: options.schema ?? 'public',
    fetch: fetchImplementation,
    realtime: options.realtime ?? false,
    realtimeClient: options.realtimeClient,
  };
}

async function requestRows<TRecord extends object>(
  config: NormalizedConfig,
  url: URL,
  init: RequestInit,
): Promise<DbResult<TRecord[]>> {
  try {
    const response = await config.fetch(url, {
      ...init,
      headers: createHeaders(config, init.headers),
    });
    const body = await readJsonBody(response);

    if (!response.ok) {
      return { ok: false, error: mapHttpError(response.status, body) };
    }

    const records = normalizeRecords<TRecord>(body);

    if (records === null) {
      return {
        ok: false,
        error: createDbError(
          'provider_error',
          'Supabase Database returned an invalid records response.',
          body,
        ),
      };
    }

    return { ok: true, data: records };
  } catch (error) {
    if (error instanceof TypeError) {
      return { ok: false, error: createDbError('validation_error', error.message, error) };
    }

    return { ok: false, error: mapNetworkError(error) };
  }
}

function createHeaders(
  config: NormalizedConfig,
  existingHeaders: HeadersInit | undefined,
): Headers {
  const headers = new Headers(existingHeaders);

  headers.set('apikey', config.anonKey);
  headers.set('Authorization', `Bearer ${config.anonKey}`);
  headers.set('Accept', 'application/json');
  headers.set('Content-Type', 'application/json');
  headers.set('Prefer', 'return=representation');

  if (config.schema !== 'public') {
    headers.set('Accept-Profile', config.schema);
    headers.set('Content-Profile', config.schema);
  }

  return headers;
}

async function readJsonBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (text.trim().length === 0) {
    return [];
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function normalizeRecords<TRecord extends object>(value: unknown): TRecord[] | null {
  if (Array.isArray(value)) {
    return value.filter(isRecord).map((record) => record as TRecord);
  }

  if (isRecord(value)) {
    return [value as TRecord];
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
