import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import Button from '../../ui/Button/Button';

type RunStatus = 'idle' | 'running' | 'passed' | 'failed' | 'error';

const STATUS_LABEL: Record<RunStatus, string> = {
  idle: 'Not run yet',
  running: 'Running…',
  passed: 'Passed',
  failed: 'Failed',
  error: 'Error',
};

const STATUS_DOT: Record<RunStatus, string> = {
  idle: 'bg-neutral-400',
  running: 'bg-amber-400',
  passed: 'bg-green-500',
  failed: 'bg-red-500',
  error: 'bg-red-500',
};

function RunOutputPanel() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<RunStatus>('idle');

  useEffect(() => {
    if (!containerRef.current) return;

    const terminal = new Terminal({
      convertEol: true,
      disableStdin: true,
      fontSize: 13,
      theme: { background: '#171717', foreground: '#e5e5e5' },
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(containerRef.current);
    fitAddon.fit();

    const resizeObserver = new ResizeObserver(() => fitAddon.fit());
    resizeObserver.observe(containerRef.current);

    const unsubscribe = window.electron.onRunEvent((event) => {
      switch (event.type) {
        case 'started':
          terminal.clear();
          setStatus('running');
          break;
        case 'stdout':
          terminal.write(event.chunk);
          break;
        case 'stderr':
          terminal.write(`\x1b[31m${event.chunk}\x1b[0m`);
          break;
        case 'result': {
          const actualStr = JSON.stringify(event.actual);
          if (event.hasExpected) {
            const color = event.passed ? '\x1b[32m' : '\x1b[31m';
            const label = event.passed ? 'PASS' : 'FAIL';
            terminal.write(
              `${color}${label}\x1b[0m expected ${JSON.stringify(event.expected)}, got ${actualStr}\r\n`
            );
          } else {
            terminal.write(`\x1b[2mReturned: ${actualStr}\x1b[0m\r\n`);
          }
          break;
        }
        case 'exit':
          setStatus(event.status);
          terminal.write(`\x1b[2m\r\nExited with code ${event.exitCode}\x1b[0m\r\n`);
          break;
        case 'error':
          setStatus('error');
          terminal.write(`\x1b[2m${event.message}\x1b[0m\r\n`);
          break;
      }
    });

    return () => {
      unsubscribe();
      resizeObserver.disconnect();
      terminal.dispose();
    };
  }, []);

  return (
    <div className="flex h-64 flex-col border-t border-neutral-300 dark:border-neutral-700">
      <div className="flex items-center justify-between px-3 py-1.5">
        <div className="flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
          <span className={`size-2 rounded-full ${STATUS_DOT[status]}`} />
          {STATUS_LABEL[status]}
        </div>
        <Button
          onClick={() => window.electron.runStop()}
          className="px-2 py-1 text-xs font-medium"
        >
          Stop
        </Button>
      </div>

      <div className="min-h-0 flex-1 bg-[#171717] px-2 py-1">
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
}

export default RunOutputPanel;
