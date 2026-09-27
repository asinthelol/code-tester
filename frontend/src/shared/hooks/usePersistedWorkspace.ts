import { useEffect, useState } from 'react';
import type { ImportedFile, IntegrationEnvironment, Repo, Test } from '../../../shared/types';



export function usePersistedWorkspace() {
  const [files, setFiles] = useState<ImportedFile[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [environments, setEnvironments] = useState<IntegrationEnvironment[]>([]);
  const [repos, setRepos] = useState<Repo[]>([]);
  // Guards the persist effect below so the initial empty arrays don't get
  // saved over whatever loadState() is about to bring back.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    window.electron.loadState().then((state) => {
      if (cancelled) return;
      setFiles(state.files);
      setTests(state.tests);
      setEnvironments(state.environments);
      setRepos(state.repos);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void window.electron.saveState({ files, tests, environments, repos });
  }, [hydrated, files, tests, environments, repos]);

  return {
    files,
    setFiles,
    tests,
    setTests,
    environments,
    setEnvironments,
    repos,
    setRepos,
    hydrated,
  };
}
