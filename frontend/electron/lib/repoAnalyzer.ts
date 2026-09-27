import fs from 'node:fs/promises';
import path from 'node:path';
import type {
  BackingServiceSuggestion,
  BackingServiceType,
  DetectedService,
  RepoAnalysis,
} from '../../shared/types.ts';

const SKIP_DIRS = new Set(['.git', 'node_modules', '.venv', 'venv', 'dist', 'build']);
const MANIFEST_FILES = ['package.json', 'requirements.txt', 'go.mod', 'Cargo.toml'];

async function exists(candidate: string): Promise<boolean> {
  try {
    await fs.access(candidate);
    return true;
  } catch {
    return false;
  }
}

async function hasManifest(dir: string): Promise<boolean> {
  for (const file of [...MANIFEST_FILES, 'Dockerfile']) {
    if (await exists(path.join(dir, file))) return true;
  }
  return false;
}

// A Dockerfile that lives inside a service subdirectory sometimes still
// writes its COPY/ADD sources relative to the repo root
// (`docker build -f backend/Dockerfile .` from the repo root).
async function detectDockerfileBuildContext(
  serviceDir: string,
  dirName: string
): Promise<'own' | 'repoRoot'> {
  const dockerfilePath = path.join(serviceDir, 'Dockerfile');
  if (!(await exists(dockerfilePath))) return 'own';

  const content = await fs.readFile(dockerfilePath, 'utf-8');
  const prefixPattern = new RegExp(`^\\s*(COPY|ADD)\\s+(?:--\\S+\\s+)*${dirName}/`, 'im');
  return prefixPattern.test(content) ? 'repoRoot' : 'own';
}

export function sanitizeServiceName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9_-]/g, '-') || 'app';
}

async function detectServices(repoPath: string): Promise<DetectedService[]> {
  const entries = await fs.readdir(repoPath, { withFileTypes: true });
  const candidateDirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => !name.startsWith('.') && !SKIP_DIRS.has(name));

  const qualifying: string[] = [];
  for (const dirName of candidateDirs) {
    if (await hasManifest(path.join(repoPath, dirName))) {
      qualifying.push(dirName);
    }
  }

  const dirsToUse = qualifying.length > 0 ? qualifying : [''];

  const services: DetectedService[] = [];
  for (const relativePath of dirsToUse) {
    const serviceDir = relativePath ? path.join(repoPath, relativePath) : repoPath;
    const name = sanitizeServiceName(relativePath || path.basename(repoPath));
    const hasDockerfile = await exists(path.join(serviceDir, 'Dockerfile'));
    const buildStrategy = hasDockerfile ? 'dockerfile' : 'buildpacks';
    const buildContext =
      hasDockerfile && relativePath
        ? await detectDockerfileBuildContext(serviceDir, relativePath)
        : 'own';
    services.push({ name, relativePath: relativePath || '.', buildStrategy, buildContext });
  }

  return services;
}

// Small starter table, not exhaustive
//  new ecosystems/libraries get added as they come up
const MANIFEST_SIGNALS: Record<
  string,
  { pattern: RegExp; type: BackingServiceType; scheme?: string }[]
> = {
  'package.json': [
    { pattern: /"pg"\s*:/, type: 'postgres' },
    { pattern: /"(mysql2?|mariadb)"\s*:/, type: 'mysql' },
    { pattern: /"(redis|ioredis)"\s*:/, type: 'redis' },
    { pattern: /"mongo(db|oose)"\s*:/, type: 'mongodb' },
  ],
  'requirements.txt': [
    { pattern: /^psycopg2(-binary)?\b/im, type: 'postgres' },
    { pattern: /^asyncpg\b/im, type: 'postgres', scheme: 'postgresql+asyncpg' },
    { pattern: /^pymysql\b/im, type: 'mysql', scheme: 'mysql+pymysql' },
    { pattern: /^mysqlclient\b/im, type: 'mysql' },
    { pattern: /^mysql-connector-python\b/im, type: 'mysql', scheme: 'mysql+mysqlconnector' },
    { pattern: /^redis\b/im, type: 'redis' },
    { pattern: /^(pymongo|motor)\b/im, type: 'mongodb' },
  ],
  'go.mod': [
    { pattern: /(lib\/pq|jackc\/pgx)/, type: 'postgres' },
    { pattern: /go-sql-driver\/mysql/, type: 'mysql' },
    { pattern: /redis\/go-redis/, type: 'redis' },
    { pattern: /mongodb\/mongo-go-driver/, type: 'mongodb' },
  ],
  'Cargo.toml': [
    { pattern: /^tokio-postgres\b/im, type: 'postgres' },
    { pattern: /^mysql(_async)?\b/im, type: 'mysql' },
    { pattern: /^redis\b/im, type: 'redis' },
    { pattern: /^mongodb\b/im, type: 'mongodb' },
  ],
};

const URL_SCHEME_TYPES: { pattern: RegExp; type: BackingServiceType }[] = [
  { pattern: /^postgres(ql)?:\/\//i, type: 'postgres' },
  { pattern: /^mysql:\/\//i, type: 'mysql' },
  { pattern: /^redis:\/\//i, type: 'redis' },
  { pattern: /^mongodb(\+srv)?:\/\//i, type: 'mongodb' },
];

const ENV_KEY_TYPES: { pattern: RegExp; type: BackingServiceType }[] = [
  { pattern: /^(POSTGRES?|PG)_URL$/i, type: 'postgres' },
  { pattern: /^MYSQL_URL$/i, type: 'mysql' },
  { pattern: /^REDIS_URL$/i, type: 'redis' },
  { pattern: /^MONGO(DB)?_URL$/i, type: 'mongodb' },
];

interface RawSignal {
  type: BackingServiceType | null;
  envVarName?: string;
  scheme?: string;
  detail: string;
}

async function scanManifest(serviceDir: string): Promise<RawSignal[]> {
  const signals: RawSignal[] = [];
  for (const [file, rules] of Object.entries(MANIFEST_SIGNALS)) {
    const filePath = path.join(serviceDir, file);
    if (!(await exists(filePath))) continue;
    const content = await fs.readFile(filePath, 'utf-8');
    for (const rule of rules) {
      if (rule.pattern.test(content)) {
        signals.push({ type: rule.type, scheme: rule.scheme, detail: file });
      }
    }
  }
  return signals;
}

async function scanEnvFiles(serviceDir: string): Promise<RawSignal[]> {
  const signals: RawSignal[] = [];
  for (const file of ['.env', '.env.example']) {
    const filePath = path.join(serviceDir, file);
    if (!(await exists(filePath))) continue;
    const content = await fs.readFile(filePath, 'utf-8');
    for (const rawLine of content.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');

      const keyMatch = ENV_KEY_TYPES.find((r) => r.pattern.test(key));
      if (keyMatch) {
        signals.push({ type: keyMatch.type, envVarName: key, detail: file });
        continue;
      }

      if (/^[A-Z0-9_]*DATABASE_URL$/i.test(key) || /^[A-Z0-9_]*DB_URL$/i.test(key)) {
        const schemeMatch = value ? URL_SCHEME_TYPES.find((r) => r.pattern.test(value)) : null;
        signals.push({ type: schemeMatch?.type ?? null, envVarName: key, detail: file });
      }
    }
  }
  return signals;
}

async function detectBackingServices(
  services: DetectedService[],
  repoPath: string
): Promise<BackingServiceSuggestion[]> {
  const byType = new Map<BackingServiceType, BackingServiceSuggestion>();

  for (const service of services) {
    const serviceDir = service.relativePath === '.' ? repoPath : path.join(repoPath, service.relativePath);
    const [manifestSignals, envSignals] = await Promise.all([
      scanManifest(serviceDir),
      scanEnvFiles(serviceDir),
    ]);

    const manifestType = manifestSignals.find((s) => s.type)?.type ?? null;
    const typelessEnvVar = envSignals.find((s) => !s.type)?.envVarName;

    const resolved: RawSignal[] = envSignals.filter((s) => s.type);
    if (manifestType) {
      const matchedManifestSignal = manifestSignals.find((s) => s.type === manifestType)!;
      resolved.push({
        type: manifestType,
        envVarName: typelessEnvVar,
        scheme: matchedManifestSignal.scheme,
        detail: matchedManifestSignal.detail,
      });
    } else if (typelessEnvVar) {
      // An env var like DATABASE_URL exists but has no value/scheme to
      // classify it, and no manifest signal resolved it either
      continue;
    }

    for (const signal of resolved) {
      if (!signal.type) continue;
      const existing = byType.get(signal.type);
      const detailText = `${service.name} (${signal.detail}${signal.envVarName ? `, ${signal.envVarName}` : ''})`;
      if (existing) {
        existing.detectedVia += `; ${detailText}`;
        existing.sources.push({
          service: service.name,
          envVarName: signal.envVarName,
          scheme: signal.scheme,
        });
      } else {
        const autoWireable =
          signal.type === 'postgres' || signal.type === 'redis' || signal.type === 'mysql';
        byType.set(signal.type, {
          type: signal.type,
          autoWireable,
          detectedVia: detailText,
          sources: [{ service: service.name, envVarName: signal.envVarName, scheme: signal.scheme }],
          confirmed: autoWireable,
        });
      }
    }
  }

  return [...byType.values()];
}

export async function analyzeRepo(repoPath: string): Promise<RepoAnalysis> {
  const services = await detectServices(repoPath);
  const backingServices = await detectBackingServices(services, repoPath);

  return {
    repoPath,
    repoName: path.basename(repoPath),
    services,
    backingServices,
  };
}
