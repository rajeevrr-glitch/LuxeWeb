import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { business } from "@/lib/business";
import { callTimes, type LeadContact } from "@/lib/sales-funnel";
import { whatsappRequestUrl } from "@/lib/whatsapp";

export function ContactFields({
  value,
  onChange,
  disabled = false,
  locationLabel = "Where is your home?",
}: {
  value: LeadContact;
  onChange: (key: keyof LeadContact, value: string) => void;
  disabled?: boolean;
  locationLabel?: string;
}) {
  return (
    <fieldset className="lf-contact-fields" disabled={disabled}>
      <div className="lf-input-pair">
        <label>
          Your name
          <input
            autoComplete="name"
            required
            maxLength={80}
            placeholder="e.g. Aarav Sharma"
            value={value.name}
            onChange={(e) => onChange("name", e.target.value)}
          />
        </label>
        <label>
          Mobile number
          <input
            autoComplete="tel"
            type="tel"
            inputMode="tel"
            required
            maxLength={20}
            placeholder="10-digit mobile number"
            value={value.phone}
            onChange={(e) => onChange("phone", e.target.value)}
          />
        </label>
      </div>
      <div className="lf-input-pair">
        <label>
          {locationLabel}
          <input
            autoComplete="address-level2"
            required
            maxLength={100}
            placeholder="City / locality"
            value={value.city}
            onChange={(e) => onChange("city", e.target.value)}
          />
        </label>
        <label>
          Service region
          <select value={value.region} onChange={(e) => onChange("region", e.target.value)}>
            {[...business.areas, "Other"].map((region) => (
              <option key={region}>{region}</option>
            ))}
          </select>
        </label>
      </div>
      <details className="lf-contact-extra">
        <summary>
          <Phone size={15} /> Add a call preference or email <span>Optional</span>
        </summary>
        <div className="lf-input-pair">
          <label>
            Best time for a call
            <select value={value.callTime} onChange={(e) => onChange("callTime", e.target.value)}>
              {callTimes.map((time) => (
                <option key={time}>{time}</option>
              ))}
            </select>
            <small>IST. A preference, not a confirmed appointment.</small>
          </label>
          <label>
            Email address
            <input
              autoComplete="email"
              type="email"
              maxLength={160}
              placeholder="you@example.com"
              value={value.email}
              onChange={(e) => onChange("email", e.target.value)}
            />
          </label>
        </div>
      </details>
    </fieldset>
  );
}

export function ContactDisclosure({
  direct = false,
  automatic = false,
}: {
  direct?: boolean;
  automatic?: boolean;
}) {
  return (
    <p className="lf-disclosure">
      {automatic
        ? "Submitting saves your request privately for our team to review. "
        : direct
          ? "WhatsApp will open with your details. Press Send there to contact us. "
          : "Choose WhatsApp or email on the next screen, then send your request. "}
      By {automatic ? "submitting" : "sending"}, you ask LuxeInfra to contact you about this
      project. <Link to="/privacy">Privacy details</Link>
    </p>
  );
}

export function EnquiryHandoff({
  message,
  onEdit,
  title,
  opened = false,
}: {
  message: string;
  onEdit: () => void;
  title?: string;
  opened?: boolean;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <div className="lf-handoff" aria-live="polite">
      <span className="lf-ready">
        <MessageCircle size={18} /> WhatsApp enquiry
      </span>
      <h2 ref={heading} tabIndex={-1}>
        {title || (opened ? "Continue in WhatsApp" : "Your quote request is ready.")}
      </h2>
      <p>
        {opened
          ? "Your details are ready in a WhatsApp message. Press Send in WhatsApp so our team can respond."
          : "Open WhatsApp and press Send to share your details with our team."}
      </p>
      <div className="lf-send-buttons">
        <a
          className="button lf-whatsapp"
          href={whatsappRequestUrl(message)}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={19} /> {opened ? "Open WhatsApp again" : "Continue in WhatsApp"}
        </a>
      </div>
      <p className="lf-handoff-status">
        {opened ? "WhatsApp didn’t open? Use the button above. " : ""}
        This website cannot confirm whether your message has been sent.
      </p>
      <details className="lf-email-fallback">
        <summary>Prefer email?</summary>
        <a
          className="lx-underlink"
          href={
            "mailto:" +
            business.email +
            "?cc=" +
            encodeURIComponent(business.alternateEmail) +
            "&subject=" +
            encodeURIComponent("LuxeInfra interior quote request") +
            "&body=" +
            encodeURIComponent(message)
          }
        >
          <Mail size={16} /> Open email draft
        </a>
      </details>
      <details className="lf-message-preview">
        <summary>Review what you’re sharing</summary>
        <pre>{message}</pre>
      </details>
      <button type="button" className="lx-underlink" onClick={onEdit}>
        Edit my details
      </button>
      <small>
        You can attach room photos or a floor plan in WhatsApp. Files aren’t attached automatically.
      </small>
    </div>
  );
}
