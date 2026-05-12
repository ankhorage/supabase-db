import type {
  DbAdminResult,
  SupabaseCollectionDefinition,
  SupabaseDbAdminAdapter,
  SupabaseDbAdminAdapterOptions,
  SupabaseFieldDefinition,
} from './types.js';
import { quoteIdentifier, validateIdentifier, validateKey, validateUrl } from './validation.js';

interface NormalizedAdminConfig {
  readonly url: string;
  readonly schema: string;
  readonly serviceRoleKey?: string;
  readonly execute: boolean;
  readonly executeSql?: SupabaseDbAdminAdapterOptions['executeSql'];
}

export function createSupabaseDbAdminAdapter(
  options: SupabaseDbAdminAdapterOptions,
): SupabaseDbAdminAdapter {
  const config = normalizeAdminConfig(options);

  return {
    capabilities: {
      supportsSchemaGeneration: true,
      supportsDirectExecution: config.execute && config.executeSql !== undefined,
    },

    async createCollection(input: SupabaseCollectionDefinition): Promise<DbAdminResult> {
      const generated = generateCreateCollectionSql(input, config.schema);

      if (!generated.ok || !config.execute) {
        return generated;
      }

      return executeSql(config, generated.sql);
    },

    async deleteCollection(input: { readonly name: string }): Promise<DbAdminResult> {
      const generated = generateDeleteCollectionSql(input, config.schema);

      if (!generated.ok || !config.execute) {
        return generated;
      }

      return executeSql(config, generated.sql);
    },

    generateCreateCollectionSql(input: SupabaseCollectionDefinition): DbAdminResult {
      return generateCreateCollectionSql(input, config.schema);
    },

    generateDeleteCollectionSql(input: { readonly name: string }): DbAdminResult {
      return generateDeleteCollectionSql(input, config.schema);
    },
  };
}

function normalizeAdminConfig(options: SupabaseDbAdminAdapterOptions): NormalizedAdminConfig {
  const normalized: NormalizedAdminConfig = {
    url: validateUrl(options.url),
    schema: options.schema ?? 'public',
    execute: options.execute ?? false,
    executeSql: options.executeSql,
  };

  if (options.serviceRoleKey === undefined) {
    return normalized;
  }

  return {
    ...normalized,
    serviceRoleKey: validateKey(options.serviceRoleKey, 'Supabase service role key'),
  };
}

function generateCreateCollectionSql(
  input: SupabaseCollectionDefinition,
  schemaValue: string,
): DbAdminResult {
  try {
    const schema = quoteIdentifier(schemaValue);
    const table = quoteIdentifier(input.name);
    const primaryKey = input.primaryKey ?? 'id';
    const fields = input.fields.map((field) => formatField(field));
    const primaryKeyFieldExists = input.fields.some((field) => field.name === primaryKey);
    const columns = primaryKeyFieldExists
      ? fields
      : [`${quoteIdentifier(primaryKey)} uuid primary key default gen_random_uuid()`, ...fields];

    if (columns.length === 0) {
      return createAdminError('validation_error', 'A collection requires at least one field.');
    }

    return {
      ok: true,
      sql: `create schema if not exists ${schema};\ncreate table if not exists ${schema}.${table} (\n  ${columns.join(',\n  ')}\n);`,
      executed: false,
    };
  } catch (error) {
    return createAdminError('validation_error', 'Invalid collection definition.', error);
  }
}

function generateDeleteCollectionSql(
  input: { readonly name: string },
  schemaValue: string,
): DbAdminResult {
  try {
    const schema = quoteIdentifier(schemaValue);
    const table = quoteIdentifier(input.name);

    return {
      ok: true,
      sql: `drop table if exists ${schema}.${table};`,
      executed: false,
    };
  } catch (error) {
    return createAdminError('validation_error', 'Invalid collection name.', error);
  }
}

async function executeSql(config: NormalizedAdminConfig, sql: string): Promise<DbAdminResult> {
  if (config.executeSql === undefined) {
    return createAdminError(
      'execution_not_configured',
      'Schema execution requires an executeSql callback.',
    );
  }

  if (config.serviceRoleKey === undefined) {
    return createAdminError(
      'missing_service_role_key',
      'Schema execution requires a service role key in privileged environments only.',
    );
  }

  const result = await config.executeSql(sql);

  if (!result.ok) {
    return {
      ok: false,
      error: result.error ?? {
        code: 'provider_error',
        message: 'Supabase schema execution failed.',
      },
    };
  }

  return {
    ok: true,
    sql,
    executed: true,
  };
}

function formatField(field: SupabaseFieldDefinition): string {
  const name = quoteIdentifier(field.name);
  const type = mapFieldType(field.type);
  const required = field.required === true ? ' not null' : '';
  const unique = field.unique === true ? ' unique' : '';
  const defaultValue = formatDefaultValue(field.defaultValue);

  return `${name} ${type}${required}${unique}${defaultValue}`;
}

function mapFieldType(type: SupabaseFieldDefinition['type']): string {
  switch (type) {
    case 'text':
      return 'text';
    case 'number':
      return 'double precision';
    case 'boolean':
      return 'boolean';
    case 'datetime':
      return 'timestamptz';
    case 'json':
      return 'jsonb';
    case 'uuid':
      return 'uuid';
  }
}

function formatDefaultValue(value: SupabaseFieldDefinition['defaultValue']): string {
  if (value === undefined) {
    return '';
  }

  if (value === null) {
    return ' default null';
  }

  if (typeof value === 'string') {
    return ` default '${value.replaceAll("'", "''")}'`;
  }

  return ` default ${String(value)}`;
}

function createAdminError(code: string, message: string, cause?: unknown): DbAdminResult {
  return {
    ok: false,
    error: cause === undefined ? { code, message } : { code, message, cause },
  };
}
