import type {
  DbAdapter,
  DbAdminAdapter,
  DbAdminResult,
  DbRealtimeAdapter,
} from '@ankhorage/contracts/db';

interface SupabaseRealtimePostgresChangesFilter {
  readonly event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  readonly schema: string;
  readonly table: string;
  readonly filter?: string;
}

export interface SupabaseRealtimeChannel {
  on(
    type: 'postgres_changes',
    filter: SupabaseRealtimePostgresChangesFilter,
    callback: (payload: SupabaseRealtimePayload) => void,
  ): SupabaseRealtimeChannel;
  subscribe(callback?: (status: string) => void): SupabaseRealtimeChannel;
  unsubscribe(): Promise<'ok' | 'timed out' | 'error'>;
}

export interface SupabaseRealtimeClient {
  channel(topic: string): SupabaseRealtimeChannel;
  removeChannel(channel: SupabaseRealtimeChannel): Promise<'ok' | 'timed out' | 'error'>;
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

export type DbAdminSqlExecutionResult =
  | {
      readonly ok: true;
    }
  | {
      readonly ok: false;
      readonly error: DbAdminResult extends { readonly ok: false; readonly error: infer TError }
        ? TError
        : never;
    };

export type SupabaseDbAdapter = DbAdapter & Partial<DbRealtimeAdapter>;
export type SupabaseDbAdminAdapter = DbAdminAdapter;
