interface Ctx {
  pg: {
    query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
  };
  redis: {
    set: (key: string, value: string) => Promise<unknown>;
    get: (key: string) => Promise<string | null>;
  };
}

declare const defineTest: (
  name: string,
  def: {
    invoke: (ctx: Ctx) => Promise<unknown>;
    assert: (result: unknown, ctx: Ctx) => Promise<void>;
  }
) => void;

import { formatUserSummary } from './helpers/format.ts';

// Checks the specific seeded rows exist
// the count would grow every time this suite runs
// (the next test leaves a row behind), and a real
// integration test should be safe to rerun against a live,
// shared database rather than assuming a pristine table.
defineTest('postgres has the seeded users', {
  invoke: async (ctx) => {
    const result = await ctx.pg.query(
      'SELECT count(*) FROM users WHERE email IN ($1, $2)',
      ['ada@example.com', 'grace@example.com']
    );
    return Number(result.rows[0].count);
  },
  assert: async (result) => {
    if (result !== 2) throw new Error(`expected both seeded users to exist, got ${result}`);
  },
});

// Deletes any leftover row from a previous run first, so this test is safe
// to rerun any number of times against the same live database.
defineTest('can insert and read back a user', {
  invoke: async (ctx) => {
    await ctx.pg.query('DELETE FROM users WHERE email = $1', ['new@example.com']);
    await ctx.pg.query('INSERT INTO users (email) VALUES ($1)', ['new@example.com']);
    const result = await ctx.pg.query('SELECT email FROM users WHERE email = $1', [
      'new@example.com',
    ]);
    return result.rows[0]?.email;
  },
  assert: async (result) => {
    if (result !== 'new@example.com') {
      throw new Error(`expected to read back the inserted user, got ${result}`);
    }
  },
});

defineTest('redis round-trip', {
  invoke: async (ctx) => {
    await ctx.redis.set('greeting', 'hello');
    return ctx.redis.get('greeting');
  },
  assert: async (result) => {
    if (result !== 'hello') throw new Error(`expected "hello", got ${result}`);
  },
});

defineTest('helper formats a user summary', {
  invoke: async () => formatUserSummary({ id: 1, email: 'ada@example.com' }),
  assert: async (result) => {
    if (result !== 'User #1: ada@example.com') {
      throw new Error(`unexpected summary: ${result}`);
    }
  },
});
