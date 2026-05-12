<!-- markdownlint-disable MD013 -->

# @ankhorage/supabase-db

Supabase database adapter for Ankhorage data contracts.

`@ankhorage/supabase-db` implements Supabase-specific persistence behind the provider-neutral database interfaces from `@ankhorage/contracts/db`. Higher-level packages can use typed CRUD operations, optional realtime subscriptions, and guarded schema helpers without importing Supabase details into UI, runtime rendering, generated apps, or ZORA components.

## Install

```bash
bun add @ankhorage/supabase-db @ankhorage/contracts
```

Install `@supabase/supabase-js` as well when you want to pass a Supabase realtime client:

```bash
bun add @supabase/supabase-js
```

## Boundaries

This package owns Supabase Database behavior:

- adapter creation
- table select workflows
- insert, update, and delete workflows
- filter, order, and pagination mapping
- provider error normalization
- optional realtime change subscriptions
- guarded schema SQL generation and privileged execution hooks

This package does not own:

- ZORA components or patterns
- Studio UI
- runtime manifest interpretation
- generated routes or layouts
- CLI generation
- deployment orchestration
- auth or storage adapters

## Runtime CRUD adapter

Use the runtime adapter with client-safe Supabase credentials. The adapter speaks the canonical `DbAdapter` shape from `@ankhorage/contracts/db`.

```ts
import { createSupabaseDbAdapter } from '@ankhorage/supabase-db';

const db = createSupabaseDbAdapter({
  url: process.env.SUPABASE_URL ?? '',
  anonKey: process.env.SUPABASE_ANON_KEY ?? '',
});

const posts = await db.select({
  table: 'posts',
  columns: ['id', 'title', 'created_at'],
  filters: [{ field: 'published', operator: 'eq', value: true }],
  sort: [{ field: 'created_at', direction: 'desc' }],
  page: { limit: 20 },
});

if (posts.ok) {
  console.log(posts.data);
}
```

The runtime adapter uses Supabase PostgREST endpoints and returns normalized `DbResult` values. Expected provider failures, permission errors, missing tables, and invalid queries are returned as stable adapter errors instead of raw Supabase response objects.

## Supported CRUD operations

The adapter implements:

- `select`
- `findById`
- `insert`
- `update`
- `delete`

`update` and `delete` require at least one filter to avoid accidental whole-table mutations.

## Capabilities

The adapter exposes the canonical `DbAdapterCapabilities` contract:

```ts
const capabilities = db.capabilities;

console.log(capabilities.transactions); // false
console.log(capabilities.returning); // true
console.log(capabilities.realtime); // true only when realtime is enabled and configured
```

## Realtime

Realtime is optional. It is exposed through the canonical `DbRealtimeAdapter` contract only when enabled and configured.

```ts
import { createClient } from '@supabase/supabase-js';
import { createSupabaseDbAdapter } from '@ankhorage/supabase-db';

const supabase = createClient(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_ANON_KEY ?? '');

const db = createSupabaseDbAdapter({
  url: process.env.SUPABASE_URL ?? '',
  anonKey: process.env.SUPABASE_ANON_KEY ?? '',
  realtime: true,
  realtimeClient: supabase,
});

const subscription = db.realtime?.subscribeToCollection({ table: 'posts' }, (event) => {
  console.log(event.kind, event.record, event.previousRecord);
});

await subscription?.unsubscribe();
```

Realtime events are normalized to provider-neutral kinds:

- `insert`
- `update`
- `delete`

Supabase projects must have database change replication configured for realtime table events. If realtime is not enabled or no realtime client is provided, CRUD still works and `capabilities.realtime` is `false`.

## Admin/schema adapter

Schema operations are privileged and separate from runtime CRUD. The admin adapter implements the canonical `DbAdminAdapter` contract from `@ankhorage/contracts/db`.

By default, the admin adapter generates SQL only:

```ts
import { createSupabaseDbAdminAdapter } from '@ankhorage/supabase-db';

const admin = createSupabaseDbAdminAdapter({
  url: process.env.SUPABASE_URL ?? '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
});

const plan = admin.generateCreateCollectionSql({
  name: 'posts',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'body', type: 'text' },
    { name: 'created_at', type: 'datetime' },
  ],
});

if (plan.ok) {
  console.log(plan.sql);
}
```

Direct execution requires all of the following:

- `execute: true`
- a `serviceRoleKey`
- an injected `executeSql(sql)` callback from a privileged environment

```ts
const admin = createSupabaseDbAdminAdapter({
  url: process.env.SUPABASE_URL ?? '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  execute: true,
  executeSql: async (sql) => {
    // Run SQL through a trusted backend, migration runner, or RPC you control.
    return { ok: true };
  },
});
```

> Do not use service-role credentials in client/runtime code.

The admin adapter is intended for trusted Studio backends, CLI tooling, deployment tooling, or migration workflows. It must not be bundled into generated client screens.

## Data binding architecture

A future app flow should look like this:

```txt
Studio creates a collection definition
  -> privileged adapter generates or applies schema
Runtime queries rows through DbAdapter
  -> runtime maps row fields to component props
ZORA renders presentational patterns only
```

For example, a future ZORA `PostCard` should receive props. It should not import Supabase or this package.

## Development

```bash
bun install
bun run build
bun run lint:fix
bun run test
```

Tests are mocked and must not call real Supabase services.
