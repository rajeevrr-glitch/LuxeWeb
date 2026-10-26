import assert from "node:assert/strict";
import { test } from "node:test";
import { createHostedInbox } from "../src/lib/hosted-inbox.server.ts";
import { createHostedRecovery } from "../src/lib/hosted-recovery.server.ts";

const site = "https://luxeinfra.in";
const env = {
  SUPABASE_URL: "https://aaaaaaaaaaaaaaaaaaaa.supabase.co",
  SUPABASE_SECRET_KEY: "sb_secret_" + "test".repeat(10),
  LUXE_LEADS_HMAC_SECRET: "ab".repeat(32),
  SITE_URL: site,
  LUXE_INBOX_ENABLED: "true",
};
const context = { environment: "production", runtime: { ip: "203.0.113.8" } };
const ownerId = "12345678-1234-4123-8123-123456789abc";
const secondId = "22345678-1234-4123-8123-123456789abc";
const ownerEmail = "sales@luxeinfra.in";
const initialTime = Date.parse("2026-10-27T06:00:00Z");
const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const token = (claims = {}) =>
  `${encode({ alg: "ES256", typ: "JWT" })}.${encode({ sub: ownerId, exp: initialTime / 1000 + 3600, ...claims })}.${"s".repeat(86)}`;

function request(path, options = {}) {
  const {
    method = path === "session" ? "GET" : "POST",
    value,
    cookie = "",
    csrf,
    base = site,
    origin = base,
    headers = {},
  } = options;
  return new Request(base + "/api/admin/recovery/" + path, {
    method,
    headers: {
      ...(method === "POST" ? { Origin: origin, "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...(csrf ? { "X-Luxe-CSRF": csrf } : {}),
      ...headers,
    },
    ...(value === undefined ? {} : { body: JSON.stringify(value) }),
  });
}

function setup(overrides = {}) {
  const state = {
    time: initialTime,
    role: "owner",
    email: ownerEmail,
    id: ownerId,
    actorId: ownerId,
    actorEmail: ownerEmail,
    confirmed: true,
    allowed: true,
    failPath: "",
    failStatus: 500,
    updatedId: ownerId,
    updatedEmail: ownerEmail,
    ...overrides,
  };
  const calls = [];
  const fetcher = async (url, init) => {
    const parsed = new URL(url);
    assert.equal(parsed.origin, env.SUPABASE_URL);
    assert.equal(init.redirect, "error");
    assert.ok(init.signal);
    assert.equal(init.headers.apikey, env.SUPABASE_SECRET_KEY);
    assert.notEqual(init.headers.Authorization, "Bearer " + env.SUPABASE_SECRET_KEY);
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({
      path: parsed.pathname,
      search: parsed.searchParams,
      method: init.method,
      headers: init.headers,
      body,
    });
    if (parsed.pathname === state.failPath)
      return new Response("raw provider secret password token", { status: state.failStatus });
    if (parsed.pathname.endsWith("luxe_inbox_login_attempt")) {
      assert.equal(init.headers.Authorization, undefined);
      assert.deepEqual(Object.keys(body), ["p_ip_hash"]);
      assert.match(body.p_ip_hash, /^[a-f0-9]{64}$/);
      return Response.json(state.allowed);
    }
    if (parsed.pathname === "/auth/v1/recover") {
      assert.equal(init.headers.Authorization, undefined);
      assert.equal(parsed.searchParams.get("redirect_to"), site + "/reset-password");
      assert.deepEqual(body, { email: ownerEmail });
      return Response.json({});
    }
    if (parsed.pathname === "/auth/v1/user") {
      assert.match(
        init.headers.Authorization,
        /^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
      );
      if (init.method === "PUT") {
        assert.deepEqual(Object.keys(body), ["password"]);
        return Response.json({ id: state.updatedId, email: state.updatedEmail, secret: "hidden" });
      }
      return Response.json({
        id: state.id,
        email: state.email,
        ...(state.confirmed ? { email_confirmed_at: "2026-10-26T01:00:00Z" } : {}),
        secret: "hidden",
      });
    }
    if (parsed.pathname.endsWith("luxe_inbox_actor")) {
      assert.equal(init.headers.Authorization, undefined);
      assert.deepEqual(body, { p_actor: state.id });
      return Response.json({
        id: state.actorId,
        email: state.actorEmail,
        role: state.role,
        displayName: "Owner",
        secret: "hidden",
      });
    }
    throw new Error("Unexpected provider request");
  };
  const handler = createHostedRecovery({
    env: { ...env, ...state.env },
    fetch: fetcher,
    now: () => state.time,
  });
  return { handler, state, calls, fetcher };
}

async function establish(testSetup, access = token(), options = {}) {
  const response = await testSetup.handler.handle(
    request("establish", { value: { accessToken: access }, ...options }),
    options.context ?? context,
  );
  assert.equal(response.status, 200);
  const session = await response.json();
  assert.deepEqual(Object.keys(session).sort(), ["authenticated", "csrfToken", "enabled"]);
  assert.match(session.csrfToken, /^[a-f0-9]{64}$/);
  return {
    cookie: response.headers.get("set-cookie").split(";")[0],
    csrf: session.csrfToken,
    response,
  };
}

test("recovery stays disabled without exact production origin, trusted IP and explicit inbox enablement", async () => {
  for (const variant of [
    { env: { LUXE_INBOX_ENABLED: "false" } },
    { env: { SUPABASE_SECRET_KEY: "" } },
    { ctx: { environment: "preview", runtime: context.runtime } },
    { ctx: { environment: "production", runtime: {} } },
    { ctx: { environment: "production", runtime: { ip: "forged" } } },
    { base: "https://untrusted.example" },
  ]) {
    const s = setup({ env: variant.env });
    const response = await s.handler.handle(
      request("session", { base: variant.base, headers: { "X-Forwarded-For": "203.0.113.8" } }),
      variant.ctx ?? context,
    );
    assert.deepEqual(await response.json(), { enabled: false, authenticated: false });
    assert.equal(s.calls.length, 0);
  }
  const s = setup();
  assert.equal(await s.handler.handle(new Request(site + "/api/admin/session"), context), null);
});

test("same-origin JSON and exact endpoint methods are enforced before provider access", async () => {
  const s = setup();
  for (const [req, expected] of [
    [request("request", { value: { email: ownerEmail }, origin: "https://evil.example" }), 403],
    [
      request("request", {
        value: { email: ownerEmail },
        headers: { "Sec-Fetch-Site": "cross-site" },
      }),
      403,
    ],
    [
      request("request", {
        value: { email: ownerEmail },
        headers: { "Content-Type": "text/plain" },
      }),
      415,
    ],
    [request("request", { method: "GET" }), 405],
    [request("session", { method: "POST" }), 405],
    [request("unknown"), 404],
  ])
    assert.equal((await s.handler.handle(req, context)).status, expected);
  assert.equal(s.calls.length, 0);
});

test("request sends only the fixed owner address, uses separate opaque IP/email limits and exact redirect", async () => {
  const s = setup();
  const response = await s.handler.handle(
    request("request", { value: { email: ownerEmail.toUpperCase() } }),
    context,
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { accepted: true });
  assert.equal(s.calls.length, 3);
  assert.notEqual(s.calls[0].body.p_ip_hash, s.calls[1].body.p_ip_hash);
  assert.ok(
    s.calls
      .slice(0, 2)
      .every(
        (call) =>
          !JSON.stringify(call.body).includes(ownerEmail) &&
          !JSON.stringify(call.body).includes(context.runtime.ip),
      ),
  );
  assert.equal(s.calls[2].path, "/auth/v1/recover");
});

test("unknown accounts, provider failures and throttling receive the same generic acknowledgement", async () => {
  for (const variant of [
    { email: "other@example.test" },
    { state: { allowed: false } },
    { state: { failPath: "/auth/v1/recover", failStatus: 429 } },
    { state: { failPath: "/rest/v1/rpc/luxe_inbox_login_attempt", failStatus: 500 } },
  ]) {
    const s = setup(variant.state);
    const response = await s.handler.handle(
      request("request", { value: { email: variant.email ?? ownerEmail } }),
      context,
    );
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { accepted: true });
    if (variant.email || variant.state?.allowed === false)
      assert.equal(
        s.calls.some((call) => call.path === "/auth/v1/recover"),
        false,
      );
  }
});

test("request rejects malformed email, unexpected fields and oversized body", async () => {
  const s = setup();
  for (const value of [
    { email: "not-mail" },
    { email: ownerEmail, next: "https://evil.example" },
    { email: "x".repeat(1500) },
  ]) {
    const response = await s.handler.handle(request("request", { value }), context);
    assert.ok([400, 413].includes(response.status));
  }
  assert.equal(s.calls.length, 0);
});

test("verified owner token becomes a short secure purpose cookie, never appears in JSON", async () => {
  const s = setup();
  const access = token();
  const { cookie, csrf, response } = await establish(s, access);
  assert.match(response.headers.get("set-cookie"), /^__Secure-luxe_recovery_session=v1\./);
  assert.match(
    response.headers.get("set-cookie"),
    /HttpOnly; Secure; SameSite=Strict; Path=\/api\/admin\/recovery; Max-Age=900/,
  );
  assert.ok(!cookie.includes(access));
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  const result = await s.handler.handle(request("session", { cookie }), context);
  assert.deepEqual(await result.json(), { enabled: true, authenticated: true, csrfToken: csrf });
  assert.equal(s.calls.filter((call) => call.path === "/auth/v1/user").length, 2);
});

test("owner identity, confirmed email, active role and token subject are checked server-side", async () => {
  for (const state of [
    { role: "staff" },
    { email: "other@example.test" },
    { actorEmail: "other@example.test" },
    { confirmed: false },
    { actorId: secondId },
    { id: secondId, actorId: secondId },
    { failPath: "/auth/v1/user", failStatus: 401 },
  ]) {
    const s = setup(state);
    const response = await s.handler.handle(
      request("establish", { value: { accessToken: token() } }),
      context,
    );
    assert.ok([401, 403].includes(response.status));
    assert.equal(
      s.calls.some((call) => call.method === "PUT"),
      false,
    );
  }
});

test("malformed, oversized and expired tokens never establish a cookie", async () => {
  for (const access of [
    "not-a-jwt",
    "x".repeat(3000),
    token({ exp: initialTime / 1000 - 1 }),
    token({ exp: "future" }),
  ]) {
    const s = setup();
    const response = await s.handler.handle(
      request("establish", { value: { accessToken: access } }),
      context,
    );
    assert.ok([400, 401].includes(response.status));
    assert.ok(
      !response.headers.get("set-cookie") ||
        response.headers.get("set-cookie").includes("Max-Age=0"),
    );
  }
  const s = setup({ allowed: false });
  assert.equal(
    (await s.handler.handle(request("establish", { value: { accessToken: token() } }), context))
      .status,
    429,
  );
  assert.equal(s.calls.length, 1);
});

test("session cookie lifetime is capped by verified JWT expiration", async () => {
  const s = setup();
  const session = await establish(s, token({ exp: initialTime / 1000 + 45 }));
  assert.match(session.response.headers.get("set-cookie"), /Max-Age=45/);
  s.state.time += 46_000;
  const calls = s.calls.length;
  const response = await s.handler.handle(request("session", session), context);
  assert.deepEqual(await response.json(), { enabled: true, authenticated: false });
  assert.equal(s.calls.length, calls);
});

test("tampered, duplicated, expired and inbox-purpose cookies cannot recover an owner password", async () => {
  const s = setup();
  const session = await establish(s);
  const inbox = createHostedInbox({ env, fetch: s.fetcher, now: () => s.state.time });
  const recoveryValue = session.cookie.split("=")[1];
  const inboxResult = await inbox.handle(
    new Request(site + "/api/admin/session", {
      headers: { Cookie: "__Secure-luxe_inbox_session=" + recoveryValue },
    }),
    context,
  );
  assert.equal((await inboxResult.json()).authenticated, false);
  for (const cookie of [
    session.cookie + "x",
    session.cookie + "; " + session.cookie,
    "__Secure-luxe_inbox_session=" + recoveryValue,
  ]) {
    const response = await s.handler.handle(request("session", { cookie }), context);
    assert.equal((await response.json()).authenticated, false);
  }
  s.state.time += 901_000;
  const expired = await s.handler.handle(request("session", session), context);
  assert.equal((await expired.json()).authenticated, false);
});

test("session revalidation catches owner revocation before a password mutation", async () => {
  const s = setup();
  const session = await establish(s);
  s.state.role = "staff";
  const response = await s.handler.handle(
    request("complete", { ...session, value: { password: "a unique safe passphrase" } }),
    context,
  );
  assert.equal(response.status, 403);
  assert.equal(
    s.calls.some((call) => call.method === "PUT"),
    false,
  );
});

test("password mutation requires recovery session, CSRF and bounded strong password", async () => {
  const s = setup();
  const session = await establish(s);
  assert.equal(
    (
      await s.handler.handle(
        request("complete", { value: { password: "a unique safe passphrase" } }),
        context,
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await s.handler.handle(
        request("complete", {
          cookie: session.cookie,
          value: { password: "a unique safe passphrase" },
        }),
        context,
      )
    ).status,
    403,
  );
  for (const value of [
    { password: "short" },
    { password: "x".repeat(129) },
    { password: "a unique\nsafe passphrase" },
    { password: "a unique safe passphrase", email: ownerEmail },
  ]) {
    assert.equal(
      (await s.handler.handle(request("complete", { ...session, value }), context)).status,
      400,
    );
  }
  assert.equal(
    s.calls.some((call) => call.method === "PUT"),
    false,
  );
});

test("completion updates the authenticated user only and clears recovery and inbox cookies without sign-in", async () => {
  const s = setup();
  const access = token();
  const session = await establish(s, access);
  const response = await s.handler.handle(
    request("complete", { ...session, value: { password: "a unique safe passphrase" } }),
    context,
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { complete: true });
  const cookies = response.headers.getSetCookie();
  assert.equal(cookies.length, 2);
  assert.ok(cookies.every((value) => value.includes("Max-Age=0")));
  assert.match(cookies[0], /^__Secure-luxe_recovery_session=/);
  assert.match(cookies[1], /^__Secure-luxe_inbox_session=/);
  const changes = s.calls.filter((call) => call.method === "PUT");
  assert.equal(changes.length, 1);
  assert.equal(changes[0].path, "/auth/v1/user");
  assert.equal(changes[0].headers.Authorization, "Bearer " + access);
  assert.equal(
    s.calls.some((call) => call.path.includes("/admin/users") || call.path.includes("/token")),
    false,
  );
});

test("provider update mismatch and raw provider errors are not reported as success or leaked", async () => {
  for (const overrides of [
    { updatedId: secondId },
    { updatedEmail: "other@example.test" },
    { failure: true },
  ]) {
    const s = setup(overrides);
    const session = await establish(s);
    if (overrides.failure) {
      s.state.failPath = "/auth/v1/user";
      s.state.failStatus = 500;
    }
    const response = await s.handler.handle(
      request("complete", { ...session, value: { password: "a unique safe passphrase" } }),
      context,
    );
    assert.equal(response.status, 503);
    const body = await response.text();
    assert.ok(
      !body.includes("raw provider") &&
        !body.includes(env.SUPABASE_SECRET_KEY) &&
        !body.includes("safe passphrase") &&
        !body.includes(token()),
    );
  }
});

test("local recovery requires explicit flag, loopback address and local runtime and clears both inbox cookie variants", async () => {
  const s = setup({ env: { LUXE_INBOX_LOCAL: "true" } });
  const local = { environment: "local", runtime: { ip: "127.0.0.1" } };
  const session = await establish(s, token(), { base: "http://127.0.0.1:3000", context: local });
  assert.match(session.cookie, /^luxe_recovery_local_session=/);
  assert.ok(!session.response.headers.get("set-cookie").includes(" Secure;"));
  const result = await s.handler.handle(
    request("complete", {
      ...session,
      base: "http://127.0.0.1:3000",
      value: { password: "a unique safe passphrase" },
    }),
    local,
  );
  assert.equal(result.status, 200);
  assert.equal(result.headers.getSetCookie().length, 3);
  const external = await s.handler.handle(request("session", { base: "http://127.0.0.1:3000" }), {
    ...local,
    runtime: { ip: "203.0.113.8" },
  });
  assert.equal((await external.json()).enabled, false);
});
