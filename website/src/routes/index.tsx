import { StudioHome } from "@/components/StudioHome";
import { createFileRoute } from "@tanstack/react-router";
import { RouteErrorFallback, RouteNotFound } from "@/components/RouteError";
import { serviceAreaSummary } from "@/lib/business";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LuxeInfra — Interiors, considered. Personally yours." },
      {
        name: "description",
        content: `Kitchens, wardrobes and whole-home interiors in ${serviceAreaSummary}. Explore designs and plan your space with LuxeInfra.`,
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
