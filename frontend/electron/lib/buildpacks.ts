import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { lineBuffered } from './ndjson.ts';

// CNB builder covering Node/Python/Go/Java.
export const DEFAULT_BUILDER_IMAGE = 'paketobuildpacks/builder-jammy-base';

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

export async function buildWithBuildpacks(
  serviceDir: string,
  imageTag: string,
  onEvent: (line: string) => void
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      'pack',
      ['build', imageTag, '--path', serviceDir, '--builder', DEFAULT_BUILDER_IMAGE, '--pull-policy', 'if-not-present'],
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
