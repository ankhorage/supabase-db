import type {
  DbChangeEvent,
  DbChangeKind,
  DbChangeListener,
  DbCollectionSubscriptionInput,
  DbRealtimeAdapter,
  DbRecord,
  DbRecordSubscriptionInput,
  DbSubscription,
} from '@ankhorage/contracts/db';

import type { SupabaseRealtimeClient, SupabaseRealtimePayload } from './types.js';
import { validateIdentifier } from './validation.js';

interface RealtimeApiConfig {
  readonly client: SupabaseRealtimeClient;
  readonly defaultSchema: string;
}

export function createRealtimeApi(config: RealtimeApiConfig): DbRealtimeAdapter['realtime'] {
  return {
    subscribeToCollection<TRecord extends object = DbRecord>(
      input: DbCollectionSubscriptionInput,
      listener: DbChangeListener<TRecord>,
    ): DbSubscription {
      return createCollectionSubscription(config, input, listener);
    },
    subscribeToRecord<TRecord extends object = DbRecord>(
      input: DbRecordSubscriptionInput,
      listener: DbChangeListener<TRecord>,
    ): DbSubscription {
      return createRecordSubscription(config, input, listener);
    },
  };
}

export function normalizeRealtimeEvent<TRecord extends object = DbRecord>(
  payload: SupabaseRealtimePayload,
  fallbackTable: string,
  fallbackSchema: string,
): DbChangeEvent<TRecord> | null {
  const kind = normalizeKind(payload.eventType);
  if (kind === null) return null;
  const record = normalizeRecord<TRecord>(payload.new);
  const previousRecord = normalizeRecord<TRecord>(payload.old);
  const base = {
    table: payload.table ?? fallbackTable,
    schema: payload.schema ?? fallbackSchema,
    kind,
    record: kind === 'delete' ? null : record,
    committedAt: payload.commit_timestamp,
  };
  if (previousRecord === null) return base;
  return { ...base, previousRecord };
}

function createCollectionSubscription<TRecord extends object>(
  config: RealtimeApiConfig,
  input: DbCollectionSubscriptionInput,
  listener: DbChangeListener<TRecord>,
): DbSubscription {
  const schema = input.schema ?? config.defaultSchema;
  const table = validateIdentifier(input.table, 'Realtime table');
  return createSubscription(config, `ankhorage-db:${schema}:${table}`, schema, table, listener);
}

function createRecordSubscription<TRecord extends object>(
  config: RealtimeApiConfig,
  input: DbRecordSubscriptionInput,
  listener: DbChangeListener<TRecord>,
): DbSubscription {
  const schema = input.schema ?? config.defaultSchema;
  const table = validateIdentifier(input.table, 'Realtime table');
  const idField = validateIdentifier(input.idField ?? 'id', 'Realtime record id field');
  const id = String(input.id);
  return createSubscription(
    config,
    `ankhorage-db:${schema}:${table}:${idField}:${id}`,
    schema,
    table,
    listener,
    `${idField}=eq.${id}`,
  );
}

function createSubscription<TRecord extends object>(
  config: RealtimeApiConfig,
  channelName: string,
  schema: string,
  table: string,
  listener: DbChangeListener<TRecord>,
  filter?: string,
): DbSubscription {
  const channel = config.client
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema, table, filter }, (payload) => {
      const event = normalizeRealtimeEvent<TRecord>(payload, table, schema);
      if (event !== null) listener(event);
    })
    .subscribe();
  return {
    async unsubscribe(): Promise<void> {
      await config.client.removeChannel(channel);
    },
  };
}

function isRecord<TRecord extends object>(value: unknown): value is TRecord {
  return typeof value === 'object' && value !== null;
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
  return isRecord<TRecord>(value) ? value : null;
}
