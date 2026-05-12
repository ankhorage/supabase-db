import { describe, expect, test } from 'bun:test';

import { createSupabaseDbAdapter } from './adapter.js';
import { normalizeRealtimeEvent } from './realtime.js';
import type {
  SupabaseRealtimeChannel,
  SupabaseRealtimeClient,
  SupabaseRealtimePayload,
} from './types.js';

interface PostRecord {
  readonly id: string;
  readonly title: string;
}

describe('normalizeRealtimeEvent', () => {
  test('normalizes insert payloads', () => {
    const event = normalizeRealtimeEvent<PostRecord>(
      {
        eventType: 'INSERT',
        schema: 'public',
        table: 'posts',
        commit_timestamp: '2026-05-12T10:00:00Z',
        new: { id: 'post-1', title: 'Hello' },
      },
      'fallback',
      'public',
    );

    expect(event).toEqual({
      table: 'posts',
      schema: 'public',
      kind: 'insert',
      record: { id: 'post-1', title: 'Hello' },
      committedAt: '2026-05-12T10:00:00Z',
    });
  });

  test('normalizes update payloads with previous record', () => {
    const event = normalizeRealtimeEvent<PostRecord>(
      {
        eventType: 'UPDATE',
        new: { id: 'post-1', title: 'Updated' },
        old: { id: 'post-1', title: 'Old' },
      },
      'posts',
      'public',
    );

    expect(event).toEqual({
      table: 'posts',
      schema: 'public',
      kind: 'update',
      record: { id: 'post-1', title: 'Updated' },
      previousRecord: { id: 'post-1', title: 'Old' },
      committedAt: undefined,
    });
  });

  test('normalizes delete payloads to a null current record', () => {
    const event = normalizeRealtimeEvent<PostRecord>(
      {
        eventType: 'DELETE',
        old: { id: 'post-1', title: 'Deleted' },
      },
      'posts',
      'public',
    );

    expect(event).toEqual({
      table: 'posts',
      schema: 'public',
      kind: 'delete',
      record: null,
      previousRecord: { id: 'post-1', title: 'Deleted' },
      committedAt: undefined,
    });
  });

  test('ignores unknown realtime events', () => {
    const event = normalizeRealtimeEvent<PostRecord>({ eventType: 'TRUNCATE' }, 'posts', 'public');

    expect(event).toBeNull();
  });
});

describe('realtime adapter capability', () => {
  test('subscribes and cleans up collection channels', async () => {
    const client = createFakeRealtimeClient();
    const adapter = createSupabaseDbAdapter({
      url: 'https://example.supabase.co',
      anonKey: 'anon',
      realtime: true,
      realtimeClient: client,
      fetch: () => Promise.resolve(new Response('[]')),
    });

    const received: unknown[] = [];
    const subscription = adapter.realtime?.subscribeToCollection<PostRecord>(
      { table: 'posts' },
      (event) => {
        received.push(event);
      },
    );

    client.emit({
      eventType: 'INSERT',
      table: 'posts',
      schema: 'public',
      new: { id: '1', title: 'A' },
    });
    await subscription?.unsubscribe();

    expect(received).toHaveLength(1);
    expect(client.removedChannels).toBe(1);
  });

  test('subscribes to a specific record using a Supabase filter', () => {
    const client = createFakeRealtimeClient();
    const adapter = createSupabaseDbAdapter({
      url: 'https://example.supabase.co',
      anonKey: 'anon',
      realtime: true,
      realtimeClient: client,
      fetch: () => Promise.resolve(new Response('[]')),
    });

    adapter.realtime?.subscribeToRecord<PostRecord>(
      { table: 'posts', id: 'post-1' },
      () => undefined,
    );

    expect(client.lastFilter?.filter).toBe('id=eq.post-1');
  });
});

function createFakeRealtimeClient(): SupabaseRealtimeClient & {
  emit(payload: SupabaseRealtimePayload): void;
  readonly removedChannels: number;
  readonly lastFilter: { readonly filter?: string } | undefined;
} {
  let callback: ((payload: SupabaseRealtimePayload) => void) | undefined;
  let removedChannels = 0;
  let lastFilter: { readonly filter?: string } | undefined;

  const channel: SupabaseRealtimeChannel = {
    on(_type, filter, nextCallback) {
      lastFilter = { filter: filter.filter };
      callback = nextCallback;
      return channel;
    },
    subscribe() {
      return channel;
    },
    unsubscribe() {
      return Promise.resolve<'ok'>('ok');
    },
  };

  return {
    channel() {
      return channel;
    },
    removeChannel() {
      removedChannels += 1;
      return Promise.resolve<'ok'>('ok');
    },
    emit(payload: SupabaseRealtimePayload) {
      callback?.(payload);
    },
    get removedChannels() {
      return removedChannels;
    },
    get lastFilter() {
      return lastFilter;
    },
  };
}
