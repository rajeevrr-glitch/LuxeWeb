import { campaignPreview } from "@/lib/campaigns";
import { business } from "@/lib/business";
import socialImage from "@/assets/hero-living.jpg";
import {
  Outlet,
  Link,
  createRootRoute,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import studioCss from "../studio.css?url";
import refinementCss from "../refinement.css?url";
import launchCss from "../launch.css?url";
import commerceCss from "../commerce.css?url";
import campaignsCss from "../campaigns.css?url";
import reviewsCss from "../reviews.css?url";
import salesCss from "../sales.css?url";
import welcomeCss from "../welcome.css?url";
import usabilityCss from "../usability.css?url";
import guidesCss from "../guides.css?url";
import decisionsCss from "../design-decisions.css?url";
import brandExperienceCss from "../brand-experience.css?url";

function pageUrl(pathname: string) {
  return new URL(pathname.replace(/\/+$/, "") || "/", business.siteUrl).href;
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: ({ matches }) => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "robots",
        content:
          import.meta.env.PROD &&
          !campaignPreview &&
          import.meta.env.VITE_CONTENT_PREVIEW !== "true"
            ? "index, follow"
            : "noindex, nofollow",
      },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "LuxeInfra — Considered Interiors" },
      {
        name: "description",
        content:
          "Thoughtful interiors in Uttar Pradesh, Delhi NCR, and Bengaluru. Plan your rooms, share inspiration, and request a tailored estimate.",
      },
      { name: "author", content: "LuxeInfra" },
      { property: "og:title", content: "LuxeInfra — Considered Interiors" },
      {
        property: "og:description",
        content:
          "Thoughtful interiors in Uttar Pradesh, Delhi NCR, and Bengaluru. Plan your rooms, share inspiration, and request a tailored estimate.",
      },
      { property: "og:type", content: "website" },
      {
        property: "og:url",
        content: pageUrl(matches.at(-1)?.pathname || "/"),
      },
      { property: "og:image", content: new URL(socialImage, business.siteUrl).href },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: new URL(socialImage, business.siteUrl).href },
      { name: "twitter:title", content: "LuxeInfra — Considered Interiors" },
      {
        name: "twitter:description",
        content:
          "Thoughtful interiors in Uttar Pradesh, Delhi NCR, and Bengaluru. Plan your rooms, share inspiration, and request a tailored estimate.",
      },
    ],
    links: [
      { rel: "canonical", href: pageUrl(matches.at(-1)?.pathname || "/") },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: studioCss },
      { rel: "stylesheet", href: refinementCss },
      { rel: "stylesheet", href: launchCss },
      { rel: "stylesheet", href: commerceCss },
      { rel: "stylesheet", href: campaignsCss },
      { rel: "stylesheet", href: reviewsCss },
      { rel: "stylesheet", href: salesCss },
      { rel: "stylesheet", href: welcomeCss },
      { rel: "stylesheet", href: usabilityCss },
      { rel: "stylesheet", href: guidesCss },
      { rel: "stylesheet", href: decisionsCss },
      { rel: "stylesheet", href: brandExperienceCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: Outlet,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
