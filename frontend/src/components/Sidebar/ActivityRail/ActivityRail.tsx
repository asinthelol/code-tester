function ActivityRail() {
  return (
    <div className="flex w-16 flex-col items-center gap-1 border-r border-neutral-300 py-3 dark:border-neutral-700">
      <div className="flex flex-col items-center gap-1 rounded-md bg-neutral-200 px-2 py-2 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="size-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 2.75h7.5L18.25 7.5V21a.75.75 0 0 1-.75.75H6a.75.75 0 0 1-.75-.75V3.5A.75.75 0 0 1 6 2.75Z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.25 2.75V7.5h5" />
        </svg>
        <span className="text-[10px] font-medium">Files</span>
      </div>
    </div>
  );
}

export default ActivityRail;
