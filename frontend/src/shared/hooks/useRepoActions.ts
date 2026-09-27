import type { Dispatch, SetStateAction } from 'react';
import type { IntegrationEnvironment, Repo } from '../../../shared/types';
import type { useEnvironmentActions } from './useEnvironmentActions';



function upsertByPath<T extends { path: string }>(list: T[], item: T) {
  const existingIndex = list.findIndex((f) => f.path === item.path);
  if (existingIndex === -1) {
    return [...list, item];
  }
  const next = [...list];
  next[existingIndex] = item;
  return next;
}

export function useRepoActions(
  repos: Repo[],
  setRepos: Dispatch<SetStateAction<Repo[]>>,
  environments: IntegrationEnvironment[],
  setActiveEnvironmentPath: Dispatch<SetStateAction<string | null>>,
  setActiveSection: Dispatch<SetStateAction<string>>,
  environmentActions: ReturnType<typeof useEnvironmentActions>
) {
  const handleSelectRepo = (repoPath: string) => {
    const repo = repos.find((r) => r.path === repoPath);
    if (!repo?.environmentPath) return;
    setActiveEnvironmentPath(repo.environmentPath);
  };

  const handleAddRepo = ({ repo, environment }: { repo: Repo; environment: IntegrationEnvironment }) => {
    environmentActions.handleAddEnvironment(environment);
    setRepos((prev) => upsertByPath(prev, repo));
    setActiveSection('Environments');
  };

  // "delete from disk" just deletes the environment and the docker-compose
  // associated with the repo.
  const handleDeleteRepo = async (repo: Repo, deleteFromDisk: boolean) => {
    const linkedEnvironment = environments.find((e) => e.path === repo.environmentPath);
    if (linkedEnvironment) {
      await environmentActions.handleDeleteEnvironment(linkedEnvironment, deleteFromDisk);
    }
    setRepos((prev) => prev.filter((r) => r.path !== repo.path));
  };

  return { handleSelectRepo, handleAddRepo, handleDeleteRepo };
}
