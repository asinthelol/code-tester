import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { getExtension } from '../lib/path';
import type { SuiteRun } from '../lib/types';
import type { ImportedFile, Test } from '../../../shared/types';



// dispatches whichever of runCppTarget/runTargetSuite &
// supervisorExecute/runLocalSuite applies.
export function useTestExecution(
  activeTest: Test | null,
  files: ImportedFile[],
  suiteRuns: Record<string, SuiteRun>,
  startSuiteRun: (testId: string) => string,
  setTargetPickerFor: Dispatch<SetStateAction<string | null>>
) {
  const [runSetupError, setRunSetupError] = useState<string | null>(null);

  const handleRunTest = async () => {
    if (!activeTest) return;

    if (activeTest.spec.kind === 'target') {
      const target = activeTest.spec.target;
      if (!target) {
        setTargetPickerFor(activeTest.id);
        return;
      }

      const targetFile = files.find((f) => f.path === target.filePath);
      if (!targetFile) {
        setRunSetupError('Target file is no longer available. Configure a new target.');
        return;
      }
      setRunSetupError(null);

      const extension = getExtension(targetFile.path);
      if (extension === 'cpp' || extension === 'hpp') {
        const runId = startSuiteRun(activeTest.id);
        await window.electron.runCppTarget({
          runId,
          testName: activeTest.name,
          target,
          sourceContent: targetFile.content,
          extension,
          environmentPath: activeTest.environmentPath,
        });
        return;
      }

      const runId = startSuiteRun(activeTest.id);
      await window.electron.runTargetSuite({
        runId,
        testName: activeTest.name,
        target,
        sourceContent: targetFile.content,
        extension,
        environmentPath: activeTest.environmentPath,
      });
      return;
    }

    setRunSetupError(null);
    const runId = startSuiteRun(activeTest.id);
    if (activeTest.environmentPath) {
      await window.electron.supervisorExecute(runId, activeTest.spec.entryPoint);
    } else {
      await window.electron.runLocalSuite(runId, activeTest.spec.entryPoint);
    }
  };

  const handleCancelTest = async () => {
    if (!activeTest) return;
    const run = suiteRuns[activeTest.id];
    if (!run) return;

    if (activeTest.spec.kind === 'target' && activeTest.spec.target) {
      const target = activeTest.spec.target;
      const targetFile = files.find((f) => f.path === target.filePath);
      const extension = targetFile ? getExtension(targetFile.path) : '';
      if (extension === 'cpp' || extension === 'hpp') {
        await window.electron.cancelCppTarget();
        return;
      }
    }

    if (activeTest.environmentPath) {
      await window.electron.supervisorCancel(run.runId, activeTest.environmentPath);
    } else {
      await window.electron.cancelLocalSuite(run.runId);
    }
  };

  return { handleRunTest, handleCancelTest, runSetupError };
}
