interface BreadcrumbsProps {
  items: string[];
}

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 11.5 12 4l8 7.5" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 9.5V19a1 1 0 0 0 1 1h3.25v-5a1.75 1.75 0 0 1 3.5 0v5H17a1 1 0 0 0 1-1V9.5"
    />
  </svg>
);

const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="size-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
  </svg>
);

function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
      <span className="flex shrink-0 items-center text-neutral-400 dark:text-neutral-500">
        <HomeIcon />
      </span>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={item} className="flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 text-neutral-300 dark:text-neutral-600">
              <ChevronIcon />
            </span>
            <span
              className={`truncate ${
                isLast
                  ? 'font-semibold text-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-400 dark:text-neutral-500'
              }`}
            >
              {item}
            </span>
          </span>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;
