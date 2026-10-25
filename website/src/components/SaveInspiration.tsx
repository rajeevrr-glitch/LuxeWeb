import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { readInspiration, saveInspiration, type Inspiration } from "@/lib/inspiration";
export function SaveInspiration({
  item,
  compact = false,
}: {
  item: Inspiration;
  compact?: boolean;
}) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const update = () => setSaved(readInspiration().some((x) => x.id === item.id));
    update();
    window.addEventListener("luxe-shortlist", update);
    return () => window.removeEventListener("luxe-shortlist", update);
  }, [item.id]);
  return (
    <>
      <button
        type="button"
        className={compact ? "saved-button is-compact" : "saved-button"}
        aria-label={compact ? `${saved ? "Remove" : "Save"} ${item.title}` : undefined}
        title={compact ? (saved ? "Remove saved design" : "Save this design") : undefined}
        aria-pressed={saved}
        onClick={() => {
          try {
            saveInspiration(item);
            setSaved(!saved);
            setError("");
          } catch {
            setError(
              "Your browser could not save this idea. Note its design number in your brief.",
            );
          }
        }}
      >
        <Heart size={15} fill={saved ? "currentColor" : "none"} />
        {!compact && (saved ? "Saved to my brief" : "Use this as inspiration")}
      </button>
      {error && (
        <p role="alert" className="fine-print">
          {error}
        </p>
      )}
    </>
  );
}
