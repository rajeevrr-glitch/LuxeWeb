import assert from "node:assert/strict";
import { test } from "node:test";
import { createHostedTraffic } from "../src/lib/hosted-traffic.server.ts";

const site = "https://luxeinfra.in";
const normalAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/145.0.0.0 Safari/537.36";
const env = {
  SUPABASE_URL: "https://aaaaaaaaaaaaaaaaaaaa.supabase.co",
  SUPABASE_SECRET_KEY: "sb_secret_" + "test".repeat(10),
  LUXE_LEADS_HMAC_SECRET: "ab".repeat(32),
  SITE_URL: site,
  LUXE_TRAFFIC_ENABLED: "true",
};
const context = { environment: "production", runtime: { ip: "203.0.113.8" } };
const event = { id: "12345678-1234-4123-8123-123456789abc", page: "/", source: "direct" };

function request({
  path = "/api/traffic",
  method = path === "/api/traffic/status" ? "GET" : "POST",
  value = method === "POST" ? event : undefined,
  base = site,
  origin = base,
  agent = normalAgent,
  headers = {},
} = {}) {
  return new Request(base + path, {
    method,
    headers: {
      "User-Agent": agent,
      ...(method === "POST" ? { Origin: origin, "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...(value === undefined ? {} : { body: JSON.stringify(value) }),
  });
}

function setup(overrides = {}) {
  const state = {
    time: Date.parse("2026-10-27T12:00:00Z"),
    providerStatus: 200,
    providerValue: { recorded: true },
    ...overrides,
  };
  const calls = [];
  const handler = createHostedTraffic({
    env: { ...env, ...state.env },
    now: () => state.time,
    fetch: async (url, init) => {
      assert.equal(url, env.SUPABASE_URL + "/rest/v1/rpc/luxe_traffic_capture");
      assert.equal(init.method, "POST");
      assert.equal(init.redirect, "error");
      assert.ok(init.signal);
      assert.equal(init.headers.apikey, env.SUPABASE_SECRET_KEY);
      assert.equal(init.headers.Authorization, undefined);
      assert.equal(init.headers.Cookie, undefined);
      const body = JSON.parse(init.body);
      calls.push(body);
      if (state.throwProvider) throw new Error("raw provider stack and secret");
      if (state.providerBody !== undefined)
        return new Response(state.providerBody, {
          status: state.providerStatus,
          headers: state.providerHeaders,
        });
      return Response.json(state.providerValue, {
        status: state.providerStatus,
        headers: state.providerHeaders,
      });
    },
  });
  return { handler, state, calls };
}

test("status is explicit and capture defaults off without production configuration and trusted IP", async () => {
  for (const variant of [
    { env: { LUXE_TRAFFIC_ENABLED: "false" } },
    { env: { LUXE_TRAFFIC_ENABLED: undefined } },
    { env: { SUPABASE_SECRET_KEY: "" } },
    { ctx: { environment: "local", runtime: { ip: "127.0.0.1" } }, base: "http://127.0.0.1:3000" },
    { ctx: { environment: "preview", runtime: context.runtime } },
    { ctx: { environment: "production", runtime: {} } },
    { ctx: { environment: "production", runtime: { ip: "invalid" } } },
    { base: "https://evil.example" },
  ]) {
    const s = setup({ env: variant.env });
    const settings = { base: variant.base, headers: { "X-Forwarded-For": context.runtime.ip } };
    const status = await s.handler.handle(
      request({ ...settings, path: "/api/traffic/status" }),
      variant.ctx ?? context,
    );
    assert.deepEqual(await status.json(), { enabled: false });
    const capture = await s.handler.handle(request(settings), variant.ctx ?? context);
    assert.equal(capture.status, 204);
    assert.equal(await capture.text(), "");
    assert.equal(s.calls.length, 0);
  }
});

test("status exposes only enablement, creates no cookies and makes no provider request", async () => {
  const s = setup();
  const status = await s.handler.handle(request({ path: "/api/traffic/status" }), context);
  assert.deepEqual(await status.json(), { enabled: true });
  assert.equal(status.headers.get("set-cookie"), null);
  assert.match(status.headers.get("cache-control"), /no-store/);
  assert.equal(s.calls.length, 0);
  assert.equal(await s.handler.handle(request({ path: "/api/unrelated" }), context), null);
});

test("DNT and Global Privacy Control suppress status and recording on the server", async () => {
  for (const headers of [{ DNT: "1" }, { "Sec-GPC": "1" }, { DNT: "1", "Sec-GPC": "1" }]) {
    const s = setup();
    const status = await s.handler.handle(
      request({ path: "/api/traffic/status", headers }),
      context,
    );
    assert.deepEqual(await status.json(), { enabled: false });
    const capture = await s.handler.handle(request({ headers }), context);
    assert.equal(capture.status, 204);
    assert.equal(s.calls.length, 0);
  }
});

test("only exact methods and same-origin JSON are accepted", async () => {
  const s = setup();
  for (const [settings, expected] of [
    [{ method: "GET" }, 405],
    [{ path: "/api/traffic/status", method: "POST" }, 405],
    [{ origin: "https://evil.example" }, 403],
    [{ headers: { "Sec-Fetch-Site": "cross-site" } }, 204],
    [{ headers: { "Content-Type": "text/plain" } }, 415],
    [{ path: "/api/traffic?private=ignored" }, 400],
    [{ path: "/api/traffic#private" }, 400],
  ])
    assert.equal((await s.handler.handle(request(settings), context)).status, expected);
  assert.equal(s.calls.length, 0);
});

test("capture strictly whitelists event fields, public canonical pages and source buckets", async () => {
  const s = setup();
  for (const value of [
    { ...event, id: "not-uuid" },
    { ...event, source: "https://google.com/private?q=contact" },
    { ...event, email: "private@example.test" },
    { ...event, consent: true },
    { id: event.id, page: "/" },
    [],
    null,
    ...[
      "/admin",
      "/reset-password",
      "/api/admin/leads",
      "/?email=private@example.test",
      "/#secret",
      "https://luxeinfra.in/",
      "//evil.example",
      "/unknown",
      "/%61dmin",
      "/./",
    ].map((page) => ({ ...event, page })),
  ])
    assert.equal((await s.handler.handle(request({ value }), context)).status, 400);
  assert.equal(s.calls.length, 0);
});

test("oversized declared and streamed request bodies are rejected without a provider call", async () => {
  const s = setup();
  const declared = await s.handler.handle(
    request({ headers: { "Content-Length": "5000" } }),
    context,
  );
  assert.equal(declared.status, 413);
  const oversized = await s.handler.handle(
    request({ value: { ...event, extra: "x".repeat(1500) } }),
    context,
  );
  assert.equal(oversized.status, 413);
  assert.equal(s.calls.length, 0);
});

test("capture forwards only normalized event buckets, a pseudonymous daily hash and bounded quota", async () => {
  const s = setup();
  const response = await s.handler.handle(
    request({
      value: { ...event, id: event.id.toUpperCase(), source: "google" },
      headers: {
        Cookie: "private=never-forward",
        Referer: "https://example.test/?email=private@example.test",
        "X-Forwarded-For": "192.0.2.20",
      },
    }),
    context,
  );
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(await response.text(), "");
  assert.equal(s.calls.length, 1);
  assert.deepEqual(Object.keys(s.calls[0]).sort(), [
    "p_daily_limit",
    "p_device",
    "p_id",
    "p_page",
    "p_source",
    "p_visitor_hash",
  ]);
  assert.deepEqual(
    { ...s.calls[0], p_visitor_hash: "masked" },
    {
      p_id: event.id,
      p_visitor_hash: "masked",
      p_page: "/",
      p_source: "google",
      p_device: "desktop",
      p_daily_limit: 10000,
    },
  );
  assert.match(s.calls[0].p_visitor_hash, /^[a-f0-9]{64}$/);
  const serialized = JSON.stringify(s.calls[0]);
  assert.ok(
    !serialized.includes(context.runtime.ip) &&
      !serialized.includes(normalAgent) &&
      !serialized.includes("private@example.test") &&
      !serialized.includes("192.0.2.20"),
  );
});

test("visitor hashes are stable within an IST day and rotate exactly at midnight IST", async () => {
  const s = setup({ time: Date.parse("2026-10-27T18:29:59Z") });
  await s.handler.handle(request(), context);
  await s.handler.handle(request({ headers: { "X-Forwarded-For": "192.0.2.222" } }), context);
  assert.equal(s.calls[0].p_visitor_hash, s.calls[1].p_visitor_hash);
  s.state.time += 1000;
  await s.handler.handle(request(), context);
  assert.notEqual(s.calls[0].p_visitor_hash, s.calls[2].p_visitor_hash);
  await s.handler.handle(request(), { ...context, runtime: { ip: "203.0.113.9" } });
  assert.notEqual(s.calls[2].p_visitor_hash, s.calls[3].p_visitor_hash);
});

test("only the bounded UA prefix affects the daily key", async () => {
  const s = setup();
  const common = normalAgent.padEnd(256, "x");
  await s.handler.handle(request({ agent: common + "private suffix one" }), context);
  await s.handler.handle(request({ agent: common + "private suffix two" }), context);
  assert.equal(s.calls[0].p_visitor_hash, s.calls[1].p_visitor_hash);
});

test("common crawlers, scripted clients and absent user agents are dropped", async () => {
  for (const agent of [
    "",
    "Googlebot/2.1",
    "BingCrawler",
    "Spider",
    "HeadlessChrome",
    "Lighthouse",
    "uptime monitor",
    "curl/8",
    "Wget/1",
    "Python-requests",
    "PostmanRuntime",
  ]) {
    const s = setup();
    assert.equal((await s.handler.handle(request({ agent }), context)).status, 204);
    assert.equal(s.calls.length, 0);
  }
});

test("device categories remain coarse and contain no actual browser or hardware details", async () => {
  const s = setup();
  for (const [agent, device] of [
    [normalAgent, "desktop"],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS) Mobile", "mobile"],
    ["Mozilla/5.0 (Linux; Android 14; Device) Mobile", "mobile"],
    ["Mozilla/5.0 (iPad; CPU OS)", "tablet"],
    ["Mozilla/5.0 (Linux; Android 14; Device)", "tablet"],
    ["Unidentified browser", "other"],
  ]) {
    await s.handler.handle(request({ agent }), context);
    assert.equal(s.calls.at(-1).p_device, device);
  }
});

test("configured daily budgets are bounded and invalid values disable capture", async () => {
  for (const [value, expected] of [
    ["5", 5],
    ["10000", 10000],
    ["99999", 10000],
  ]) {
    const s = setup({ env: { LUXE_TRAFFIC_DAILY_LIMIT: value } });
    await s.handler.handle(request(), context);
    assert.equal(s.calls[0].p_daily_limit, expected);
  }
  for (const value of ["0", "-1", "1.5", "nonsense", "1000000000", ""]) {
    const s = setup({ env: { LUXE_TRAFFIC_DAILY_LIMIT: value } });
    assert.equal((await s.handler.handle(request(), context)).status, 204);
    assert.equal(s.calls.length, 0);
  }
});

test("duplicates and quota rejection share the same no-content response and are never retried", async () => {
  for (const override of [{ providerValue: { recorded: false } }, { providerStatus: 429 }]) {
    const s = setup(override);
    const response = await s.handler.handle(request(), context);
    assert.equal(response.status, 204);
    assert.equal(await response.text(), "");
    assert.equal(s.calls.length, 1);
  }
});

test("provider output is bounded, validated and never exposed, including secrets in failures", async () => {
  for (const override of [
    { providerStatus: 500, providerBody: "raw provider secret" },
    { providerValue: { recorded: "true", privateData: "never expose" } },
    { providerBody: "malformed-json secret" },
    { providerBody: JSON.stringify({ recorded: true, extra: "x".repeat(5000) }) },
    { providerHeaders: { "Content-Length": "5000" } },
    { throwProvider: true },
  ]) {
    const s = setup(override);
    const response = await s.handler.handle(request(), context);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "Traffic recording is unavailable." });
    assert.equal(s.calls.length, 1);
  }
  const s = setup({ providerValue: { recorded: true, privateData: "never expose" } });
  assert.equal((await s.handler.handle(request(), context)).status, 204);
});
