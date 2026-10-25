import { StudioHome } from "@/components/StudioHome";
import { createFileRoute } from "@tanstack/react-router";
import { RouteErrorFallback, RouteNotFound } from "@/components/RouteError";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LuxeInfra — Interiors, considered. Personally yours." },
      {
        name: "description",
        content:
          "Explore kitchens, wardrobes and whole-home interiors with LuxeInfra. Discover your style and plan your scope in Uttar Pradesh, Delhi NCR and Bengaluru.",
      },
      { property: "og:title", content: "LuxeInfra — Interiors, considered." },
      {
        property: "og:description",
        content:
          "Thoughtful interiors, from one favourite room to your whole home. Explore your design direction and start a conversation.",
      },
    ],
  }),
  component: StudioHome,
  errorComponent: ({ error, reset }) => <RouteErrorFallback error={error} reset={reset} />,
  notFoundComponent: () => <RouteNotFound />,
});
