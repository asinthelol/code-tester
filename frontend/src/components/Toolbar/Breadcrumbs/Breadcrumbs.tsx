import { MdOutlineChevronRight, MdOutlineHome } from 'react-icons/md';

interface BreadcrumbsProps {
  items: string[];
}

function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
      <span className="flex shrink-0 items-center text-neutral-400 dark:text-neutral-500">
        <MdOutlineHome className="size-4" />
      </span>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={item} className="flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 text-neutral-300 dark:text-neutral-600">
              <MdOutlineChevronRight className="size-3.5 shrink-0" />
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
