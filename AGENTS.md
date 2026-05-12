# Agent Guide

This repository is a strict TypeScript Bun package for a standalone Supabase Database adapter.

The package must remain usable outside generated apps and framework-specific projects. It should provide clean Supabase Database behavior while staying independent from UI, routing, CLI, runtime, orchestrator, and generated app logic.

All coding agents must follow the rules below.

## Non-negotiables

- Do not introduce `any`, `as any`, `unknown as any`, or broad casts to silence errors.
- Do not add `@ts-ignore` / `@ts-expect-error` unless explicitly requested.
- Do not add `eslint-disable` or weaken lint rules/config to “make it pass”.
- Do not weaken tsconfig strictness or change module resolution settings.
- Do not perform large refactors unless explicitly requested.
- Do not add UI, routing, generated app, CLI, runtime, or orchestrator dependencies.
- Do not hardcode browser-only APIs such as `localStorage` without an injectable abstraction.
- Do not require React, React Native, Expo, or browser DOM APIs for core database behavior.
- Do not perform real network calls in tests.
- Do not require realtime support in the base CRUD adapter interface.
- Do not put service-role credentials into client/runtime examples or client-safe adapter configuration.
- If you cannot proceed without violating rules: STOP and propose 2–3 options with tradeoffs.

## Required verification

Before concluding any task, run from repo root:

- `bun run build`
- `bun run lint:fix`
- `bun run test`

For release or packaging-related work, also run:

- `npm pack --dry-run`

If any command fails: STOP and report the failure + the minimal fix.

## Package responsibility

This package owns Supabase Database behavior:

- database adapter creation
- table/collection select workflows
- insert/update/delete workflows
- filter/order/pagination mapping
- result normalization
- Supabase Database error mapping
- optional Supabase realtime subscriptions
- realtime event normalization
- provider-specific config validation
- privileged schema/admin helpers when explicitly implemented

This package does not own:

- UI
- forms
- data binding editors
- generated data collections
- routing
- generated routes
- generated layouts
- app manifest interpretation
- CLI file generation
- runtime orchestration
- deployment orchestration
- ZORA patterns or components

## Dependency boundaries

Allowed dependency direction:

- The package may depend on Supabase-specific client utilities when they are isolated behind the adapter boundary.
- The package may depend on `@ankhorage/contracts` for provider-neutral database contracts.
- The package may expose optional compatibility helpers through explicit subpaths if needed.
- The core package API must remain usable in standalone TypeScript projects.
- Realtime must be exposed as an optional capability, not a mandatory CRUD requirement.
- Admin/schema behavior must remain separate from client-safe runtime CRUD behavior.

Forbidden dependencies:

- `@ankhorage/cli`
- `@ankhorage/runtime`
- `@ankhorage/surface`
- `@ankhorage/zora`
- `@ankhorage/orchestrator`
- app manifests
- generated app code
- Expo Router
- React
- React Native

If a feature appears to require one of these dependencies, STOP and propose a boundary-safe alternative.

## Public API expectations

The package should expose a small public API centered around:

```ts
import { createSupabaseDbAdapter } from '@ankhorage/supabase-db';

const dbAdapter = createSupabaseDbAdapter({
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
  realtime: true,
});
```

The returned runtime adapter should provide stable database operations from `@ankhorage/contracts/db`, such as:

- `select`
- `findById`
- `insert`
- `update`
- `delete`
- optional realtime helpers only when enabled and supported

Public APIs should use consistent terminology:

- `table`
- `columns`
- `filters`
- `sort`
- `page`
- `values`
- `record`
- `previousRecord`
- `capabilities`
- `realtime`

Do not introduce auth, storage, routing, UI, or app-manifest terminology into the core database API.

## Runtime vs admin safety

Runtime CRUD adapter:

- may use anon/client-safe keys
- must respect Supabase RLS behavior
- must not require service-role credentials
- should be safe for app/runtime environments

Admin/schema adapter:

- is privileged and must be separate from runtime CRUD
- may generate SQL/migration plans
- must require explicit opt-in before executing schema changes
- must document that service-role credentials must never be bundled into client apps
- must not be imported by ZORA, runtime rendering code, or generated client screens

## Realtime rules

- Treat Supabase realtime as an optional capability.
- Do not require realtime on the base database adapter interface.
- Do not pretend polling is realtime.
- Normalize Supabase `INSERT`, `UPDATE`, and `DELETE` events into provider-neutral events.
- Keep subscription cleanup deterministic.
- Do not leak raw Supabase channel objects as the primary public subscription API.
- Document that Supabase projects must enable database change replication for realtime to work.

## Implementation rules

- Prefer small, focused modules.
- Keep Supabase request/response normalization isolated.
- Keep Supabase error normalization isolated.
- Keep query/filter/order/pagination mapping isolated.
- Keep realtime payload normalization isolated.
- Return stable adapter results rather than exposing raw Supabase response shapes as the primary API.
- Do not throw for expected provider/database failures. Return normalized error results.
- Attach raw provider details only where the public result shape safely allows it, such as `cause`.
- Keep client behavior injectable for tests and non-standard runtimes.
- Keep table/field validation explicit and deterministic.
- Do not introduce large dependencies unless explicitly approved.

## Testing rules

- Use mocked client behavior.
- Do not call real Supabase services in tests.
- Test provider response normalization.
- Test error normalization.
- Test missing config validation.
- Test missing table/filter/value cases.
- Test select, findById, insert, update, and delete workflows.
- Test realtime payload normalization for insert/update/delete.
- Test subscription cleanup.
- Test admin/schema execution guards.
- Tests must be deterministic and runnable offline.

## Repo boundaries

- Build outputs must go to `dist/`.
- Never write build artifacts into `src/`.
- Keep source files under `src/`.
- Keep tests close to the code they verify unless the repository already has another convention.
- Keep README examples standalone and provider-focused.
- Do not describe this package as generated-app, CLI, runtime, or UI-specific.

## Mandatory workflow

1. Plan first: list the exact files you will touch and why.
2. Keep changes micro-scoped: small PR-sized steps, one concern at a time.
3. Do not edit files during planning.
4. Apply changes only after the plan has been approved.
5. After edits: show `git diff --stat` and briefly explain changes.
6. Rollback rule: if a step goes sideways, revert to the last checkpoint instead of trial-and-error edits.
7. If a completed task changes the published package, create or update a `.changeset/*.md` file before committing that work.
8. Repo-doc/tooling-only changes do not need a changeset unless they affect package release behavior.
9. After verification, commit the completed unit of work unless the user explicitly says not to.

## Current initiative

We are creating `@ankhorage/supabase-db` as a standalone MIT package.

The package should provide a clean Supabase Database adapter for use in any TypeScript app.

High-level goals:

- standalone package
- strict TypeScript
- stable adapter results
- no UI, routing, or rendering assumptions
- optional realtime capability
- separate privileged admin/schema boundary
- mocked tests only
- npm trusted-publishing-ready metadata
- small public API
- clean README and examples

## Tool-specific notes

### Codex

- Do not edit files during planning.
- Output a plan first.
- Wait for approval before applying changes.
- Add or update the relevant `.changeset/*.md` file before committing package changes.
- Commit completed, verified work unless the user explicitly asks you not to.

### Gemini CLI / gemini-kit

- Always run a plan step before execution.
- Execute work in micro-plans.
- Checkpoint with git before risky execution steps.
- Add or update the relevant `.changeset/*.md` file before committing package changes.
- Commit completed, verified work unless the user explicitly asks you not to.
