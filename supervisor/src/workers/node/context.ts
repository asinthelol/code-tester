import { Client as PgClient } from 'pg';
import { createClient } from 'redis';
import mysql from 'mysql2/promise';

// mysql2's native .execute()/.query() return a [rows, fields] tuple, unlike
// pg's Client.query() which resolves an object with a .rows property. Wrap
// it so suite authors get the same ctx.<client>.query(sql, params).rows
// shape regardless of which backing service they're using.
export interface QueryClient {
  query: (sql: string, params?: any[]) => Promise<{ rows: unknown[] }>;
}

export interface WorkerContext {
  // Hardcoded infrastructure access, connected once at supervisor
  // startup from env vars and reused across every run. Unfortunately not
  // config-driven "any service by name" I thought about.
  // Undefined when the corresponding *_HOST env var isn't set, so suites
  // (and environments) that don't need a given service don't need one.
  pg?: PgClient;
  redis?: ReturnType<typeof createClient>;
  mysql?: QueryClient;
}

let context: WorkerContext | null = null;

const CONNECT_RETRY_ATTEMPTS = 5;
const CONNECT_RETRY_DELAY_MS = 1_000;

// A compose healthcheck reporting "healthy" doesn't guarantee a backing
// service is actually ready to accept connections yet. Retry a few
// times with a short delay instead of crashing the whole supervisor
// process on the first transient connection failure.
async function withConnectRetry<T>(connect: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= CONNECT_RETRY_ATTEMPTS; attempt++) {
    try {
      return await connect();
    } catch (error) {
      lastError = error;
      if (attempt < CONNECT_RETRY_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, CONNECT_RETRY_DELAY_MS));
      }
    }
  }
  throw lastError;
}

async function connectMysql(): Promise<QueryClient> {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : undefined,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  return {
    query: async (sql, params) => {
      const [rows] = await connection.execute(sql, params);
      return { rows: rows as unknown[] };
    },
  };
}

export async function connectContext(): Promise<WorkerContext> {
  let pg: PgClient | undefined;
  if (process.env.PG_HOST) {
    pg = new PgClient({
      host: process.env.PG_HOST,
      port: process.env.PG_PORT ? Number(process.env.PG_PORT) : undefined,
      user: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
      database: process.env.PG_DATABASE,
    });
    const client = pg;
    await withConnectRetry(() => client.connect());
  }

  let redis: ReturnType<typeof createClient> | undefined;
  if (process.env.REDIS_HOST) {
    redis = createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : undefined,
      },
    });
    const client = redis;
    await withConnectRetry(() => client.connect());
  }

  let mysqlClient: QueryClient | undefined;
  if (process.env.MYSQL_HOST) {
    mysqlClient = await withConnectRetry(connectMysql);
  }

  context = { pg, redis, mysql: mysqlClient };
  return context;
}

export function getContext(): WorkerContext {
  return context ?? {};
}
