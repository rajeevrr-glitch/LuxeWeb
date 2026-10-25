import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { publishedReviews } from "@/lib/owner-content";
import { ClientStories } from "@/components/ClientStories";

export const Route = createFileRoute("/testimonials")({
  head: () => ({
    meta: [
      { title: "Reviews & client stories — LuxeInfra" },
      { name: "robots", content: publishedReviews.length ? "index, follow" : "noindex, follow" },
    ],
  }),
  component: Testimonials,
});
function Testimonials() {
  return (
    <PageShell>
      <ClientStories kind="reviews" page />
    </PageShell>
  );
}
