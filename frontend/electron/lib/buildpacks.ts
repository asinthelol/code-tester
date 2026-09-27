import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { lineBuffered } from './ndjson.ts';

// CNB builder covering Node/Python/Go/Java.
export const DEFAULT_BUILDER_IMAGE = 'paketobuildpacks/builder-jammy-base';

// to prevent symlink error from occuring, ima exclude these from build context
const EXCLUDED_FROM_BUILD_CONTEXT = ['node_modules', '.venv', 'venv', '__pycache__', '.git'];

let activeBuild: ChildProcess | null = null;

export function friendlyPackError(error: NodeJS.ErrnoException): string {
  if (error.code === 'ENOENT') {
    return 'pack CLI not found. Install Cloud Native Buildpacks\' pack CLI: https://buildpacks.io/docs/tools/pack/';
  }
  return error.message;
}

export function cancelBuildpacksBuild(): void {
  activeBuild?.kill();
}

async function writeExcludeDescriptor(): Promise<string> {
  const descriptorPath = path.join(os.tmpdir(), `code-tester-project-${crypto.randomUUID()}.toml`);
  const excludeList = EXCLUDED_FROM_BUILD_CONTEXT.map((entry) => `"${entry}"`).join(', ');
  const toml = `[_]
schema-version = "0.2"
id = "code-tester.scaffold"

[io.buildpacks]
exclude = [${excludeList}]
`;
  await fs.writeFile(descriptorPath, toml, 'utf-8');
  return descriptorPath;
}

export async function buildWithBuildpacks(
  serviceDir: string,
  imageTag: string,
  onEvent: (line: string) => void
): Promise<void> {
  const descriptorPath = await writeExcludeDescriptor();

  try {
    await runPackBuild(serviceDir, imageTag, descriptorPath, onEvent);
  } finally {
    await fs.rm(descriptorPath, { force: true });
  }
}

function runPackBuild(
  serviceDir: string,
  imageTag: string,
  descriptorPath: string,
  onEvent: (line: string) => void
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(
      'pack',
      [
        'build',
        imageTag,
        '--path',
        serviceDir,
        '--builder',
        DEFAULT_BUILDER_IMAGE,
        '--pull-policy',
        'if-not-present',
        '--descriptor',
        descriptorPath,
      ],
      { shell: false, stdio: ['ignore', 'pipe', 'pipe'] }
    );
    activeBuild = child;

    // keep a small trailing window instead of last lines
    // before crash.
    const recentLines: string[] = [];
    const emitLine = lineBuffered((line) => {
      recentLines.push(line);
      if (recentLines.length > 8) recentLines.shift();
      onEvent(line);
    });
    child.stdout?.on('data', emitLine);
    child.stderr?.on('data', emitLine);

    child.on('error', (error) => {
      if (activeBuild === child) activeBuild = null;
      reject(new Error(friendlyPackError(error as NodeJS.ErrnoException)));
    });

    child.on('exit', (exitCode, signal) => {
      if (activeBuild === child) activeBuild = null;
      if (signal) {
        reject(new Error('Buildpacks build cancelled'));
      } else if (exitCode === 0) {
        resolve();
      } else {
        reject(new Error(recentLines.join('\n') || `pack build exited with code ${exitCode}`));
      }
    });
  });
}
