import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { TestTarget } from '../../src/shared/lib/types.ts';

export interface SynthesizedSuite {
  suiteRoot: string;
  entryPoint: string;
  cleanup: () => Promise<void>;
}

function buildSource(
  sourceContent: string,
  testName: string,
  target: TestTarget,
  hasCtx: boolean
): string {
  const args = JSON.stringify(JSON.parse(target.argsJson || '[]'));
  const hasExpected = target.expectedJson.trim() !== '';
  const call = hasCtx
    ? `${target.functionName}(...__args, ctx)`
    : `${target.functionName}(...__args)`;

  const assertBody = hasExpected
    ? `const __expected = ${target.expectedJson};
    if (JSON.stringify(result) !== JSON.stringify(__expected)) {
      throw new Error('expected ' + JSON.stringify(__expected) + ', got ' + JSON.stringify(result));
    }`
    : '';

  return `${sourceContent}

defineTest(${JSON.stringify(testName)}, {
  invoke: async (ctx) => {
    const __args = ${args};
    return ${call};
  },
  assert: async (result) => {
    ${assertBody}
  },
});
`;
}

// Local runs have no environment attached, thus no ctx needed
export async function synthesizeLocalTarget(
  sourceContent: string,
  testName: string,
  target: TestTarget,
  extension: string
): Promise<SynthesizedSuite> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'code-tester-target-'));
  const entryPoint = `suite.${extension}`;
  const filePath = path.join(dir, entryPoint);

  await fs.writeFile(filePath, buildSource(sourceContent, testName, target, false), 'utf-8');

  return {
    suiteRoot: dir,
    entryPoint,
    cleanup: () => fs.rm(dir, { recursive: true, force: true }),
  };
}

// Docker environments mount their whole directory (the one holding the
// compose file) to /suite, so the synthesized file has to live inside that
// same directory tree to be visible in the container.
export async function synthesizeDockerTarget(
  sourceContent: string,
  testName: string,
  target: TestTarget,
  extension: string,
  configPath: string
): Promise<SynthesizedSuite> {
  const envDir = path.dirname(configPath);
  const scratchDir = path.join(envDir, '.code-tester-tmp');
  await fs.mkdir(scratchDir, { recursive: true });

  // This entryPoint is resolved inside the (Linux) container, so it must
  // stay forward-slashed regardless of the host OS building this path.
  const fileName = `suite-${crypto.randomUUID()}.${extension}`;
  const entryPoint = `.code-tester-tmp/${fileName}`;
  const filePath = path.join(scratchDir, fileName);

  await fs.writeFile(filePath, buildSource(sourceContent, testName, target, true), 'utf-8');

  return {
    suiteRoot: envDir,
    entryPoint,
    cleanup: () => fs.rm(filePath, { force: true }),
  };
}
