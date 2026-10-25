import { test } from "node:test";
import assert from "node:assert/strict";
import { handleHostedRequest, protectHostedResponse } from "../src/lib/hosted-runtime.ts";

const production = { environment: "production" };
const request = (pathname, init) => new Request("https://luxeinfra.in" + pathname, init);

test("Hosted APIs fail closed without filesystem writes, provider calls or SSR fallthrough", async () => {
  for (const [pathname, expected] of [
    ["/api/luxe-chat/status", { enabled: false, provider: "gemini", mode: "website-guide" }],
    ["/api/enquiry-delivery/status", { enabled: false, channel: "whatsapp" }],
  ]) {
    const response = handleHostedRequest(request(pathname), production);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), expected);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
  }
  const visualiser = await handleHostedRequest(request("/api/visualiser/status")).json();
  assert.equal(visualiser.enabled, false);
  assert.equal(visualiser.captureAvailable, false);
  assert.equal(visualiser.remaining, 0);
  assert.equal(visualiser.providerLabel, "Gemini");
  for (const pathname of [
    "/api/luxe-chat",
    "/api/enquiry-delivery",
    "/api/visualiser/leads",
    "/api/visualiser/jobs",
    "/api/not-configured",
  ]) {
    const response = handleHostedRequest(request(pathname, { method: "POST", body: "private" }));
    assert.equal(response.status, 503, pathname);
    assert.match((await response.json()).error, /WhatsApp/);
    assert.equal(response.headers.get("location"), null);
  }
  for (const pathname of ["/api", "/api/missing", "/api/visualiser/jobs/previous-job"]) {
    const response = handleHostedRequest(request(pathname));
    assert.equal(response.status, 404);
    assert.match(response.headers.get("content-type"), /application\/json/);
  }
});

test("only the HTTPS canonical production host may advertise indexing", async () => {
  for (const [url, options] of [
    ["https://luxeinfra.in/robots.txt", {}],
    ["https://luxeinfra.in/robots.txt", { environment: "preview" }],
    ["https://luxeinfra.in/robots.txt", { environment: "development" }],
    ["http://luxeinfra.in/robots.txt", production],
    ["https://www.luxeinfra.in/robots.txt", production],
    ["https://luxeinfra.netlify.app/robots.txt", production],
    ["https://luxeinfra.in.attacker.example/robots.txt", production],
    ["https://luxeinfra.in/robots.txt", { ...production, productionOrigin: "https://evil.test" }],
  ]) {
    const response = handleHostedRequest(
      new Request(url, { headers: { "x-forwarded-host": "luxeinfra.in", host: "luxeinfra.in" } }),
      options,
    );
    assert.equal(await response.text(), "User-agent: *\nDisallow: /\n", url);
    assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow", url);
  }
  const response = handleHostedRequest(request("/robots.txt"), production);
  assert.match(
    await response.text(),
    /Allow: \/\nDisallow: \/api\/\nSitemap: https:\/\/luxeinfra.in/,
  );
  assert.equal(response.headers.get("x-robots-tag"), null);
});

test("sitemap contains public routes, not funnels, unapproved reviews or supplied hostnames", async () => {
  const response = handleHostedRequest(
    new Request("https://preview.netlify.app/sitemap.xml?host=evil.test"),
    production,
  );
  const xml = await response.text();
  assert.match(xml, /https:\/\/luxeinfra.in\/projects<\/loc>/);
  assert.match(xml, /https:\/\/luxeinfra.in\/design-ideas\/bedroom/);
  assert.match(xml, /https:\/\/luxeinfra.in\/guides\/compare-interior-quotes/);
  assert.doesNotMatch(
    xml,
    /evil\.test|preview\.netlify\.app|\/testimonials|\/callback|\/offers|\/api\//,
  );
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
});

test("source, secrets, hidden and ambiguous encoded paths never reach SSR", () => {
  for (const pathname of [
    "/.env.local",
    "/.private/room-enquiries/example.json",
    "/.git/config",
    "/.netlify/functions/server",
    "/.vercel/output/config.json",
    "/netlify.toml",
    "/netlify/functions/source.ts",
    "/src/server.ts",
    "/scripts/production-server.mjs",
    "/docs/OWNER-INPUTS.md",
    "/tests/hosted-runtime.test.mjs",
    "/workdone.md",
    "/AGENTS.md",
    "/package.json",
    "/node_modules/package/index.js",
    "/dist/server/server.js",
    "/assets/client.js.map",
    "/%252eprivate/record.json",
    "/%25252eenv.local",
    "/%2f.private/record.json",
    "/public%5c.private/record.json",
    "/%ZZ",
  ]) {
    const response = handleHostedRequest(request(pathname), production);
    assert.equal(response.status, 404, pathname);
    assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
  }
  for (const pathname of [
    "/",
    "/projects",
    "/assets/site.js",
    "/projects/project.webp",
    "/favicon.svg",
  ])
    assert.equal(handleHostedRequest(request(pathname), production), null, pathname);
});

test("HEAD never returns a body and method errors advertise the supported verbs", async () => {
  for (const pathname of [
    "/healthz",
    "/robots.txt",
    "/sitemap.xml",
    "/api/luxe-chat/status",
    "/api/missing",
  ])
    assert.equal(
      await handleHostedRequest(request(pathname, { method: "HEAD" })).text(),
      "",
      pathname,
    );
  for (const [pathname, method, allow] of [
    ["/api/luxe-chat/status", "POST", "GET, HEAD"],
    ["/api/enquiry-delivery", "GET", "POST"],
    ["/api/visualiser/jobs", "DELETE", "POST"],
    ["/api/missing", "PUT", "GET, HEAD, POST"],
    ["/callback", "POST", "GET, HEAD"],
    ["/healthz", "PATCH", "GET, HEAD"],
  ]) {
    const response = handleHostedRequest(request(pathname, { method }));
    assert.equal(response.status, 405, pathname + " " + method);
    assert.equal(response.headers.get("allow"), allow);
  }
  assert.equal(await handleHostedRequest(request("/healthz")).text(), "ok");
});

test("SSR wrapper preserves streams, errors and redirects while securing every response", async () => {
  const source = new Response("rendered content", {
    headers: { "Content-Type": "text/html", "Cache-Control": "public, max-age=86400" },
  });
  const page = protectHostedResponse(request("/projects"), source, production);
  assert.equal(await page.text(), "rendered content");
  assert.equal(page.headers.get("content-type"), "text/html");
  assert.equal(page.headers.get("cache-control"), "no-store");
  assert.equal(page.headers.get("x-content-type-options"), "nosniff");
  assert.equal(page.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.equal(page.headers.get("x-frame-options"), "DENY");
  assert.equal(page.headers.get("permissions-policy"), "camera=(), microphone=(), geolocation=()");
  assert.match(page.headers.get("content-security-policy"), /frame-ancestors 'none'/);
  assert.match(page.headers.get("content-security-policy"), /https:\/\/fonts\.googleapis\.com/);
  assert.equal(page.headers.get("x-robots-tag"), null);
  const redirect = protectHostedResponse(
    request("/callback?design=unknown"),
    new Response(null, { status: 307, headers: { Location: "/callback" } }),
  );
  assert.equal(redirect.status, 307);
  assert.equal(redirect.headers.get("location"), "/callback");
  assert.equal(redirect.headers.get("x-robots-tag"), "noindex, nofollow");
  for (const status of [404, 500]) {
    const response = protectHostedResponse(
      request("/missing"),
      new Response("missing", { status }),
      production,
    );
    assert.equal(response.status, status);
    assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
  }
  const head = protectHostedResponse(
    request("/", { method: "HEAD" }),
    new Response("body"),
    production,
  );
  assert.equal(await head.text(), "");
});

test("hosted responses keep streamed rendering and body-free statuses compatible with web runtimes", async () => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("<main>"));
      controller.enqueue(encoder.encode("LuxeInfra</main>"));
      controller.close();
    },
  });
  const rendered = protectHostedResponse(
    request("/"),
    new Response(stream, { headers: { "Content-Type": "text/html; charset=utf-8" } }),
    production,
  );
  assert.equal(await rendered.text(), "<main>LuxeInfra</main>");
  for (const status of [204, 205, 304]) {
    const response = protectHostedResponse(
      request("/"),
      new Response(null, { status }),
      production,
    );
    assert.equal(response.status, status);
    assert.equal(response.body, null);
    assert.equal(await response.text(), "");
  }
});
