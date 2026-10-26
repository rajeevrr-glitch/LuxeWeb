// Read-only checks of the built release, without sending any customer messages.
import assert from "node:assert/strict";
import { access, readdir } from "node:fs/promises";
import path from "node:path";

const review = process.argv.includes("--review");
const netlify = process.argv.includes("--netlify");
const production = process.argv.includes("--production");
const outputRoot = "dist/client";
const entry = await import(
  netlify ? "../.netlify/v1/functions/server.mjs" : "../dist/server/server.js"
);
const handler = netlify ? { fetch: (request) => entry.default(request, {}) } : entry.default;
const routes = [
  "/",
  "/offers",
  "/partner-with-us",
  "/partner-with-us?role=careers",
  "/callback?offer=festive-15",
  "/estimate",
  "/estimate?configuration=2%20BHK",
  "/estimate?module=Wardrobes",
  "/callback?scope=Selected%20rooms&room=Master%20bedroom",
  "/callback?scope=Commercial%20space",
  "/callback?scope=Commercial%20space&commercial=Hospitality",
  "/callback?material=Greenpanel",
  "/callback?module=Kitchen&design=kitchen-1",
  "/callback?scope=unrecognised&design=unknown",
  "/plan",
  "/project-brief",
  "/design-ideas",
  "/design-ideas/kitchen",
  "/design-ideas/bedroom",
  "/materials",
  "/projects",
  "/my-inspiration",
  "/guides",
  "/guides/first-design-conversation",
  "/guides/compare-interior-quotes",
  "/guides/plan-your-kitchen",
  "/guides/renovation-priorities",
  "/how-it-works",
  "/reimagine",
  "/about",
  "/contact",
  "/privacy",
  "/testimonials",
];
const assets = new Set();
for (const route of routes) {
  let response = await handler.fetch(new Request("http://localhost" + route));
  if (route === "/callback?scope=unrecognised&design=unknown") {
    assert.equal(response.status, 307, "unknown design is removed from the URL");
    const destination = new URL(response.headers.get("location"), "http://localhost");
    assert.equal(destination.origin, "http://localhost");
    assert.equal(destination.pathname, "/callback");
    assert.equal(destination.searchParams.has("design"), false);
    response = await handler.fetch(new Request(destination));
  }
  assert.equal(response.status, 200, route);
  const html = (await response.text()).replace(/<!--[\s\S]*?-->/g, "");
  assert.doesNotMatch(html, /This page didn't load/);
  assert.match(html, /aria-label="Main navigation"/);
  assert.match(html, /href="\/reimagine"/);
  const whatsApp = html.match(/<a\b[^>]*class="luxe-whatsapp-float"[^>]*>/)?.[0] || "";
  assert.match(whatsApp, /href="https:\/\/wa.me\/919026271638"/, "floating WhatsApp: " + route);
  assert.match(whatsApp, /target="_blank"/);
  assert.match(whatsApp, /rel="noopener noreferrer"/);
  assert.match(whatsApp, /aria-label="Chat with LuxeInfra on WhatsApp/);
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, "one main heading: " + route);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  assert.equal(canonical?.[1], "https://luxeinfra.in" + route.split("?")[0], "canonical: " + route);
  assert.match(html, /property="og:image" content="https:\/\/luxeinfra.in\/assets\//);
  if (route === "/") {
    assert.doesNotMatch(html, /class="lw-launcher"/);
    assert.match(html, /Partner with LuxeInfra/);
    assert.match(html, /Our work and client reviews/);
    assert.match(html, /href="\/testimonials"/);
    assert.match(html, /href="\/projects"/);
    assert.doesNotMatch(html, /id="client-stories"|id="our-work"|src="\/projects\//);
    assert.equal(html.includes("Fictional sample · Not a client review"), false);
    assert.doesNotMatch(html, /Review draft · wording to confirm|Harsh Pal/);
    assert.match(html, /200\+ projects/);
    assert.match(html, /luxe-brand-logo/);
    assert.match(html, /lc-hero-editorial/);
    assert.doesNotMatch(html, /lc-hero-start|lc-interest|lc-commercial-intro/);
    assert.match(html, /Ask Luxe/);
    assert.match(html, /Diwali/);
    assert.match(html, /15% off/);
    assert.doesNotMatch(html.match(/<header[\s\S]*?<\/header>/)?.[0] || "", /Delhi NCR|Bengaluru/);
  }
  if (
    [
      "/estimate",
      "/callback?offer=festive-15",
      "/privacy",
      "/partner-with-us",
      "/plan",
      "/project-brief",
      "/reimagine",
    ].includes(route)
  )
    assert.doesNotMatch(html, /Open your home quote form/);
  if (route === "/offers") {
    assert.match(html, /15/);
    assert.match(html, /Diwali gifts/);
  }
  if (route === "/partner-with-us?role=careers") assert.match(html, /value="careers" selected/);
  if (route === "/callback?offer=festive-15") assert.match(html, /The Diwali Edit/);
  if (route === "/testimonials") {
    assert.match(html, /Every home has its people/);
    assert.doesNotMatch(
      html,
      /Local review preview|wording to confirm|draft reviews|Fictional sample/,
    );
    for (const name of [
      "Harsh Pal",
      "Tanishq Yadav",
      "Dharmendra Singh",
      "Gyanendra Rai",
      "Rajnikant Rai",
    ])
      assert.ok(html.includes(name));
    const reviewsSection = html.match(/<section\b[^>]*id="client-stories"[\s\S]*?<\/section>/)?.[0];
    assert.ok(reviewsSection, "dedicated reviews section");
    assert.doesNotMatch(reviewsSection, /<img\b|<video\b|\/projects\/|Photo pairing preview/);
    assert.match(reviewsSection, /href="\/projects"/);
    assert.match(reviewsSection, /6\+/);
    assert.match(reviewsSection, /200\+/);
    assert.doesNotMatch(reviewsSection, /named-stories-review|<blockquote/);
  }
  if (route === "/projects") {
    assert.match(html, /id="our-work"/);
    assert.equal((html.match(/src="\/projects\/[^"/]+-small\.webp"/g) || []).length, 11);
    assert.match(html, /id="harsh-pal-walkthrough"/);
    assert.match(html, /id="dharmendra-singh-walkthrough"/);
    assert.doesNotMatch(html, /Review draft · wording to confirm/);
  }
  if (route === "/guides") {
    for (const slug of [
      "first-design-conversation",
      "compare-interior-quotes",
      "plan-your-kitchen",
      "renovation-priorities",
    ])
      assert.ok(html.includes(`/guides/${slug}`), "discoverable guide: " + slug);
  }
  if (route === "/guides/compare-interior-quotes")
    assert.match(html, /\/how-it-works#quote-checklist/);
  if (route === "/guides/plan-your-kitchen") assert.match(html, /scope=Kitchen/);
  if (route === "/estimate") {
    assert.match(html, /What kind of home is yours/);
    assert.match(html, /1 RK/);
    assert.doesNotMatch(html, /autoComplete="(?:name|tel)"/i);
    assert.match(html, /does not give an instant price/);
    assert.match(html, /STEP 1 OF 3/);
    assert.match(html, /Room collections/);
  }
  if (route === "/estimate?configuration=2%20BHK") {
    assert.match(html, /Up to 800 sq ft/);
    assert.match(html, /Above 800 sq ft/);
    assert.match(html, /Not sure yet/);
  }
  if (route === "/estimate?module=Wardrobes") {
    assert.match(html, /Choose one, or bring both together/);
    assert.doesNotMatch(html, /Your home type/);
  }
  if (route === "/callback?scope=Selected%20rooms&room=Master%20bedroom") {
    assert.match(html, /Master bedroom/);
    assert.match(html, /autoComplete="name"/i);
    assert.doesNotMatch(html, /What are you planning/);
  }
  if (route === "/callback?scope=Commercial%20space") {
    assert.match(html, /Hospitality/);
    assert.match(html, /Office/);
    assert.match(html, /Shop/);
    assert.doesNotMatch(html, /autoComplete="name"/i);
  }
  if (route === "/callback?scope=Commercial%20space&commercial=Hospitality") {
    assert.match(html, /Hospitality/);
    assert.match(html, /autoComplete="name"/i);
    assert.doesNotMatch(html, /Where is your home/);
  }
  if (route === "/callback?material=Greenpanel") assert.match(html, /Greenpanel/);
  if (route === "/materials") {
    for (const brand of [
      "Greenply",
      "Greenpanel",
      "Hitachi",
      "Samsung",
      "Hettich",
      "Jaquar",
      "CenturyPly",
      "Bosch",
      "Asian Paints",
      "Godrej",
    ])
      assert.ok(html.includes(brand), "brand visible: " + brand);
    for (const match of html.matchAll(/src="(\/brands\/[^"?#]+)"/g))
      await access(path.join(outputRoot, decodeURIComponent(match[1])));
  }
  if (route === "/callback?module=Kitchen&design=kitchen-1") {
    assert.match(html, /Design reference included/);
    assert.match(html, /autoComplete="name"/i);
  }
  if (route === "/callback?scope=unrecognised&design=unknown") {
    assert.match(html, /What are you planning/);
    assert.doesNotMatch(html, /Design reference included/);
  }
  for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)[^"\s]*"/g))
    assets.add(match[1]);
}
const admin = await handler.fetch(new Request("http://localhost/admin"));
assert.equal(admin.status, 200, "private workspace shell");
const adminHtml = await admin.text();
assert.match(adminHtml, /name="robots" content="noindex, nofollow, noarchive"/);
assert.match(adminHtml, /li-login-shell/);
assert.doesNotMatch(
  adminHtml,
  /aria-label="Main navigation"|luxe-whatsapp-float|lw-launcher|LX-\d{8}-[A-F0-9]{12}/,
  "private workspace has no public popup/navigation or server-rendered enquiry data",
);
if (netlify) assert.equal(admin.headers.get("x-robots-tag"), "noindex, nofollow");
for (const match of adminHtml.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)[^"\s]*"/g))
  assets.add(match[1]);
const recovery = await handler.fetch(new Request("http://localhost/reset-password"));
assert.equal(recovery.status, 200, "private password reset shell");
const recoveryHtml = await recovery.text();
assert.match(recoveryHtml, /name="robots" content="noindex, nofollow, noarchive"/);
assert.match(recoveryHtml, /li-recovery/);
assert.doesNotMatch(
  recoveryHtml,
  /aria-label="Main navigation"|luxe-whatsapp-float|lw-launcher|LX-\d{8}-[A-F0-9]{12}/,
);
if (netlify) {
  assert.equal(recovery.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.equal(recovery.headers.get("referrer-policy"), "no-referrer");
}
for (const match of recoveryHtml.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)[^"\s]*"/g))
  assets.add(match[1]);
for (const asset of assets) await access(path.join(outputRoot, decodeURIComponent(asset)));
assert.equal((await handler.fetch(new Request("http://localhost/not-a-real-page"))).status, 404);
assert.equal((await handler.fetch(new Request("http://localhost/guides/not-a-guide"))).status, 404);
if (netlify) {
  assert.equal(entry.config.path, "/*");
  assert.equal(entry.config.preferStatic, true);
  assert.match(entry.config.generator, /@netlify\/vite-plugin@/);
  for (const entry of await readdir(outputRoot))
    assert.ok(
      ["assets", "brands", "projects", "favicon.svg"].includes(entry),
      "public file: " + entry,
    );
  for (const pathname of [
    "/api/luxe-chat/status",
    "/api/enquiry-delivery/status",
    "/api/visualiser/status",
  ]) {
    const response = await handler.fetch(new Request("https://preview.netlify.app" + pathname));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal((await response.json()).enabled, false);
  }
  const blocked = await handler.fetch(new Request("https://preview.netlify.app/.env.local"));
  assert.equal(blocked.status, 404);
  const inboxSession = await handler.fetch(
    new Request("https://preview.netlify.app/api/admin/session"),
  );
  assert.deepEqual(await inboxSession.json(), { enabled: false, authenticated: false });
  assert.match(inboxSession.headers.get("cache-control"), /no-store/);
  const robots = await handler.fetch(new Request("https://preview.netlify.app/robots.txt"));
  assert.equal(await robots.text(), "User-agent: *\nDisallow: /\n");
  assert.equal(robots.headers.get("x-robots-tag"), "noindex, nofollow");
  const canonicalRobots = await handler.fetch(new Request("https://luxeinfra.in/robots.txt"));
  const canonicalRobotsText = await canonicalRobots.text();
  assert.equal(canonicalRobotsText.includes("Allow: /\n"), production);
  assert.equal(canonicalRobots.headers.has("x-robots-tag"), !production);
  const head = await handler.fetch(
    new Request("https://preview.netlify.app/healthz", { method: "HEAD" }),
  );
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
}
console.log(
  JSON.stringify({
    mode: review ? "review" : "public",
    target: netlify ? "netlify" : "node",
    routes: routes.length,
    privateInboxShell: "passed",
    privateRecoveryShell: "passed",
    builtAssets: assets.size,
    offerGate: "passed",
    partnerDeepLink: "passed",
    missingPage: 404,
  }),
);
