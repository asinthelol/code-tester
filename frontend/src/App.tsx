import { useRef, useState } from 'react';
import type { editor } from 'monaco-editor';
import CodeEditor from './components/Editor/CodeEditor/CodeEditor';
import ConfirmDeleteModal from './components/ui/ConfirmDeleteModal/ConfirmDeleteModal';
import EnvironmentDetail from './components/Environments/EnvironmentDetail/EnvironmentDetail';
import RepoDetail from './components/Repos/RepoDetail/RepoDetail';
import Sidebar from './components/Sidebar/Sidebar';
import EnvironmentsPanel from './components/Sidebar/EnvironmentsPanel/EnvironmentsPanel';
import FilesPanel from './components/Sidebar/FilesPanel/FilesPanel';
import ReposPanel from './components/Sidebar/ReposPanel/ReposPanel';
import TestsPanel from './components/Sidebar/TestsPanel/TestsPanel';
import SelectFunctionModal from './components/Tests/SelectFunctionModal/SelectFunctionModal';
import TestDetail from './components/Tests/TestDetail/TestDetail';
import Toolbar from './components/Toolbar/Toolbar';
import { usePersistedWorkspace } from './shared/hooks/usePersistedWorkspace';
import { useEnvironmentRuntime } from './shared/hooks/useEnvironmentRuntime';
import { useSuiteRuns } from './shared/hooks/useSuiteRuns';
import { useFileActions } from './shared/hooks/useFileActions';
import { useEnvironmentActions } from './shared/hooks/useEnvironmentActions';
import { useRepoActions } from './shared/hooks/useRepoActions';
import { useTestActions } from './shared/hooks/useTestActions';
import { useTestExecution } from './shared/hooks/useTestExecution';
import type { EnvironmentStatus, PendingDelete } from './shared/lib/types';



function App() {
  const workspace = usePersistedWorkspace();
  const environmentRuntime = useEnvironmentRuntime();
  const suiteRunsApi = useSuiteRuns();

  const [activePath, setActivePath] = useState<string | null>(null);
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [activeEnvironmentPath, setActiveEnvironmentPath] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('Files');
  const [targetPickerFor, setTargetPickerFor] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const fileActions = useFileActions(workspace.setFiles, activePath, setActivePath);
  const environmentActions = useEnvironmentActions(
    workspace.setEnvironments,
    workspace.setTests,
    activeEnvironmentPath,
    setActiveEnvironmentPath,
    environmentRuntime
  );
  const repoActions = useRepoActions(
    workspace.repos,
    workspace.setRepos,
    workspace.environments,
    setActiveEnvironmentPath,
    setActiveSection,
    environmentActions
  );
  const testActions = useTestActions(
    workspace.setTests,
    activeTestId,
    setActiveTestId,
    targetPickerFor,
    setTargetPickerFor,
    setActiveSection,
    suiteRunsApi.removeSuiteRun
  );

  const activeFile = workspace.files.find((f) => f.path === activePath) ?? null;
  const activeTest = workspace.tests.find((t) => t.id === activeTestId) ?? null;
  const activeRepo = workspace.repos.find((r) => r.environmentPath === activeEnvironmentPath) ?? null;
  const activeEnvironment =
    workspace.environments.find((e) => e.path === activeEnvironmentPath) ?? null;
  const displayedEnvironmentStatus =
    activeEnvironmentPath && activeEnvironmentPath === environmentRuntime.runningEnvironmentPath
      ? environmentRuntime.environmentStatus
      : 'idle';

  const activeTestEnvironment =
    workspace.environments.find((e) => e.path === activeTest?.environmentPath) ?? null;
  const activeTestEnvironmentStatus: EnvironmentStatus =
    activeTest?.environmentPath && activeTest.environmentPath === environmentRuntime.runningEnvironmentPath
      ? environmentRuntime.environmentStatus
      : 'idle';

  const testExecution = useTestExecution(
    activeTest,
    workspace.files,
    suiteRunsApi.suiteRuns,
    suiteRunsApi.startSuiteRun,
    setTargetPickerFor
  );

  const handleSave = async () => {
    if (!editorRef.current || !activeFile) return;
    await fileActions.saveFileContent(activeFile, editorRef.current.getValue());
  };

  const handleConfirmDelete = async (deleteFromDisk: boolean) => {
    if (!pendingDelete) return;
    switch (pendingDelete.kind) {
      case 'file':
        await fileActions.handleDeleteFile(pendingDelete.item, deleteFromDisk);
        break;
      case 'test':
        testActions.handleDeleteTest(pendingDelete.item);
        break;
      case 'environment':
        await environmentActions.handleDeleteEnvironment(pendingDelete.item, deleteFromDisk);
        break;
      case 'repo':
        await repoActions.handleDeleteRepo(pendingDelete.item, deleteFromDisk);
        break;
    }
    setPendingDelete(null);
  };

  return (
    <div className="flex h-svh">
      <Sidebar activeItem={activeSection} onNavigate={setActiveSection} />

      {activeSection === 'Repos' && (
        <ReposPanel
          repos={workspace.repos}
          activePath={activeRepo?.path ?? null}
          onSelect={repoActions.handleSelectRepo}
          onDelete={(repo) => setPendingDelete({ kind: 'repo', item: repo })}
        />
      )}
      {activeSection === 'Files' && (
        <FilesPanel
          files={workspace.files}
          activePath={activePath}
          onSelect={setActivePath}
          onDelete={(file) => setPendingDelete({ kind: 'file', item: file })}
        />
      )}
      {activeSection === 'Tests' && (
        <TestsPanel
          tests={workspace.tests}
          environments={workspace.environments}
          activeId={activeTestId}
          onSelect={setActiveTestId}
          onConfigure={(test) => setTargetPickerFor(test.id)}
          onDelete={(test) => setPendingDelete({ kind: 'test', item: test })}
        />
      )}
      {activeSection === 'Environments' && (
        <EnvironmentsPanel
          environments={workspace.environments}
          activePath={activeEnvironmentPath}
          onSelect={setActiveEnvironmentPath}
          onDelete={(environment) => setPendingDelete({ kind: 'environment', item: environment })}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Toolbar
          activeSection={activeSection}
          environments={workspace.environments}
          onImport={fileActions.handleImport}
          onAddTest={testActions.handleAddTest}
          onAddEnvironment={environmentActions.handleAddEnvironment}
          onAddRepo={repoActions.handleAddRepo}
        />

        {activeSection === 'Environments' ? (
          activeEnvironment ? (
            <EnvironmentDetail
              environment={activeEnvironment}
              status={displayedEnvironmentStatus}
              log={activeEnvironmentPath === environmentRuntime.runningEnvironmentPath ? environmentRuntime.environmentLog : []}
              onStart={() => environmentRuntime.handleStartEnvironment(activeEnvironment.path)}
              onStop={() => environmentRuntime.handleStopEnvironment(activeEnvironment.path)}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
              Add an environment to get started
            </div>
          )
        ) : activeSection === 'Tests' ? (
          activeTest ? (
            <TestDetail
              test={activeTest}
              environment={activeTestEnvironment}
              environmentStatus={activeTestEnvironmentStatus}
              suiteRun={suiteRunsApi.suiteRuns[activeTest.id]}
              runSetupError={testExecution.runSetupError}
              onRun={testExecution.handleRunTest}
              onCancel={testExecution.handleCancelTest}
              onConfigureTarget={() => setTargetPickerFor(activeTest.id)}
              onStartEnvironment={() =>
                activeTest.environmentPath && environmentRuntime.handleStartEnvironment(activeTest.environmentPath)
              }
              onStopEnvironment={() =>
                activeTest.environmentPath && environmentRuntime.handleStopEnvironment(activeTest.environmentPath)
              }
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
              Add a test to get started
            </div>
          )
        ) : activeSection === 'Repos' ? (
          activeRepo ? (
            <RepoDetail
              repo={activeRepo}
              environment={activeEnvironment}
              environmentStatus={displayedEnvironmentStatus}
              onManageEnvironment={() => setActiveSection('Environments')}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
              Select a repo to view its details
            </div>
          )
        ) : activeFile ? (
          <>
            <div className="flex items-center justify-between border-b border-neutral-300 px-6 py-2 text-sm text-neutral-500 dark:border-neutral-700">
              <span className="truncate">{activeFile.path}</span>
              <div className="ml-4 flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800/60"
                >
                  Save
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <CodeEditor
                path={activeFile.path}
                value={activeFile.content}
                editorRef={editorRef}
                onSave={handleSave}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
            Import a file to get started
          </div>
        )}
      </div>

      <SelectFunctionModal
        open={targetPickerFor !== null}
        onClose={() => setTargetPickerFor(null)}
        files={workspace.files}
        onSelect={testActions.handleSelectTarget}
        onCreateNew={testActions.handleCreateNewFunction}
      />

      <ConfirmDeleteModal
        open={pendingDelete !== null}
        itemLabel={pendingDelete?.item.name ?? ''}
        diskDescription={
          pendingDelete?.kind === 'file'
            ? 'this file'
            : pendingDelete?.kind === 'environment'
              ? 'its docker-compose.yml'
              : pendingDelete?.kind === 'repo'
                ? 'the generated docker-compose.yml'
                : undefined
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default App;
