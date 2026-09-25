import { Client as PgClient } from 'pg';
import { createClient } from 'redis';

export interface WorkerContext {
  // Hardcoded infrastructure access, connected once at supervisor
  // startup from env vars and reused across every run. Unfortunately not
  // config-driven "any service by name" I thought about. 
  // Undefined when the corresponding *_HOST env var isn't set, so suites
  // (and environments) that don't need a given service don't need one.
  pg?: PgClient;
  redis?: ReturnType<typeof createClient>;
}

let context: WorkerContext | null = null;

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
    await pg.connect();
  }

  let redis: ReturnType<typeof createClient> | undefined;
  if (process.env.REDIS_HOST) {
    redis = createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : undefined,
      },
    });
    await redis.connect();
  }

  context = { pg, redis };
  return context;
}

export function getContext(): WorkerContext {
  return context ?? {};
}
