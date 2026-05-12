import type { DbFilter, DbPage, DbSelectInput, DbSort } from '@ankhorage/contracts/db';

import { validateIdentifier } from './validation.js';

export function buildSelectUrl(baseUrl: string, input: DbSelectInput): URL {
  const table = validateIdentifier(input.table, 'Table');
  const url = new URL(`${baseUrl}/rest/v1/${table}`);

  url.searchParams.set('select', formatColumns(input.columns));

  applyFilters(url, input.filters ?? []);
  applySort(url, input.sort ?? []);
  applyPage(url, input.page);

  return url;
}

export function buildMutationUrl(
  baseUrl: string,
  tableValue: string,
  filters: readonly DbFilter[],
): URL {
  const table = validateIdentifier(tableValue, 'Table');
  const url = new URL(`${baseUrl}/rest/v1/${table}`);

  applyFilters(url, filters);

  return url;
}

function applyFilters(url: URL, filters: readonly DbFilter[]): void {
  for (const filter of filters) {
    const field = validateIdentifier(filter.field, 'Filter field');
    url.searchParams.append(field, formatFilter(filter));
  }
}

function applySort(url: URL, sort: readonly DbSort[]): void {
  if (sort.length === 0) {
    return;
  }

  const order = sort
    .map((item) => {
      const field = validateIdentifier(item.field, 'Sort field');
      return `${field}.${item.direction ?? 'asc'}`;
    })
    .join(',');

  url.searchParams.set('order', order);
}

function applyPage(url: URL, page: DbPage | undefined): void {
  if (page?.limit !== undefined) {
    url.searchParams.set('limit', String(page.limit));
  }

  if (page?.offset !== undefined) {
    url.searchParams.set('offset', String(page.offset));
  }
}

function formatColumns(columns: readonly string[] | undefined): string {
  if (columns === undefined || columns.length === 0) {
    return '*';
  }

  return columns.map((column) => validateIdentifier(column, 'Column')).join(',');
}

function formatFilter(filter: DbFilter): string {
  switch (filter.operator) {
    case 'eq':
      return `eq.${formatValue(filter.value)}`;
    case 'neq':
      return `neq.${formatValue(filter.value)}`;
    case 'gt':
      return `gt.${formatValue(filter.value)}`;
    case 'gte':
      return `gte.${formatValue(filter.value)}`;
    case 'lt':
      return `lt.${formatValue(filter.value)}`;
    case 'lte':
      return `lte.${formatValue(filter.value)}`;
    case 'in':
      return `in.(${formatInValue(filter.value)})`;
    case 'contains':
      return `cs.${formatValue(filter.value)}`;
    case 'startsWith':
      return `like.${formatLikeValue(filter.value)}*`;
    case 'endsWith':
      return `like.*${formatLikeValue(filter.value)}`;
  }
}

function formatInValue(value: unknown): string {
  if (!Array.isArray(value)) {
    return formatValue(value);
  }

  return value.map((item) => formatValue(item)).join(',');
}

function formatLikeValue(value: unknown): string {
  return String(value).replaceAll('*', '\\*');
}

function formatValue(value: unknown): string {
  if (value === null) {
    return 'null';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return JSON.stringify(value);
}
