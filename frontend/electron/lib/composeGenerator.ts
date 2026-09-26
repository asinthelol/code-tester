import fs from 'node:fs/promises';
import path from 'node:path';
import { stringify } from 'yaml';
import { saveFile } from './saveFile.ts';
import { sanitizeServiceName } from './repoAnalyzer.ts';
import type {
  BackingServiceSuggestion,
  DetectedService,
} from '../../src/shared/lib/types.ts';

const BACKING_SERVICE_BLOCKS: Record<string, Record<string, unknown>> = {
  postgres: {
    image: 'postgres:16',
    environment: { POSTGRES_PASSWORD: 'test', POSTGRES_DB: 'app' },
    healthcheck: {
      test: ['CMD-SHELL', 'pg_isready -U postgres'],
      interval: '2s',
      timeout: '3s',
      retries: 10,
    },
  },
  redis: {
    image: 'redis:7-alpine',
    healthcheck: {
      test: ['CMD', 'redis-cli', 'ping'],
      interval: '2s',
      timeout: '3s',
      retries: 10,
    },
  },
  mysql: {
    image: 'mysql:8',
    environment: { MYSQL_ROOT_PASSWORD: 'test', MYSQL_DATABASE: 'app' },
    healthcheck: {
      test: ['CMD', 'mysqladmin', 'ping', '-h', 'localhost'],
      interval: '2s',
      timeout: '3s',
      retries: 10,
    },
  },
};

type WireableType = 'postgres' | 'redis' | 'mysql';

const DEFAULT_SCHEME: Record<WireableType, string> = {
  postgres: 'postgresql',
  redis: 'redis',
  mysql: 'mysql',
};

// `scheme` overrides the default scheme when the detected client
// library needs a specific one. See BackingServiceSource.scheme.
function connectionString(type: WireableType, scheme?: string): string {
  const effectiveScheme = scheme ?? DEFAULT_SCHEME[type];
  switch (type) {
    case 'postgres':
      return `${effectiveScheme}://postgres:test@postgres:5432/app`;
    case 'redis':
      return `${effectiveScheme}://redis:6379`;
    case 'mysql':
      return `${effectiveScheme}://root:test@mysql:3306/app`;
  }
}

// Auto-wiring is deliberately restricted to what supervisor/context.ts
// actually builds a ctx client for.
// See BackingServiceSuggestion.autoWireable.
function wireableServices(confirmed: BackingServiceSuggestion[]) {
  return confirmed.filter(
    (s): s is BackingServiceSuggestion & { type: WireableType } =>
      s.confirmed && (s.type === 'postgres' || s.type === 'redis' || s.type === 'mysql')
  );
}

export function buildComposeDocument(
  analysis: { repoName: string; services: DetectedService[] },
  confirmedBackingServices: BackingServiceSuggestion[],
  imageTags: Record<string, string>
): { name: string; services: Record<string, unknown> } {
  const backing = wireableServices(confirmedBackingServices);
  const services: Record<string, unknown> = {};

  for (const svc of analysis.services) {
    const dependsOn: Record<string, { condition: string }> = {};
    for (const b of backing) {
      dependsOn[b.type] = { condition: 'service_healthy' };
    }

    const block: Record<string, unknown> = {};
    if (svc.buildStrategy === 'dockerfile') {
      if (svc.buildContext === 'repoRoot') {
        block.build = { context: '.', dockerfile: `${svc.relativePath}/Dockerfile` };
      } else {
        block.build = svc.relativePath === '.' ? '.' : `./${svc.relativePath}`;
      }
    } else {
      const tag = imageTags[svc.name];
      if (!tag) throw new Error(`No built image tag found for buildpacks service "${svc.name}"`);
      block.image = tag;
    }
    if (Object.keys(dependsOn).length > 0) block.depends_on = dependsOn;

    const envVars: Record<string, string> = {};
    for (const b of backing) {
      const source = b.sources.find((s) => s.service === svc.name && s.envVarName);
      if (source?.envVarName) {
        envVars[source.envVarName] = connectionString(b.type, source.scheme);
      }
    }
    if (Object.keys(envVars).length > 0) block.environment = envVars;

    services[svc.name] = block;
  }

  for (const b of backing) {
    services[b.type] = BACKING_SERVICE_BLOCKS[b.type];
  }

  const supervisorDependsOn: Record<string, { condition: string }> = {};
  for (const b of backing) {
    supervisorDependsOn[b.type] = { condition: 'service_healthy' };
  }
  for (const svc of analysis.services) {
    supervisorDependsOn[svc.name] = { condition: 'service_started' };
  }

  const supervisorEnv: Record<string, string> = {};
  if (backing.some((b) => b.type === 'postgres')) {
    Object.assign(supervisorEnv, {
      PG_HOST: 'postgres',
      PG_PORT: '5432',
      PG_USER: 'postgres',
      PG_PASSWORD: 'test',
      PG_DATABASE: 'app',
    });
  }
  if (backing.some((b) => b.type === 'redis')) {
    Object.assign(supervisorEnv, { REDIS_HOST: 'redis', REDIS_PORT: '6379' });
  }
  if (backing.some((b) => b.type === 'mysql')) {
    Object.assign(supervisorEnv, {
      MYSQL_HOST: 'mysql',
      MYSQL_PORT: '3306',
      MYSQL_USER: 'root',
      MYSQL_PASSWORD: 'test',
      MYSQL_DATABASE: 'app',
    });
  }

  services.supervisor = {
    image: 'code-tester-supervisor:v1',
    volumes: ['.:/suite'],
    stdin_open: true,
    tty: false,
    ...(Object.keys(supervisorEnv).length > 0 ? { environment: supervisorEnv } : {}),
    depends_on: supervisorDependsOn,
  };

  return { name: `code-tester-${sanitizeServiceName(analysis.repoName)}`, services };
}

export function serializeCompose(doc: unknown): string {
  return stringify(doc);
}

export async function writeComposeFile(repoPath: string, yamlText: string): Promise<string> {
  const composePath = path.join(repoPath, 'docker-compose.yml');
  let alreadyExists = true;
  try {
    await fs.access(composePath);
  } catch {
    alreadyExists = false;
  }
  if (alreadyExists) {
    throw new Error(
      'docker-compose.yml already exists in this repo. remove or rename it, then analyze again.'
    );
  }
  await saveFile(composePath, yamlText);
  return composePath;
}

const TESTS_STUB = `declare const defineTest: (
  name: string,
  def: {
    invoke: () => Promise<unknown>;
    assert: (result: unknown) => Promise<void>;
  }
) => void;

// Generated by the Repos import pipeline. Replace this with a real check
// against one of this repo's services. See docker-compose.yml for the
// service names you can reach over the compose network (e.g. fetch()
// against http://<service-name>:<port>/...).
defineTest('replace me with a real test', {
  invoke: async () => true,
  assert: async (result) => {
    if (result !== true) throw new Error('placeholder test failed');
  },
});
`;

// Dockerfiles frequently do `COPY .env ./`, which fails the build outright
// if only `.env.example` exists -- the normal state for a fresh clone.
// Copying the example into place (the same first step most READMEs tell a
// human to do by hand) avoids an otherwise-opaque build failure.
//
// `.env` has to land wherever the build context expects it (targetDir),
// but `.env.example` isn't always in that same directory -- a service's
// own subdirectory commonly keeps its own .env.example even when the
// Dockerfile's build context is the repo root. Check each candidate in
// order and copy the first one found.
export async function ensureEnvFile(
  targetDir: string,
  exampleSourceDirs: string[]
): Promise<'copied' | 'skipped'> {
  const envPath = path.join(targetDir, '.env');
  try {
    await fs.access(envPath);
    return 'skipped';
  } catch {
    // Doesn't exist yet -- proceed.
  }

  for (const sourceDir of exampleSourceDirs) {
    const examplePath = path.join(sourceDir, '.env.example');
    try {
      await fs.access(examplePath);
    } catch {
      continue;
    }
    await fs.copyFile(examplePath, envPath);
    return 'copied';
  }

  return 'skipped';
}

export async function scaffoldTestsStub(repoPath: string): Promise<'written' | 'skipped'> {
  const testsDir = path.join(repoPath, 'tests');
  const indexPath = path.join(testsDir, 'index.ts');
  try {
    await fs.access(indexPath);
    return 'skipped';
  } catch {
    // Doesn't exist yet. Proceed to write it.
  }
  await fs.mkdir(testsDir, { recursive: true });
  await saveFile(indexPath, TESTS_STUB);
  return 'written';
}
