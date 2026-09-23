function ReposPanel() {
  return (
    <div className="flex w-56 flex-col border-r border-neutral-300 dark:border-neutral-700">
      <div className="flex h-14 items-center justify-center border-b border-neutral-300 px-3 py-2.5 text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:border-neutral-700">
        Repos
      </div>
      <div className="flex flex-1 items-center justify-center px-3 text-center text-sm text-neutral-500">
        No repos yet
      </div>
    </div>
  );
}

export default ReposPanel;
