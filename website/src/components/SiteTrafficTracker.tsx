import { useEffect } from "react";
import { trafficAuthNavigation, trafficPage, trafficSource } from "@/lib/traffic";
import { browserTrafficPreference, trafficOptedOut } from "@/lib/traffic-preference";

let capability: Promise<boolean> | null = null;
let lastCapturedPage = "";

function optedOut() {
  if (trafficAuthNavigation(window.location.search, window.location.hash)) return true;
  try {
    return trafficOptedOut(window.localStorage) || browserTrafficPreference(window.navigator);
  } catch {
    return trafficOptedOut() || browserTrafficPreference(window.navigator);
  }
}

function available() {
  capability ??= fetch("/api/traffic/status", {
    credentials: "omit",
    cache: "no-store",
    redirect: "error",
    referrerPolicy: "no-referrer",
    signal: AbortSignal.timeout(4000),
  })
    .then(async (response) => {
      if (!response.ok) return false;
      const result: unknown = await response.json();
      return Boolean(
        result && typeof result === "object" && "enabled" in result && result.enabled === true,
      );
    })
    .catch(() => false);
  return capability;
}

/** Fixed public page buckets only; never form values, queries, fragments or auth pages. */
export function SiteTrafficTracker({ pathname }: { pathname: string }) {
  useEffect(() => {
    const page = trafficPage(pathname);
    if (!page) {
      lastCapturedPage = "";
      return;
    }
    if (optedOut()) return;
    let active = true;
    void available()
      .then((enabled) => {
        if (!active || !enabled || optedOut() || page === lastCapturedPage) return;
        lastCapturedPage = page;
        // No cookie, visitor ID or persistent event identifier is written in the browser.
        void fetch("/api/traffic", {
          method: "POST",
          credentials: "omit",
          redirect: "error",
          referrerPolicy: "no-referrer",
          keepalive: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: crypto.randomUUID(),
            page,
            source: trafficSource(document.referrer, window.location.origin),
          }),
          signal: AbortSignal.timeout(6000),
        }).catch(() => {});
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [pathname]);
  return null;
}
