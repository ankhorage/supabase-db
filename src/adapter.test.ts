import { describe, expect, test } from 'bun:test';

import { createSupabaseDbAdapter } from './adapter.js';

interface FetchCall {
  readonly url: string;
  readonly init: RequestInit | undefined;
}

interface PostRecord {
  readonly id: string;
  readonly title: string;
}

describe('createSupabaseDbAdapter', () => {
  test('maps select input to Supabase PostgREST query params', async () => {
    const calls: FetchCall[] = [];
    const adapter = createSupabaseDbAdapter({
      url: 'https://example.supabase.co',
      anonKey: 'anon',
      fetch: (input, init) => {
        calls.push({ url: fetchInputToString(input), init });
        return Promise.resolve(jsonResponse([{ id: 'post-1', title: 'Hello' }]));
      },
    });

    const result = await adapter.select<PostRecord>({
      table: 'posts',
      columns: ['id', 'title'],
      filters: [{ field: 'title', operator: 'startsWith', value: 'Hel' }],
      sort: [{ field: 'title', direction: 'desc' }],
      page: { limit: 10, offset: 5 },
    });

    expect(result).toEqual({ ok: true, data: [{ id: 'post-1', title: 'Hello' }] });
    expect(calls).toHaveLength(1);

    const url = new URL(calls[0]?.url ?? 'https://invalid.test');
    expect(url.pathname).toBe('/rest/v1/posts');
    expect(url.searchParams.get('select')).toBe('id,title');
    expect(url.searchParams.get('title')).toBe('like.Hel*');
    expect(url.searchParams.get('order')).toBe('title.desc');
    expect(url.searchParams.get('limit')).toBe('10');
    expect(url.searchParams.get('offset')).toBe('5');
    expect(readHeader(calls[0]?.init, 'apikey')).toBe('anon');
    expect(readHeader(calls[0]?.init, 'Prefer')).toBe('return=representation');
  });

  test('finds records by id', async () => {
    const adapter = createSupabaseDbAdapter({
      url: 'https://example.supabase.co',
      anonKey: 'anon',
      fetch: () => Promise.resolve(jsonResponse([{ id: 'post-1', title: 'Hello' }])),
    });

    const result = await adapter.findById<PostRecord>({ table: 'posts', id: 'post-1' });

    expect(result).toEqual({ ok: true, data: { id: 'post-1', title: 'Hello' } });
  });

  test('normalizes empty findById result to null', async () => {
    const adapter = createSupabaseDbAdapter({
      url: 'https://example.supabase.co',
      anonKey: 'anon',
      fetch: () => Promise.resolve(jsonResponse([])),
    });

    const result = await adapter.findById<PostRecord>({ table: 'posts', id: 'missing' });

    expect(result).toEqual({ ok: true, data: null });
  });

  test('maps insert values to POST with returning representation', async () => {
    const calls: FetchCall[] = [];
    const adapter = createSupabaseDbAdapter({
      url: 'https://example.supabase.co',
      anonKey: 'anon',
      fetch: (input, init) => {
        calls.push({ url: fetchInputToString(input), init });
        return Promise.resolve(jsonResponse([{ id: 'post-1', title: 'Hello' }]));
      },
    });

    const result = await adapter.insert<PostRecord>({
      table: 'posts',
      values: { id: 'post-1', title: 'Hello' },
    });

    expect(result.ok).toBe(true);
    expect(calls[0]?.init?.method).toBe('POST');
    expect(calls[0]?.init?.body).toBe(JSON.stringify({ id: 'post-1', title: 'Hello' }));
  });

  test('requires filters for update', async () => {
    const adapter = createSupabaseDbAdapter({
      url: 'https://example.supabase.co',
      anonKey: 'anon',
      fetch: () => Promise.resolve(jsonResponse([])),
    });

    const result = await adapter.update<PostRecord>({
      table: 'posts',
      values: { title: 'Updated' },
      filters: [],
    });

    expect(result.ok).toBe(false);
    expect(result.ok === false ? result.error.code : '').toBe('validation_error');
  });

  test('requires filters for delete', async () => {
    const adapter = createSupabaseDbAdapter({
      url: 'https://example.supabase.co',
      anonKey: 'anon',
      fetch: () => Promise.resolve(jsonResponse([])),
    });

    const result = await adapter.delete<PostRecord>({ table: 'posts', filters: [] });

    expect(result.ok).toBe(false);
    expect(result.ok === false ? result.error.code : '').toBe('validation_error');
  });

  test('normalizes provider errors', async () => {
    const adapter = createSupabaseDbAdapter({
      url: 'https://example.supabase.co',
      anonKey: 'anon',
      fetch: () => Promise.resolve(jsonResponse({ message: 'permission denied' }, 403)),
    });

    const result = await adapter.select<PostRecord>({ table: 'posts' });

    expect(result.ok).toBe(false);
    expect(result.ok === false ? result.error.code : '').toBe('permission_denied');
  });

  test('exposes realtime capability only when configured with a client', () => {
    const adapter = createSupabaseDbAdapter({
      url: 'https://example.supabase.co',
      anonKey: 'anon',
      realtime: false,
      fetch: () => Promise.resolve(jsonResponse([])),
    });

    expect(adapter.capabilities?.supportsRealtime).toBe(false);
    expect('realtime' in adapter).toBe(false);
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function fetchInputToString(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function readHeader(init: RequestInit | undefined, name: string): string | null {
  const headers = new Headers(init?.headers);

  return headers.get(name);
}
