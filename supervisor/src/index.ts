import { emitEvent, readCommands } from './protocol.ts';
import { connectContext } from './workers/node/context.ts';
import { cancelNodeRun, runNodeSuite } from './workers/node/run.ts';
import { cancelPythonRun, runPythonSuite } from './workers/python/run.ts';
import type { NodeRunCommand, PythonRunCommand } from '../../protocol/v1/typescript/index.ts';

async function main(): Promise<void> {
  const ctx = await connectContext();

  emitEvent({ protocolVersion: 1, runId: '', type: 'ready' });

  readCommands((command) => {
    if (command.type === 'run') {
      if (command.adapter === 'node') {
        void runNodeSuite(command as NodeRunCommand, ctx, '/suite');
      } else if (command.adapter === 'python') {
        void runPythonSuite(command as PythonRunCommand, '/suite');
      } else {
        emitEvent({
          protocolVersion: 1,
          runId: command.runId,
          type: 'run.failed',
          reason: `Unsupported adapter "${command.adapter}"`,
        });
      }
    } else if (command.type === 'cancel') {
      cancelNodeRun();
      cancelPythonRun();
    }
  });
}

void main();
