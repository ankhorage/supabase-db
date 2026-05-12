import type { DbRecord } from '@ankhorage/contracts/db';

import type {
  DbChangeEvent,
  DbChangeKind,
  DbChangeListener,
  DbCollectionSubscriptionInput,
  DbRecordSubscriptionInput,
  DbSubscription,
  RealtimeDbAdapter,
  SupabaseRealtimeClient,
  SupabaseRealtimePayload,
} from './types.js';
import { validateIdentifier } from './validation.js';

interface RealtimeApiConfig {
  readonly client: SupabaseRealtimeClient;
  readonly defaultSchema: string;
}

export function createRealtimeApi(config: RealtimeApiConfig): RealtimeDbAdapter['realtime'] {
  return {
    subscribeToCollection<TRecord extends object = DbRecord>(
      input: DbCollectionSubscriptionInput,
      listener: DbChangeListener<TRecord>,
    ): DbSubscription {
      const schema = input.schema ?? config.defaultSchema;
      const table = validateIdentifier(input.table, 'Realtime table');
      const channel = config.client
        .channel(`ankhorage-db:${schema}:${table}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema,
            table,
          },
          (payload) => {
            const event = normalizeRealtimeEvent<TRecord>(payload, table, schema);

            if (event !== null) {
              listener(event);
            }
          },
        )
        .subscribe();

      return {
        async unsubscribe(): Promise<void> {
          await config.client.removeChannel(channel);
        },
      };
    },

    subscribeToRecord<TRecord extends object = DbRecord>(
      input: DbRecordSubscriptionInput,
      listener: DbChangeListener<TRecord>,
    ): DbSubscription {
      const schema = input.schema ?? config.defaultSchema;
      const table = validateIdentifier(input.table, 'Realtime table');
      const idField = validateIdentifier(input.idField ?? 'id', 'Realtime record id field');
      const channel = config.client
        .channel(`ankhorage-db:${schema}:${table}:${idField}:${String(input.id)}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema,
            table,
            filter: `${idField}=eq.${String(input.id)}`,
          },
          (payload) => {
            const event = normalizeRealtimeEvent<TRecord>(payload, table, schema);

            if (event !== null) {
              listener(event);
            }
          },
        )
        .subscribe();

      return {
        async unsubscribe(): Promise<void> {
          await config.client.removeChannel(channel);
        },
      };
    },
  };
}

export function normalizeRealtimeEvent<TRecord extends object = DbRecord>(
  payload: SupabaseRealtimePayload,
  fallbackTable: string,
  fallbackSchema: string,
): DbChangeEvent<TRecord> | null {
  const kind = normalizeKind(payload.eventType);

  if (kind === null) {
    return null;
  }

  const record = normalizeRecord<TRecord>(payload.new);
  const previousRecord = normalizeRecord<TRecord>(payload.old);
  const base = {
    table: payload.table ?? fallbackTable,
    schema: payload.schema ?? fallbackSchema,
    kind,
    record: kind === 'delete' ? null : record,
    committedAt: payload.commit_timestamp,
  };

  if (previousRecord === null) {
    return base;
  }

  return {
    ...base,
    previousRecord,
  };
}

function normalizeKind(value: string | undefined): DbChangeKind | null {
  switch (value) {
    case 'INSERT':
      return 'insert';
    case 'UPDATE':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return null;
  }
}

function normalizeRecord<TRecord extends object>(value: unknown): TRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  return value as TRecord;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
