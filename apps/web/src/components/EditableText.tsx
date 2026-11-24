import { useState, type InputHTMLAttributes } from "react";

interface EditableTextProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
> {
  value: string;
  onSave: (value: string) => void;
  isValid?: (value: string) => boolean; // invalid drafts snap back instead of saving
}

// An input that keeps its own draft and only saves when you're done:
// Enter or clicking away saves, Escape puts the old value back.
// Empty or invalid values aren't saved; the old value comes back instead.
export function EditableText({
  value,
  onSave,
  isValid = () => true,
  ...props
}: EditableTextProps) {
  const [draft, setDraft] = useState(value);
  const [prevValue, setPrevValue] = useState(value);

  // If the saved value changes from outside (e.g. after a refetch), show it.
  // This "adjust state during render" pattern is React's recommended
  // alternative to syncing with useEffect.
  if (value !== prevValue) {
    setPrevValue(value);
    setDraft(value);
  }

  const commit = () => {
    const next = draft.trim();
    if (next && next !== value && isValid(next)) onSave(next);
    else setDraft(value);
  };

  return (
    <input
      {...props}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur(); // blur → commit
        if (e.key === "Escape") {
          setDraft(value);
          e.currentTarget.blur();
        }
      }}
    />
  );
}
