import { festiveCampaignContext } from "./promotion.ts";

export const welcomeStorageKey = "luxeinfra-welcome-v1";
export const commercialSpaceTypes = ["Office", "Shop / showroom", "Hospitality"] as const;
export type CommercialSpaceType = (typeof commercialSpaceTypes)[number];

export function commercialSpaceType(value: unknown): CommercialSpaceType | "" {
  return typeof value === "string" && commercialSpaceTypes.includes(value as CommercialSpaceType)
    ? (value as CommercialSpaceType)
    : "";
}

export function welcomeProjectContext({
  project,
  configuration = "",
  commercial = "",
  campaign = "",
}: {
  project: string;
  configuration?: string;
  commercial?: string;
  campaign?: string;
}) {
  const festive = festiveCampaignContext(campaign);
  if (project === "Commercial space") {
    const type = commercialSpaceType(commercial);
    return (
      "Interested in: Commercial space" +
      (type ? "\nSpace type: " + type : "") +
      (festive ? "\n" + festive : "")
    );
  }
  return (
    "Interested in: " +
    project +
    (project === "Whole home" && configuration ? "\nHome type: " + configuration : "") +
    (festive ? "\n" + festive : "")
  );
}

export const welcomeInviteDelayMs = 10000;
export function welcomeIsTimely(elapsedMs: number, forced = false) {
  return forced || elapsedMs >= welcomeInviteDelayMs;
}
export function welcomeDelayRemaining(elapsedMs: number, forced = false) {
  return forced ? 800 : Math.max(0, welcomeInviteDelayMs - Math.max(0, elapsedMs));
}
const protectedJourneys = new Set([
  "/estimate",
  "/callback",
  "/plan",
  "/project-brief",
  "/reimagine",
  "/partner-with-us",
  "/privacy",
  "/contact",
  "/find-your-style",
  "/my-inspiration",
]);
export function welcomeIsEligible(pathname: string) {
  const path = pathname.replace(/\/+$/, "") || "/";
  return !protectedJourneys.has(path);
}
export function welcomeShouldOpen(
  pathname: string,
  seen: boolean,
  interacted: boolean,
  forced = false,
) {
  return welcomeIsEligible(pathname) && !interacted && (forced || !seen);
}
type WelcomeStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};
// The memory fallback avoids repeat interruptions when browser storage is unavailable.
export function createWelcomeTracker(storage?: WelcomeStorage) {
  let seen = false;
  return {
    hasSeen() {
      if (seen) return true;
      try {
        return storage?.getItem(welcomeStorageKey) === "seen";
      } catch {
        return false;
      }
    },
    markSeen() {
      seen = true;
      try {
        storage?.setItem(welcomeStorageKey, "seen");
      } catch {
        /* The memory fallback still works. */
      }
    },
  };
}
