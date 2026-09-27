import type { Dispatch, SetStateAction } from 'react';
import type { IntegrationEnvironment, Test } from '../../../shared/types';
import type { useEnvironmentRuntime } from './useEnvironmentRuntime';



function upsertByPath<T extends { path: string }>(list: T[], item: T) {
  const existingIndex = list.findIndex((f) => f.path === item.path);
  if (existingIndex === -1) {
    return [...list, item];
  }
  const next = [...list];
  next[existingIndex] = item;
  return next;
}

export function useEnvironmentActions(
  setEnvironments: Dispatch<SetStateAction<IntegrationEnvironment[]>>,
  setTests: Dispatch<SetStateAction<Test[]>>,
  activeEnvironmentPath: string | null,
  setActiveEnvironmentPath: Dispatch<SetStateAction<string | null>>,
  environmentRuntime: ReturnType<typeof useEnvironmentRuntime>
) {
  const handleAddEnvironment = (environment: IntegrationEnvironment) => {
    setEnvironments((prev) => upsertByPath(prev, environment));
    setActiveEnvironmentPath(environment.path);
  };

  // Also detaches (not deletes) any test pointing at this environment,
  // falling back those tests to local execution rather than removing them.
  const handleDeleteEnvironment = async (environment: IntegrationEnvironment, deleteFromDisk: boolean) => {
    if (environment.path === environmentRuntime.runningEnvironmentPath) {
      await environmentRuntime.handleStopEnvironment(environment.path);
    }
    if (deleteFromDisk) await window.electron.deleteFileFromDisk(environment.path);
    setEnvironments((prev) => prev.filter((e) => e.path !== environment.path));
    setTests((prev) =>
      prev.map((t) => (t.environmentPath === environment.path ? { ...t, environmentPath: null } : t))
    );
    if (activeEnvironmentPath === environment.path) setActiveEnvironmentPath(null);
  };

  return { handleAddEnvironment, handleDeleteEnvironment };
}
