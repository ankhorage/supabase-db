import { describe, expect, test } from 'bun:test';

import { createSupabaseDbAdminAdapter } from './admin.js';

describe('createSupabaseDbAdminAdapter', () => {
  test('generates create collection SQL without executing by default', async () => {
    const adapter = createSupabaseDbAdminAdapter({
      url: 'https://example.supabase.co',
      serviceRoleKey: 'service-role',
    });

    const result = await adapter.createCollection({
      name: 'posts',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'like_count', type: 'number', defaultValue: 0 },
        { name: 'published', type: 'boolean', defaultValue: false },
      ],
    });

    expect(result.ok).toBe(true);
    expect(result.ok ? result.executed : true).toBe(false);
    expect(result.ok ? result.sql : '').toContain('create table if not exists "public"."posts"');
    expect(result.ok ? result.sql : '').toContain(
      '"id" uuid primary key default gen_random_uuid()',
    );
    expect(result.ok ? result.sql : '').toContain('"title" text not null');
    expect(result.ok ? result.sql : '').toContain('"like_count" double precision default 0');
    expect(result.ok ? result.sql : '').toContain('"published" boolean default false');
  });

  test('executes generated SQL only when explicitly configured', async () => {
    const executedSql: string[] = [];
    const adapter = createSupabaseDbAdminAdapter({
      url: 'https://example.supabase.co',
      serviceRoleKey: 'service-role',
      execute: true,
      executeSql: async (sql) => {
        executedSql.push(sql);
        return { ok: true };
      },
    });

    const result = await adapter.createCollection({
      name: 'posts',
      fields: [{ name: 'title', type: 'text' }],
    });

    expect(result).toEqual({
      ok: true,
      sql: executedSql[0],
      executed: true,
    });
    expect(executedSql).toHaveLength(1);
  });

  test('refuses execution without a service role key', async () => {
    const adapter = createSupabaseDbAdminAdapter({
      url: 'https://example.supabase.co',
      execute: true,
      executeSql: async () => ({ ok: true }),
    });

    const result = await adapter.createCollection({
      name: 'posts',
      fields: [{ name: 'title', type: 'text' }],
    });

    expect(result.ok).toBe(false);
    expect(result.ok === false ? result.error.code : '').toBe('missing_service_role_key');
  });

  test('generates delete collection SQL', () => {
    const adapter = createSupabaseDbAdminAdapter({
      url: 'https://example.supabase.co',
      serviceRoleKey: 'service-role',
    });

    const result = adapter.generateDeleteCollectionSql({ name: 'posts' });

    expect(result).toEqual({
      ok: true,
      sql: 'drop table if exists "public"."posts";',
      executed: false,
    });
  });

  test('rejects invalid collection names', () => {
    const adapter = createSupabaseDbAdminAdapter({
      url: 'https://example.supabase.co',
      serviceRoleKey: 'service-role',
    });

    const result = adapter.generateCreateCollectionSql({
      name: 'invalid-name',
      fields: [{ name: 'title', type: 'text' }],
    });

    expect(result.ok).toBe(false);
    expect(result.ok === false ? result.error.code : '').toBe('validation_error');
  });
});
