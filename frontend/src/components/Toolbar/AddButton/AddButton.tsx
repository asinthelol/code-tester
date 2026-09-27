import { MdOutlineAdd } from 'react-icons/md';

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
      <MdOutlineAdd className="size-3.5 shrink-0" />
    </button>
  );
}

export default AddButton;
