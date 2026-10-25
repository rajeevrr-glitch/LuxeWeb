import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, ArrowUpRight } from "lucide-react";
import { readInspiration } from "@/lib/inspiration";
export function InspirationLink({ compact = false }: { compact?: boolean }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => setCount(readInspiration().length);
    update();
    window.addEventListener("luxe-shortlist", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("luxe-shortlist", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return (
    <Link
      to="/my-inspiration"
      className={compact ? "inspiration-nav" : "inspiration-link"}
      aria-label={`My inspiration, ${count} saved ideas`}
    >
      <Heart size={17} />
      {!compact && <span>My inspiration</span>}
      <span>{count}</span>
      {!compact && <ArrowUpRight size={16} />}
    </Link>
  );
}
