import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { RouteErrorFallback, RouteNotFound } from "./components/RouteError";

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: ({ error, reset }) => <RouteErrorFallback error={error} reset={reset} />,
    notFoundMode: "root",
    defaultNotFoundComponent: () => <RouteNotFound />,
  });

  return router;
};
