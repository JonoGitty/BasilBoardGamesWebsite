import { vi } from 'vitest';

/**
 * Creates a chainable mock that mimics the Supabase query builder:
 *   supabase.from(table).select().eq().order()...
 *
 * Usage:
 *   const mock = mockSupabaseQuery('games', [makeGameRow()]);
 *   vi.mocked(supabase.from).mockReturnValue(mock);
 */
export function mockSupabaseQuery(
  _table: string,
  data: unknown[],
  error: { message: string; code: string } | null = null,
) {
  const result = { data: error ? null : data, error, count: data.length };

  const chain: Record<string, unknown> = {};
  const chainMethods = [
    'select', 'insert', 'update', 'upsert', 'delete',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in',
    'order', 'limit', 'range', 'single', 'maybeSingle',
    'is', 'not', 'like', 'ilike', 'match', 'filter',
    'textSearch', 'contains', 'containedBy', 'overlaps',
  ];

  for (const method of chainMethods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // Terminal methods resolve to the result
  chain.single = vi.fn().mockReturnValue({ ...result, data: data[0] ?? null });
  chain.maybeSingle = vi.fn().mockReturnValue({ ...result, data: data[0] ?? null });
  chain.then = vi.fn((resolve: (v: unknown) => void) => resolve(result));

  // Make the chain itself thenable (for await support)
  Object.defineProperty(chain, 'then', {
    value: (resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve),
    writable: true,
    configurable: true,
  });

  return chain;
}

/**
 * Mocks supabase.functions.invoke(name, ...) to return the given response.
 *
 * Usage:
 *   const invoke = mockEdgeFunctionInvoke('admin-command', { ok: true, result: {...} });
 *   vi.mocked(supabase.functions.invoke).mockImplementation(invoke);
 */
export function mockEdgeFunctionInvoke(
  expectedName: string,
  response: unknown,
  options?: { status?: number; error?: string },
) {
  return vi.fn().mockImplementation((name: string) => {
    if (name !== expectedName) {
      return Promise.resolve({
        data: null,
        error: { message: `Unexpected function call: ${name}` },
      });
    }
    if (options?.error) {
      return Promise.resolve({
        data: null,
        error: { message: options.error },
      });
    }
    return Promise.resolve({
      data: response,
      error: null,
    });
  });
}
