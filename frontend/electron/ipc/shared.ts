import type { Event as SuiteEvent } from '../../../protocol/v1/typescript/index.ts';

export function isTerminalSuiteEvent(event: SuiteEvent): boolean {
  return event.type === 'run.completed' || event.type === 'run.failed' || event.type === 'run.aborted';
}

export function adapterForExtension(extension: string): string {
  return extension.toLowerCase() === 'py' ? 'python' : 'node';
}
