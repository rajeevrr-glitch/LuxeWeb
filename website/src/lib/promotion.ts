export type Promotion = {
  id: string;
  approved: boolean;
  percent: number;
  startsAt: string;
  endsAt: string;
  terms: string[];
  availability?: "scheduled" | "ongoing";
};

// Seasonal identity is independent of any bookable discount or unconfirmed terms.
export const diwaliCampaign = {
  id: "diwali-edit",
  name: "The Diwali Edit",
  headline: "This Diwali, light up the place you call home.",
  benefit: "15% off on all works + additional Diwali gifts",
  enquiryContext:
    "Campaign: The Diwali Edit — 15% off on all works + additional Diwali gifts. Please confirm the discounted amount and gift details in my written quotation.",
} as const;

export function festiveCampaignContext(value: unknown) {
  return value === diwaliCampaign.id ? diwaliCampaign.enquiryContext : "";
}

// A draft discount must never become a public promise through a production build.
export function promotionState(
  offer: Promotion,
  preview = false,
  now = new Date(),
): "live" | "preview" | "unavailable" {
  const start = Date.parse(offer.startsAt);
  const end = Date.parse(offer.endsAt);
  const approvedDetails =
    offer.approved &&
    offer.percent > 0 &&
    offer.percent <= 100 &&
    offer.terms.length > 0 &&
    offer.terms.every((term) => term.trim().length > 0);
  // An explicitly approved ongoing campaign has no invented booking deadline.
  // Scheduled offers continue to require valid dates and expire automatically.
  if (approvedDetails && offer.availability === "ongoing") return "live";
  const complete = approvedDetails && Number.isFinite(start) && Number.isFinite(end) && end > start;
  if (complete && now.getTime() >= start && now.getTime() < end) return "live";
  return preview ? "preview" : "unavailable";
}
