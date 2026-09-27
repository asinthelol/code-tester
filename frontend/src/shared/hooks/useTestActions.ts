import type { Dispatch, SetStateAction } from 'react';
import type { Test, TestTarget } from '../../../shared/types';



export function useTestActions(
  setTests: Dispatch<SetStateAction<Test[]>>,
  activeTestId: string | null,
  setActiveTestId: Dispatch<SetStateAction<string | null>>,
  targetPickerFor: string | null,
  setTargetPickerFor: Dispatch<SetStateAction<string | null>>,
  setActiveSection: Dispatch<SetStateAction<string>>,
  removeSuiteRun: (testId: string) => void
) {
  const handleAddTest = (test: { name: string; environmentPath: string | null; spec: Test['spec'] }) => {
    const id = crypto.randomUUID();
    setTests((prev) => [
      ...prev,
      { id, name: test.name, environmentPath: test.environmentPath, spec: test.spec },
    ]);
    setActiveTestId(id);
  };

  const handleSelectTarget = (target: TestTarget) => {
    if (!targetPickerFor) return;
    setTests((prev) =>
      prev.map((t) =>
        t.id === targetPickerFor && t.spec.kind === 'target'
          ? { ...t, spec: { kind: 'target', target } }
          : t
      )
    );
    setTargetPickerFor(null);
  };

  const handleCreateNewFunction = () => {
    setTargetPickerFor(null);
    setActiveSection('Files');
  };

  const handleDeleteTest = (test: Test) => {
    setTests((prev) => prev.filter((t) => t.id !== test.id));
    removeSuiteRun(test.id);
    if (activeTestId === test.id) setActiveTestId(null);
  };

  return { handleAddTest, handleSelectTarget, handleCreateNewFunction, handleDeleteTest };
}
