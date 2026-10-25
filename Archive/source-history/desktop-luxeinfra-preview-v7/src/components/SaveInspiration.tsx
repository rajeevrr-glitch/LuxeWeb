import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { readInspiration, saveInspiration, type Inspiration } from "@/lib/inspiration";
export function SaveInspiration({ item }: { item: Inspiration }) {
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
        className="saved-button"
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
        {saved ? "Saved to my brief" : "Use this as inspiration"}
      </button>
      {error && (
        <p role="alert" className="fine-print">
          {error}
        </p>
      )}
    </>
  );
}
