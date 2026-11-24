import { useEffect, useState, type ReactNode } from "react";

interface ConfirmButtonProps {
  children: ReactNode;
  onConfirm: () => void;
  label: string; // accessible name, e.g. "Delete day 3"
}

// Two-step delete, like the prototype: first click arms it, second click confirms.
// If you don't click again within 3 seconds, it quietly disarms.
export function ConfirmButton({
  children,
  onConfirm,
  label,
}: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(timer);
  }, [armed]);

  return (
    <button
      type="button"
      aria-label={armed ? `${label}: click again to confirm` : label}
      onClick={() => {
        if (armed) onConfirm();
        else setArmed(true);
      }}
      className={`min-h-9 cursor-pointer rounded-full border-[1.5px] border-l0 px-3 text-sm font-semibold whitespace-nowrap ${armed ? "bg-l0 text-white" : "bg-bg text-l0"}`}
    >
      {armed ? "Click again to delete" : children}
    </button>
  );
}
