# Public API

## createSupabaseDbAdapter

Kind: `function`
Module: `src/adapter.ts`
Source: `src/adapter.ts:34:1`

### Signatures

- `(options: SupabaseDbAdapterOptions) => SupabaseDbAdapter`
  - options: `SupabaseDbAdapterOptions`
  - returns: `SupabaseDbAdapter`

## createSupabaseDbAdminAdapter

Kind: `function`
Module: `src/admin.ts`
Source: `src/admin.ts:20:1`

### Signatures

- `(options: SupabaseDbAdminAdapterOptions) => DbAdminAdapter`
  - options: `SupabaseDbAdminAdapterOptions`
  - returns: `DbAdminAdapter`

## DbAdminAdapter

Kind: `type`
Module: `node_modules/@ankhorage/contracts/dist/db.d.ts`
Source: `node_modules/@ankhorage/contracts/dist/db.d.ts:125:1`

### Members

| Name                        | Kind     | Type                                                        | Required | Description |
| --------------------------- | -------- | ----------------------------------------------------------- | -------- | ----------- |
| capabilities                | property | `DbAdminAdapterCapabilities`                                | yes      |             |
| createCollection            | method   | `(input: DbCollectionDefinition) => Promise<DbAdminResult>` | yes      |             |
| deleteCollection            | method   | `(input: DbCollectionReference) => Promise<DbAdminResult>`  | yes      |             |
| generateCreateCollectionSql | method   | `(input: DbCollectionDefinition) => DbAdminResult`          | yes      |             |
| generateDeleteCollectionSql | method   | `(input: DbCollectionReference) => DbAdminResult`           | yes      |             |

## DbAdminResult

Kind: `unknown`
Module: `node_modules/@ankhorage/contracts/dist/db.d.ts`
Source: `node_modules/@ankhorage/contracts/dist/db.d.ts:113:1`

## DbAdminSqlExecutionResult

Kind: `unknown`
Module: `src/types.ts`
Source: `src/types.ts:57:1`

## DbChangeEvent

Kind: `type`
Module: `node_modules/@ankhorage/contracts/dist/db.d.ts`
Source: `node_modules/@ankhorage/contracts/dist/db.d.ts:72:1`

### Members

| Name           | Kind     | Type                   | Required | Description |
| -------------- | -------- | ---------------------- | -------- | ----------- |
| committedAt    | property | `string \| undefined`  | no       |             |
| kind           | property | `DbChangeKind`         | yes      |             |
| previousRecord | property | `TRecord \| undefined` | no       |             |
| record         | property | `TRecord \| null`      | yes      |             |
| schema         | property | `string \| undefined`  | no       |             |
| table          | property | `string`               | yes      |             |

## DbChangeKind

Kind: `unknown`
Module: `node_modules/@ankhorage/contracts/dist/db.d.ts`
Source: `node_modules/@ankhorage/contracts/dist/db.d.ts:71:1`

## DbChangeListener

Kind: `unknown`
Module: `node_modules/@ankhorage/contracts/dist/db.d.ts`
Source: `node_modules/@ankhorage/contracts/dist/db.d.ts:80:1`

## DbCollectionDefinition

Kind: `type`
Module: `node_modules/@ankhorage/contracts/dist/db.d.ts`
Source: `node_modules/@ankhorage/contracts/dist/db.d.ts:103:1`

### Members

| Name       | Kind     | Type                           | Required | Description |
| ---------- | -------- | ------------------------------ | -------- | ----------- |
| fields     | property | `readonly DbFieldDefinition[]` | yes      |             |
| name       | property | `string`                       | yes      |             |
| primaryKey | property | `string \| undefined`          | no       |             |
| schema     | property | `string \| undefined`          | no       |             |

## DbCollectionReference

Kind: `type`
Module: `node_modules/@ankhorage/contracts/dist/db.d.ts`
Source: `node_modules/@ankhorage/contracts/dist/db.d.ts:109:1`

### Members

| Name   | Kind     | Type                  | Required | Description |
| ------ | -------- | --------------------- | -------- | ----------- |
| name   | property | `string`              | yes      |             |
| schema | property | `string \| undefined` | no       |             |

## DbCollectionSubscriptionInput

Kind: `unknown`
Module: `node_modules/@ankhorage/contracts/dist/db.d.ts`
Source: `node_modules/@ankhorage/contracts/dist/db.d.ts:84:1`

## DbFieldDefinition

Kind: `type`
Module: `node_modules/@ankhorage/contracts/dist/db.d.ts`
Source: `node_modules/@ankhorage/contracts/dist/db.d.ts:96:1`

### Members

| Name         | Kind     | Type                                               | Required | Description |
| ------------ | -------- | -------------------------------------------------- | -------- | ----------- |
| defaultValue | property | `string \| number \| boolean \| null \| undefined` | no       |             |
| name         | property | `string`                                           | yes      |             |
| required     | property | `boolean \| undefined`                             | no       |             |
| type         | property | `DbFieldType`                                      | yes      |             |
| unique       | property | `boolean \| undefined`                             | no       |             |

## DbFieldType

Kind: `unknown`
Module: `node_modules/@ankhorage/contracts/dist/db.d.ts`
Source: `node_modules/@ankhorage/contracts/dist/db.d.ts:95:1`

## DbRealtimeAdapter

Kind: `type`
Module: `node_modules/@ankhorage/contracts/dist/db.d.ts`
Source: `node_modules/@ankhorage/contracts/dist/db.d.ts:89:1`

### Members

| Name     | Kind     | Type                                                                                                                                                                                                                                                                                                    | Required | Description |
| -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| realtime | property | `{ subscribeToCollection<TRecord extends object = DbRecord>(input: DbCollectionSubscriptionInput, listener: DbChangeListener<TRecord>): DbSubscription; subscribeToRecord<TRecord extends object = DbRecord>(input: DbRecordSubscriptionInput, listener: DbChangeListener<TRecord>): DbSubscription; }` | yes      |             |

## DbRecordSubscriptionInput

Kind: `type`
Module: `node_modules/@ankhorage/contracts/dist/db.d.ts`
Source: `node_modules/@ankhorage/contracts/dist/db.d.ts:85:1`

### Members

| Name    | Kind     | Type                  | Required | Description |
| ------- | -------- | --------------------- | -------- | ----------- |
| id      | property | `string \| number`    | yes      |             |
| idField | property | `string \| undefined` | no       |             |
| schema  | property | `string \| undefined` | no       |             |
| table   | property | `string`              | yes      |             |

## DbSubscription

Kind: `type`
Module: `node_modules/@ankhorage/contracts/dist/db.d.ts`
Source: `node_modules/@ankhorage/contracts/dist/db.d.ts:81:1`

### Members

| Name        | Kind   | Type                          | Required | Description |
| ----------- | ------ | ----------------------------- | -------- | ----------- |
| unsubscribe | method | `() => Promise<void> \| void` | yes      |             |

## normalizeRealtimeEvent

Kind: `function`
Module: `src/realtime.ts`
Source: `src/realtime.ts:90:1`

### Signatures

- `(payload: SupabaseRealtimePayload, fallbackTable: string, fallbackSchema: string) => DbChangeEvent<TRecord> | null`
  - fallbackSchema: `string`
  - fallbackTable: `string`
  - payload: `SupabaseRealtimePayload`
  - returns: `DbChangeEvent<TRecord> | null`

## SupabaseDbAdapter

Kind: `unknown`
Module: `src/types.ts`
Source: `src/types.ts:68:1`

## SupabaseDbAdapterOptions

Kind: `type`
Module: `src/types.ts`
Source: `src/types.ts:40:1`

### Members

| Name           | Kind     | Type                                  | Required | Description |
| -------------- | -------- | ------------------------------------- | -------- | ----------- |
| anonKey        | property | `string`                              | yes      |             |
| fetch          | property | `typeof fetch \| undefined`           | no       |             |
| realtime       | property | `boolean \| undefined`                | no       |             |
| realtimeClient | property | `SupabaseRealtimeClient \| undefined` | no       |             |
| schema         | property | `string \| undefined`                 | no       |             |
| url            | property | `string`                              | yes      |             |

## SupabaseDbAdminAdapter

Kind: `unknown`
Module: `src/types.ts`
Source: `src/types.ts:69:1`

## SupabaseDbAdminAdapterOptions

Kind: `type`
Module: `src/types.ts`
Source: `src/types.ts:49:1`

### Members

| Name           | Kind     | Type                                                                 | Required | Description |
| -------------- | -------- | -------------------------------------------------------------------- | -------- | ----------- |
| execute        | property | `boolean \| undefined`                                               | no       |             |
| executeSql     | property | `((sql: string) => Promise<DbAdminSqlExecutionResult>) \| undefined` | no       |             |
| schema         | property | `string \| undefined`                                                | no       |             |
| serviceRoleKey | property | `string \| undefined`                                                | no       |             |
| url            | property | `string`                                                             | yes      |             |

## SupabaseRealtimeClient

Kind: `type`
Module: `src/types.ts`
Source: `src/types.ts:25:1`

### Members

| Name          | Kind   | Type                                                                            | Required | Description |
| ------------- | ------ | ------------------------------------------------------------------------------- | -------- | ----------- |
| channel       | method | `(topic: string) => SupabaseRealtimeChannel`                                    | yes      |             |
| removeChannel | method | `(channel: SupabaseRealtimeChannel) => Promise<"ok" \| "timed out" \| "error">` | yes      |             |

## SupabaseRealtimePayload

Kind: `type`
Module: `src/types.ts`
Source: `src/types.ts:30:1`

### Members

| Name             | Kind     | Type                            | Required | Description |
| ---------------- | -------- | ------------------------------- | -------- | ----------- |
| commit_timestamp | property | `string \| undefined`           | no       |             |
| errors           | property | `string[] \| null \| undefined` | no       |             |
| eventType        | property | `string \| undefined`           | no       |             |
| new              | property | `unknown`                       | no       |             |
| old              | property | `unknown`                       | no       |             |
| schema           | property | `string \| undefined`           | no       |             |
| table            | property | `string \| undefined`           | no       |             |
