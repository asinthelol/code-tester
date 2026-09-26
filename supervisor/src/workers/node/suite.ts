import type { WorkerContext } from './context.ts';

export type { WorkerContext };

export interface TestDefinition {
  name: string;
  invoke: (ctx: WorkerContext) => Promise<unknown>;
  assert: (result: unknown, ctx: WorkerContext) => Promise<void>;
}

let registered: TestDefinition[] = [];

export function resetRegistry(): void {
  registered = [];
}

export function getRegistered(): TestDefinition[] {
  return registered;
}

export function defineTest(
  name: string,
  def: {
    invoke: (ctx: WorkerContext) => Promise<unknown>;
    assert: (result: unknown, ctx: WorkerContext) => Promise<void>;
  }
): void {
  registered.push({ name, ...def });
}
