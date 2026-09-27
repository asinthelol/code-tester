import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { TestTarget } from '../../../shared/types.ts';

export interface SynthesizedSuite {
  suiteRoot: string;
  entryPoint: string;
  cleanup: () => Promise<void>;
}

type BuildSource = (
  sourceContent: string,
  testName: string,
  target: TestTarget,
  hasCtx: boolean
) => string;

function buildJsSource(
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

function pythonStringLiteral(value: unknown): string {
  return JSON.stringify(JSON.stringify(value));
}

function buildPythonSource(
  sourceContent: string,
  testName: string,
  target: TestTarget,
  hasCtx: boolean
): string {
  const argsLiteral = pythonStringLiteral(JSON.parse(target.argsJson || '[]'));
  const hasExpected = target.expectedJson.trim() !== '';
  const call = hasCtx
    ? `${target.functionName}(*__args, ctx)`
    : `${target.functionName}(*__args)`;

  const assertBody = hasExpected
    ? `    __expected = json.loads(${pythonStringLiteral(JSON.parse(target.expectedJson))})
    if json.dumps(result, sort_keys=True) != json.dumps(__expected, sort_keys=True):
        raise AssertionError('expected ' + json.dumps(__expected) + ', got ' + json.dumps(result))
`
    : '    pass\n';

  return `${sourceContent}

import json
import inspect


async def __ct_invoke(ctx):
    __args = json.loads(${argsLiteral})
    __result = ${call}
    if inspect.isawaitable(__result):
        __result = await __result
    return __result


async def __ct_assert(result, ctx):
${assertBody}

define_test(${JSON.stringify(testName)}, invoke=__ct_invoke, assert_fn=__ct_assert)
`;
}

function jsonValueToCppLiteral(value: unknown): string {
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) {
    if (value.length === 0) {
      throw new Error('C++ targets do not support empty array arguments (element type cannot be inferred)');
    }
    const elementType = inferCppElementType(value);
    const elements = value.map((v) => jsonValueToCppLiteral(v)).join(', ');
    return `std::vector<${elementType}>{${elements}}`;
  }
  throw new Error('C++ targets only support number/string/boolean/array-of-those arguments');
}

function inferCppElementType(values: unknown[]): string {
  const types = new Set(values.map((v) => typeof v));
  if (types.size !== 1) {
    throw new Error('C++ targets do not support mixed-type array arguments');
  }
  const [elementType] = types;
  if (elementType === 'number') {
    return values.every((v) => Number.isInteger(v)) ? 'int' : 'double';
  }
  if (elementType === 'string') return 'std::string';
  if (elementType === 'boolean') return 'bool';
  throw new Error('C++ targets only support number/string/boolean array elements');
}

function buildCppSource(sourceContent: string, testName: string, target: TestTarget): string {
  const parsedArgs = JSON.parse(target.argsJson || '[]');
  if (!Array.isArray(parsedArgs)) {
    throw new Error('C++ targets require argsJson to be a JSON array');
  }
  const argLiterals = parsedArgs.map((v) => jsonValueToCppLiteral(v)).join(', ');

  return `// Test: ${testName}
${sourceContent}

#include <iostream>
#include <iomanip>
#include <vector>
#include <string>

int main() {
    std::cout << std::setprecision(15) << ${target.functionName}(${argLiterals}) << std::endl;
    return 0;
}
`;
}

export { buildJsSource, buildPythonSource, buildCppSource };

// Local runs have no environment attached, thus no ctx needed
export async function synthesizeLocalTarget(
  sourceContent: string,
  testName: string,
  target: TestTarget,
  extension: string,
  buildSource: BuildSource = buildJsSource
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
  configPath: string,
  buildSource: BuildSource = buildJsSource
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
