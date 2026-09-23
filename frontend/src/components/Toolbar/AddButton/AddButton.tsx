interface AddButtonProps {
  label: string;
  onClick: () => void;
}

function AddButton({ label, onClick }: AddButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md bg-neutral-900 px-3 py-1 text-sm font-medium text-white hover:bg-neutral-700"
    >
      {label}
    </button>
  );
}

export default AddButton;
