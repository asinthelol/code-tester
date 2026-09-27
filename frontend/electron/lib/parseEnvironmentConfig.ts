import fs from 'node:fs/promises';
import { parse } from 'yaml';
import type { IntegrationEnvironment } from '../../shared/types.ts';

export async function parseEnvironmentConfig(
  configPath: string
): Promise<IntegrationEnvironment> {
  const content = await fs.readFile(configPath, 'utf-8');
  const parsed = parse(content) as { name?: string; services?: Record<string, unknown> };

  return {
    path: configPath,
    name: parsed.name ?? configPath,
    services: Object.keys(parsed.services ?? {}),
  };
}
