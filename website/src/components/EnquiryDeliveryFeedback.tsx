import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { whatsappRequestUrl } from "@/lib/whatsapp";
import type { EnquiryDeliveryResult } from "@/lib/enquiry-delivery";
import type { LeadContact } from "@/lib/sales-funnel";
import { useEnquiryDelivery } from "@/hooks/use-enquiry-delivery";
import { ContactDisclosure, EnquiryHandoff } from "@/components/EnquiryContact";

export function AutomaticEnquiryReceipt({ result }: { result: EnquiryDeliveryResult }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  return (
    <div className="lf-handoff lf-automatic-receipt" role="status">
      <span className="lf-ready">
        <CheckCircle2 size={20} /> Request submitted
      </span>
      <h2 tabIndex={-1} ref={heading}>
        Thank you. We have your request.
      </h2>
      <p>
        Your details are saved for our team to follow up about your request. You don’t need to open
        another app.
      </p>
      <p className="lf-reference">
        Your reference <strong>{result.reference}</strong>
      </p>
      <p className="lf-funnel-note">
        This confirms submission, not an appointment or a quotation. Please keep your reference for
        any follow-up.
      </p>
      <Link to="/design-ideas" className="button secondary">
        Keep exploring designs
      </Link>
    </div>
  );
}

export function AutomaticDeliveryError({
  error,
  message,
  pendingReference = "",
}: {
  error: string;
  message: string;
  pendingReference?: string;
}) {
  if (!error) return null;
  return (
    <div className="lf-delivery-error" role="alert">
      <p>{error}</p>
      {pendingReference && (
        <p>
          Request reference: <strong>{pendingReference}</strong>
        </p>
      )}
      <a
        href={whatsappRequestUrl(
          message +
            (pendingReference
              ? `\nWebsite reference: ${pendingReference}\nPlease check this existing request before creating another.`
              : ""),
        )}
        target="_blank"
        rel="noreferrer"
        className="lx-underlink"
      >
        <MessageCircle size={17} /> Contact us on WhatsApp instead
      </a>
      <small>
        If you already submitted, include that in your message so our team can check before creating
        another request.
      </small>
    </div>
  );
}

// Budget results remain visible before a visitor chooses to contact the team.
export function PlannedQuoteDelivery({
  contact,
  message,
  onEdit,
}: {
  contact: LeadContact;
  message: string;
  onEdit: () => void;
}) {
  const delivery = useEnquiryDelivery();
  if (delivery.result) return <AutomaticEnquiryReceipt result={delivery.result} />;
  if (delivery.checking)
    return (
      <p role="status" className="lf-funnel-note">
        Preparing your contact options…
      </p>
    );
  if (!delivery.enabled) return <EnquiryHandoff message={message} onEdit={onEdit} />;
  return (
    <div className="lf-handoff">
      <h3>Would you like a quote for this plan?</h3>
      <p>Send your selections and contact details to our team.</p>
      <AutomaticDeliveryError
        error={delivery.error}
        message={message}
        pendingReference={delivery.pendingReference}
      />
      <button
        type="button"
        className="button"
        disabled={delivery.checking || delivery.sending}
        onClick={() =>
          void delivery.submit({
            kind: "quote",
            name: contact.name,
            phone: contact.phone,
            city: contact.city,
            message,
            consent: true,
          })
        }
      >
        {delivery.sending ? "Submitting…" : "Send my quote request"}
      </button>
      <ContactDisclosure automatic />
      <button type="button" className="lx-underlink" disabled={delivery.sending} onClick={onEdit}>
        Edit my details
      </button>
    </div>
  );
}
