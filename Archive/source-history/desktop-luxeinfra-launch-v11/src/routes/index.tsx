import { StudioHome } from '@/components/StudioHome';
import { createFileRoute } from '@tanstack/react-router';
import { RouteErrorFallback, RouteNotFound } from '@/components/RouteError';
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Luxe Infra — Premium Interior Design & Home Interiors" },
      { name: "description", content: "Luxe Infra crafts modern, beautiful interiors — modular kitchens, wardrobes, full home interiors and more. Book a free design consultation." },
      { property: "og:title", content: "Luxe Infra — Premium Interior Design" },
      { property: "og:description", content: "End-to-end interior design for modern Indian homes." },
    ],
  }),
  component: StudioHome,
  errorComponent: ({ error, reset }) => <RouteErrorFallback error={error} reset={reset} />,
  notFoundComponent: () => <RouteNotFound />,
});


