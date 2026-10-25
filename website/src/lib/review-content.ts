import type { ClientReview } from "./owner-content";

type ReviewCard = {
  id: string;
  title: string;
  quote: string;
  scope: string;
  byline: string;
  location?: string;
};
export function selectReviewContent(reviews: ClientReview[]): {
  mode: "approved" | "empty";
  cards: ReviewCard[];
} {
  const approved = reviews.filter(
    (r) => r.approved && r.publicationConsent && r.name.trim() && r.quote.trim(),
  );
  if (approved.length)
    return {
      mode: "approved",
      cards: approved.map((r) => ({
        id: r.id,
        title: r.scope || "At home with LuxeInfra",
        quote: r.quote,
        scope: r.scope,
        byline: r.name,
        location: r.city,
      })),
    };
  return { mode: "empty", cards: [] };
}
