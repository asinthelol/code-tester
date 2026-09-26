import path from 'node:path';
import { buildWithBuildpacks, cancelBuildpacksBuild } from './buildpacks.ts';
import {
  buildComposeDocument,
  scaffoldTestsStub,
  serializeCompose,
  writeComposeFile,
} from './composeGenerator.ts';
import { parseEnvironmentConfig } from './parseEnvironmentConfig.ts';
import type {
  IntegrationEnvironment,
  RepoScaffoldEvent,
  ScaffoldRequest,
} from '../../src/shared/lib/types.ts';

export function cancelScaffold(): void {
  cancelBuildpacksBuild();
}

export async function scaffoldRepo(
  request: ScaffoldRequest,
  onEvent: (event: RepoScaffoldEvent) => void
): Promise<IntegrationEnvironment> {
  const { repoPath, services, backingServices } = request;
  const imageTags: Record<string, string> = {};

  try {
    for (const service of services) {
      if (service.buildStrategy !== 'buildpacks') continue;

      const tag = `code-tester-repo-${service.name}:latest`;
      onEvent({ type: 'scaffold.status', message: `Building ${service.name} with buildpacks...` });
      const serviceDir = service.relativePath === '.' ? repoPath : path.join(repoPath, service.relativePath);
      await buildWithBuildpacks(serviceDir, tag, (line) =>
        onEvent({ type: 'scaffold.buildpacks.status', service: service.name, message: line })
      );
      imageTags[service.name] = tag;
    }

    onEvent({ type: 'scaffold.status', message: 'Generating docker-compose.yml...' });
    const doc = buildComposeDocument(request, backingServices, imageTags);
    const yamlText = serializeCompose(doc);
    const composePath = await writeComposeFile(repoPath, yamlText);

    onEvent({ type: 'scaffold.status', message: 'Scaffolding starter test file...' });
    const stubResult = await scaffoldTestsStub(repoPath);
    onEvent({
      type: 'scaffold.status',
      message: stubResult === 'written' ? 'Wrote tests/index.ts' : 'tests/index.ts already exists, left it alone',
    });

    const environment = await parseEnvironmentConfig(composePath);
    onEvent({ type: 'scaffold.completed', environment });
    return environment;
  } catch (error) {
    const message = (error as Error).message;
    onEvent({ type: 'scaffold.failed', message });
    throw error;
  }
}
