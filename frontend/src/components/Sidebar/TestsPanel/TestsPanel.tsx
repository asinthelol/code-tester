function TestsPanel() {
  return (
    <div className="flex w-56 flex-col border-r border-neutral-300 dark:border-neutral-700">
      <div className="flex justify-center items-center px-3 py-2.5 h-14 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
        Tests
      </div>
      <div className="flex flex-1 items-center justify-center px-3 text-center text-sm text-neutral-500">
        No tests yet
      </div>
    </div>
  );
}

export default TestsPanel;
