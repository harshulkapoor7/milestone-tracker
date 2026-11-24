import { useCallback, useEffect, useRef, useState } from "react";
import { useUpdateDay } from "../lib/queries";

const SAVE_DELAY_MS = 800;

type Status = "idle" | "saving" | "saved" | "error";

interface DayNotesProps {
  planId: string;
  dayId: string;
  dayNumber: number;
  initialNote: string;
}

// A notes box that saves itself: 0.8 s after you stop typing (debounced),
// or straight away when you click elsewhere (blur).
export function DayNotes({
  planId,
  dayId,
  dayNumber,
  initialNote,
}: DayNotesProps) {
  const [text, setText] = useState(initialNote);
  const [status, setStatus] = useState<Status>("idle");
  const lastSaved = useRef(initialNote); // what the server has; a ref so changing it doesn't re-render
  const { mutateAsync } = useUpdateDay(planId);

  const save = useCallback(
    async (note: string) => {
      if (note === lastSaved.current) return; // nothing new to save
      setStatus("saving");
      try {
        await mutateAsync({ dayId, input: { note } });
        lastSaved.current = note;
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    },
    [dayId, mutateAsync],
  );

  // The debounce: every keystroke cancels the previous timer and starts a new one,
  // so only the last keystroke's timer survives long enough to save.
  useEffect(() => {
    const timer = setTimeout(() => void save(text), SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text, save]);

  return (
    <div className="mt-2.5">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => void save(text)}
        maxLength={5000}
        placeholder="Notes, links, what tripped you up…"
        aria-label={`Notes for day ${dayNumber}`}
        className="min-h-16 w-full resize-y rounded-[10px] border-[1.5px] border-line bg-bg px-3 py-2"
      />
      <p className="h-5 text-[13px] text-mute" role="status">
        {status === "saving" && "Saving…"}
        {status === "saved" && "Saved ✓"}
        {status === "error" && (
          <span className="text-l0">
            Couldn't save. Check the API is running.
          </span>
        )}
      </p>
    </div>
  );
}
