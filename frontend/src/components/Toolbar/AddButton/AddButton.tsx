interface AddButtonProps {
  label: string;
  onClick: () => void;
}

function AddButton({ label, onClick }: AddButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between gap-3 rounded-md border border-[#513bd9] bg-[#513bd9] py-1 pr-2.5 pl-3 text-sm font-normal text-white transition-all duration-500 hover:brightness-110"
    >
      {label}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="size-3.5 shrink-0"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
      </svg>
    </button>
  );
}

export default AddButton;
