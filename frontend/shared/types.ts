export interface ImportedFile {
  path: string;
  name: string;
  content: string;
}

export interface TestTarget {
  filePath: string;
  functionName: string;
  startLine: number;
  endLine: number;
  argsJson: string;
  expectedJson: string;
}

export type TestSpec =
  | { kind: 'target'; target: TestTarget | null }
  | { kind: 'entryPoint'; entryPoint: string };

export interface Test {
  id: string;
  name: string;
  environmentPath: string | null;
  spec: TestSpec;
}

export interface TargetRunRequest {
  runId: string;
  testName: string;
  target: TestTarget;
  sourceContent: string;
  extension: string;
  environmentPath: string | null;
}

export interface IntegrationEnvironment {
  path: string;
  name: string;
  services: string[];
}

export interface Repo {
  path: string;
  name: string;
  environmentPath: string | null;
}

export type BackingServiceType = 'postgres' | 'redis' | 'mysql' | 'mongodb';

export interface DetectedService {
  name: string;
  relativePath: string;
  buildStrategy: 'dockerfile' | 'buildpacks';
  // Only meaningful when buildStrategy is 'dockerfile'. 'repoRoot' when the
  // Dockerfile's own COPY/ADD sources reference paths prefixed with the
  // service's own directory name (e.g. `COPY backend/requirements.txt`),
  // which only resolves correctly if the build context is the repo root,
  // not the service's own directory.
  buildContext: 'own' | 'repoRoot';
}

export interface BackingServiceSource {
  service: string;
  envVarName?: string;
  // Overrides the connection string's URL when needed
  // (e.g. SQLAlchemy + pymysql needs "mysql+pymysql://")
  // Undefined defaults to the usual "mysql://" which is fine for other languages
  scheme?: string;
}

export interface BackingServiceSuggestion {
  type: BackingServiceType;
  autoWireable: boolean;
  detectedVia: string;
  sources: BackingServiceSource[];
  confirmed: boolean;
}

export interface RepoAnalysis {
  repoPath: string;
  repoName: string;
  services: DetectedService[];
  backingServices: BackingServiceSuggestion[];
}

export interface ScaffoldRequest {
  repoPath: string;
  repoName: string;
  services: DetectedService[];
  backingServices: BackingServiceSuggestion[];
}

export type RepoScaffoldEvent =
  | { type: 'scaffold.status'; message: string }
  | { type: 'scaffold.buildpacks.status'; service: string; message: string }
  | { type: 'scaffold.completed'; environment: IntegrationEnvironment }
  | { type: 'scaffold.failed'; message: string };

export type EnvironmentEvent =
  | { type: 'compose.status'; message: string }
  | { type: 'environment.ready' }
  | { type: 'environment.failed'; reason: 'timeout' | 'error' | 'cancelled'; message?: string }
  | { type: 'environment.stopped' };

export interface PersistedState {
  files: ImportedFile[];
  tests: Test[];
  environments: IntegrationEnvironment[];
  repos: Repo[];
}
