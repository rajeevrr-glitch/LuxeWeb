import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RouteErrorFallback, RouteNotFound } from "@/components/RouteError";

export const Route = createFileRoute("/design-ideas")({
  component: () => <Outlet />,
  errorComponent: ({ error, reset }) => <RouteErrorFallback error={error} reset={reset} />,
  notFoundComponent: () => (
    <RouteNotFound
      title="Category not found"
      description="We couldn't find that design category."
    />
  ),
});
