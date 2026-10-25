import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RouteErrorFallback, RouteNotFound } from "@/components/RouteError";

export const Route = createFileRoute("/guides")({
  component: () => <Outlet />,
  errorComponent: ({ error, reset }) => <RouteErrorFallback error={error} reset={reset} />,
  notFoundComponent: () => (
    <RouteNotFound
      title="Guide not found"
      description="Explore our planning guides for help with your next interior decision."
    />
  ),
});
