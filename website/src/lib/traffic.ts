export const trafficPages = [
  "/",
  "/about",
  "/services",
  "/contact",
  "/privacy",
  "/how-it-works",
  "/design-ideas",
  "/projects",
  "/testimonials",
  "/find-your-style",
  "/materials",
  "/guides",
  "/guides/first-design-conversation",
  "/guides/compare-interior-quotes",
  "/guides/plan-your-kitchen",
  "/guides/renovation-priorities",
  "/plan",
  "/partner-with-us",
  "/estimate",
  "/callback",
  "/project-brief",
  "/offers",
  "/my-inspiration",
  "/reimagine",
  "/design-ideas/kitchen",
  "/design-ideas/living",
  "/design-ideas/bedroom",
  "/design-ideas/wardrobe",
  "/design-ideas/dining",
  "/design-ideas/bathroom",
  "/design-ideas/kids",
  "/design-ideas/office",
  "/design-ideas/pooja",
  "/design-ideas/foyer",
  "/design-ideas/full-home",
] as const;

export const trafficSources = [
  "direct",
  "google",
  "bing",
  "instagram",
  "facebook",
  "pinterest",
  "youtube",
  "linkedin",
  "referral",
] as const;
export const trafficDevices = ["desktop", "mobile", "tablet", "other"] as const;
export type TrafficSource = (typeof trafficSources)[number];
export type TrafficDevice = (typeof trafficDevices)[number];
export type TrafficPage = (typeof trafficPages)[number];

export interface TrafficReport {
  enabled: true;
  days: 7 | 30 | 90;
  timeZone: "Asia/Kolkata";
  asOf: string;
  from: string;
  through: string;
  summary: { pageViews: number; visitorDays: number; recentVisitors: number; leads: number };
  daily: { date: string; pageViews: number; visitorDays: number; leads: number }[];
  pages: { page: TrafficPage; pageViews: number }[];
  sources: { source: TrafficSource; pageViews: number }[];
  devices: { device: TrafficDevice; pageViews: number }[];
}

export function trafficPage(path: string): TrafficPage | null {
  const clean = path.length > 1 ? path.replace(/\/$/, "") : path;
  return trafficPages.includes(clean as TrafficPage) ? (clean as TrafficPage) : null;
}

export function trafficAuthNavigation(search: string, hash: string): boolean {
  const query = new URLSearchParams(search);
  const fragment = new URLSearchParams(hash.replace(/^#/, ""));
  return [query, fragment].some(
    (part) =>
      ["access_token", "refresh_token", "code", "error_code"].some((key) => part.has(key)) ||
      part.get("type") === "recovery",
  );
}

/** Only a small source bucket leaves this browser, never the referrer URL. */
export function trafficSource(referrer: string, ownOrigin: string): TrafficSource {
  if (!referrer) return "direct";
  try {
    const ref = new URL(referrer);
    if (!["http:", "https:"].includes(ref.protocol)) return "direct";
    if (ref.origin === ownOrigin) return "direct";
    const host = ref.hostname.toLowerCase();
    const belongs = (domain: string) => host === domain || host.endsWith("." + domain);
    if (["google.com", "google.co.in", "google.co.uk"].some(belongs)) return "google";
    if (belongs("bing.com")) return "bing";
    if (belongs("instagram.com")) return "instagram";
    if (["facebook.com", "fb.com", "fb.me"].some(belongs)) return "facebook";
    if (["pinterest.com", "pinterest.co.uk", "pinterest.in", "pin.it"].some(belongs))
      return "pinterest";
    if (["youtube.com", "youtu.be"].some(belongs)) return "youtube";
    if (belongs("linkedin.com")) return "linkedin";
    return "referral";
  } catch {
    return "direct";
  }
}
