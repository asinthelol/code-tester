import { emitEvent, readCommands } from './protocol.ts';
import { connectContext } from './workers/node/context.ts';
import { cancelNodeRun, runNodeSuite } from './workers/node/run.ts';
import type { NodeRunCommand } from '../../protocol/v1/typescript/index.ts';

async function main(): Promise<void> {
  const ctx = await connectContext();

  emitEvent({ protocolVersion: 1, runId: '', type: 'ready' });

  readCommands((command) => {
    if (command.type === 'run') {
      if (command.adapter === 'node') {
        void runNodeSuite(command as NodeRunCommand, ctx, '/suite');
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
    }
  });
}

void main();
