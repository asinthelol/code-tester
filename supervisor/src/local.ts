import { emitEvent, readCommands } from './protocol.ts';
import { cancelNodeRun, runNodeSuite } from './workers/node/run.ts';
import { cancelPythonRun, runPythonSuite } from './workers/python/run.ts';
import type { NodeRunCommand, PythonRunCommand } from '../../protocol/v1/typescript/index.ts';

const suiteRoot = process.argv[2];
if (!suiteRoot) {
  process.stderr.write('Usage: local.js <suiteRoot>\n');
  process.exit(1);
}

function main(): void {
  emitEvent({ protocolVersion: 1, runId: '', type: 'ready' });

  readCommands((command) => {
    if (command.type === 'run') {
      if (command.adapter === 'node') {
        void runNodeSuite(command as NodeRunCommand, {}, suiteRoot);
      } else if (command.adapter === 'python') {
        void runPythonSuite(command as PythonRunCommand, suiteRoot);
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

main();
