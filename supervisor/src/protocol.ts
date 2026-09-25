import type { Command, Event } from '../../protocol/v1/typescript/index.ts';

export function emitEvent(event: Event): void {
  process.stdout.write(`${JSON.stringify(event)}\n`);
}

export function readCommands(onCommand: (command: Command) => void): void {
  let buffer = '';

  process.stdin.on('data', (data: Buffer) => {
    buffer += data.toString('utf-8');
    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIndex).replace(/\r$/, '');
      buffer = buffer.slice(newlineIndex + 1);
      if (!line.trim()) continue;

      try {
        onCommand(JSON.parse(line) as Command);
      } catch (error) {
        process.stderr.write(`Malformed command: ${(error as Error).message}\n`);
      }
    }
  });
}
