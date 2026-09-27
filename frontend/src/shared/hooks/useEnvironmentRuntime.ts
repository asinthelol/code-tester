import { useEffect, useState } from 'react';
import type { EnvironmentStatus } from '../lib/types';



// This gets its own hook so navigating away and back doesn't unmount it and lose
// track of what's actually still running.
export function useEnvironmentRuntime() {
  const [runningEnvironmentPath, setRunningEnvironmentPath] = useState<string | null>(null);
  const [environmentStatus, setEnvironmentStatus] = useState<EnvironmentStatus>('idle');
  const [environmentLog, setEnvironmentLog] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = window.electron.onEnvironmentEvent((event) => {
      switch (event.type) {
        case 'compose.status':
          setEnvironmentLog((prev) => [...prev, event.message]);
          break;
        case 'environment.ready':
          setEnvironmentStatus('ready');
          break;
        case 'environment.failed':
          setEnvironmentStatus('failed');
          setEnvironmentLog((prev) => [
            ...prev,
            `Failed (${event.reason})${event.message ? `: ${event.message}` : ''}`,
          ]);
          break;
        case 'environment.stopped':
          setEnvironmentStatus('stopped');
          break;
      }
    });
    return unsubscribe;
  }, []);

  const handleStartEnvironment = async (configPath: string) => {
    setRunningEnvironmentPath(configPath);
    setEnvironmentStatus('starting');
    setEnvironmentLog([]);
    await window.electron.environmentStart(configPath);
  };

  const handleStopEnvironment = async (configPath: string) => {
    setEnvironmentStatus('stopping');
    await window.electron.environmentStop(configPath);
    setRunningEnvironmentPath(null);
  };

  return {
    runningEnvironmentPath,
    environmentStatus,
    environmentLog,
    handleStartEnvironment,
    handleStopEnvironment,
  };
}
