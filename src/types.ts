import type { DbAdapter, DbRecord } from '@ankhorage/contracts/db';

export type SupabaseRealtimePostgresEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export type SupabaseRealtimeStatus =
  | 'SUBSCRIBED'
  | 'TIMED_OUT'
  | 'CLOSED'
  | 'CHANNEL_ERROR'
  | string;

export interface SupabaseRealtimeChannel {
  on(
    type: 'postgres_changes',
    filter: SupabaseRealtimePostgresChangesFilter,
    callback: (payload: SupabaseRealtimePayload) => void,
  ): SupabaseRealtimeChannel;
  subscribe(callback?: (status: SupabaseRealtimeStatus) => void): SupabaseRealtimeChannel;
  unsubscribe(): Promise<'ok' | 'timed out' | 'error'>;
}

export interface SupabaseRealtimeClient {
  channel(topic: string): SupabaseRealtimeChannel;
  removeChannel(channel: SupabaseRealtimeChannel): Promise<'ok' | 'timed out' | 'error'>;
}

export interface SupabaseRealtimePostgresChangesFilter {
  event: SupabaseRealtimePostgresEvent;
  schema: string;
  table: string;
  filter?: string;
}

export interface SupabaseRealtimePayload {
  eventType?: string;
  schema?: string;
  table?: string;
  commit_timestamp?: string;
  new?: unknown;
  old?: unknown;
  errors?: string[] | null;
}

export interface SupabaseDbAdapterOptions {
  readonly url: string;
  readonly anonKey: string;
  readonly schema?: string;
  readonly fetch?: typeof fetch;
  readonly realtime?: boolean;
  readonly realtimeClient?: SupabaseRealtimeClient;
}

export interface SupabaseDbAdminAdapterOptions {
  readonly url: string;
  readonly serviceRoleKey?: string;
  readonly schema?: string;
  readonly execute?: boolean;
  readonly executeSql?: (sql: string) => Promise<DbAdminSqlExecutionResult>;
}

export interface DbAdminSqlExecutionResult {
  readonly ok: boolean;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly cause?: unknown;
  };
}

export type SupabaseDbAdapter = DbAdapter & Partial<RealtimeDbAdapter>;

export interface RealtimeDbAdapter {
  readonly realtime: {
    subscribeToCollection<TRecord extends object = DbRecord>(
      input: DbCollectionSubscriptionInput,
      listener: DbChangeListener<TRecord>,
    ): DbSubscription;
    subscribeToRecord<TRecord extends object = DbRecord>(
      input: DbRecordSubscriptionInput,
      listener: DbChangeListener<TRecord>,
    ): DbSubscription;
  };
}

export interface DbCollectionSubscriptionInput {
  readonly table: string;
  readonly schema?: string;
}

export interface DbRecordSubscriptionInput extends DbCollectionSubscriptionInput {
  readonly id: string | number;
  readonly idField?: string;
}

export type DbChangeKind = 'insert' | 'update' | 'delete';

export interface DbChangeEvent<TRecord extends object = DbRecord> {
  readonly table: string;
  readonly schema: string;
  readonly kind: DbChangeKind;
  readonly record: TRecord | null;
  readonly previousRecord?: TRecord;
  readonly committedAt?: string;
}

export type DbChangeListener<TRecord extends object = DbRecord> = (
  event: DbChangeEvent<TRecord>,
) => void;

export interface DbSubscription {
  unsubscribe(): Promise<void>;
}

export interface SupabaseCollectionDefinition {
  readonly name: string;
  readonly fields: readonly SupabaseFieldDefinition[];
  readonly primaryKey?: string;
}

export type SupabaseFieldType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'datetime'
  | 'json'
  | 'uuid';

export interface SupabaseFieldDefinition {
  readonly name: string;
  readonly type: SupabaseFieldType;
  readonly required?: boolean;
  readonly unique?: boolean;
  readonly defaultValue?: string | number | boolean | null;
}

export interface SupabaseDbAdminAdapter {
  readonly capabilities: {
    readonly supportsSchemaGeneration: true;
    readonly supportsDirectExecution: boolean;
  };
  createCollection(input: SupabaseCollectionDefinition): Promise<DbAdminResult>;
  deleteCollection(input: { readonly name: string }): Promise<DbAdminResult>;
  generateCreateCollectionSql(input: SupabaseCollectionDefinition): DbAdminResult;
  generateDeleteCollectionSql(input: { readonly name: string }): DbAdminResult;
}

export type DbAdminResult =
  | {
      readonly ok: true;
      readonly sql: string;
      readonly executed: boolean;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: string;
        readonly message: string;
        readonly cause?: unknown;
      };
    };
