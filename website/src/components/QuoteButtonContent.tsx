import { MessageSquareText } from "lucide-react";

export function QuoteButtonContent({ detail = false }: { detail?: boolean }) {
  return (
    <>
      <span className="quote-button-icon" aria-hidden="true">
        <MessageSquareText size={19} strokeWidth={1.7} />
      </span>
      <span className="quote-button-copy">
        <span>Get a quote</span>
        {detail && <small>For the space you have in mind</small>}
      </span>
    </>
  );
}
