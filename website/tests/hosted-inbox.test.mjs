import assert from "node:assert/strict";
import { test } from "node:test";
import { createHostedInbox } from "../src/lib/hosted-inbox.server.ts";

const site = "https://luxeinfra.in";
const env = {
  SUPABASE_URL: "https://aaaaaaaaaaaaaaaaaaaa.supabase.co",
  SUPABASE_SECRET_KEY: "sb_secret_" + "test".repeat(10),
  LUXE_LEADS_HMAC_SECRET: "ab".repeat(32),
  SITE_URL: site,
  LUXE_INBOX_ENABLED: "true",
};
const context = { environment: "production", runtime: { ip: "203.0.113.8" } };
const staff = {
  id: "12345678-1234-4123-8123-123456789abc",
  email: "sales@example.test",
  role: "owner",
  displayName: "Owner",
};
const entry = {
  id: "22345678-1234-4123-8123-123456789abc",
  reference: "LX-20261026-ABCDEF123456",
  createdAt: "2026-10-26T05:00:00Z",
  updatedAt: "2026-10-26T05:00:00Z",
  kind: "quote",
  name: "Internal test",
  phone: "+919000000000",
  city: "Noida",
  message: "Test brief",
  status: "new",
  notes: "",
  followUpAt: null,
};
const summary = { total: 1, new: 1, contacted: 0, qualified: 0, closed: 0, followUpsDue: 0 };

function request(
  path,
  { cookie = "", csrf, method = "GET", value, origin = site, headers = {}, base = site } = {},
) {
  return new Request(base + "/api/admin/" + path, {
    method,
    headers: {
      Cookie: cookie,
      ...(method !== "GET" ? { Origin: origin } : {}),
      ...(value !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(csrf ? { "X-Luxe-CSRF": csrf } : {}),
      ...headers,
    },
    ...(value !== undefined ? { body: JSON.stringify(value) } : {}),
  });
}

function setup(overrides = {}) {
  const calls = [];
  const state = {
    role: "owner",
    confirmed: true,
    denied: false,
    allowed: true,
    fail: "",
    invalidPassword: false,
    oversized: false,
    time: Date.parse("2026-10-26T06:00:00Z"),
    ...overrides,
  };
  const handler = createHostedInbox({
    env: { ...env, ...state.env },
    now: () => state.time,
    fetch: async (url, init) => {
      const path = new URL(url).pathname;
      const payload = init.body ? JSON.parse(init.body) : null;
      calls.push({ path, payload });
      assert.equal(init.headers.apikey, env.SUPABASE_SECRET_KEY);
      assert.equal(init.redirect, "error");
      assert.ok(init.signal);
      if (path === state.fail)
        return new Response("secret provider stack and credentials", { status: 500 });
      if (path === "/auth/v1/token") {
        assert.equal(init.headers.Authorization, undefined);
        if (state.invalidPassword)
          return Response.json({ privateError: "do not expose" }, { status: 400 });
        return Response.json({
          access_token: state.oversized ? "x".repeat(2800) : "test-access-token",
          refresh_token: "never-store-me",
          expires_in: 3600,
        });
      }
      if (path === "/auth/v1/user") {
        assert.equal(
          init.headers.Authorization,
          "Bearer " + (state.oversized ? "x".repeat(2800) : "test-access-token"),
        );
        return Response.json({
          id: staff.id,
          email: staff.email,
          ...(state.confirmed ? { email_confirmed_at: "2026-10-26T05:00:00Z" } : {}),
          app_metadata: { never: "return-this" },
        });
      }
      assert.equal(init.headers.Authorization, undefined);
      if (path.endsWith("luxe_inbox_login_attempt")) {
        assert.match(payload.p_ip_hash, /^[a-f0-9]{64}$/);
        assert.doesNotMatch(payload.p_ip_hash, /203\.0/);
        return state.allowed
          ? Response.json(true)
          : Response.json({ error: "private" }, { status: 429 });
      }
      if (path.endsWith("luxe_inbox_actor"))
        return state.denied
          ? Response.json({ error: "inactive" }, { status: 403 })
          : Response.json({ ...staff, role: state.role, privateColumn: "must not escape" });
      if (path.endsWith("luxe_inbox_list"))
        return Response.json({
          items: state.items ?? [{ ...entry, privateColumn: "hidden" }],
          page: payload.p_page,
          pageSize: 25,
          total: 1,
          summary,
          privateColumn: "hidden",
        });
      if (path.endsWith("luxe_inbox_update") || path.endsWith("luxe_inbox_lead"))
        return Response.json({
          ...entry,
          notes: payload.p_notes ?? entry.notes,
          privateColumn: "hidden",
        });
      if (path.endsWith("luxe_inbox_team"))
        return Response.json({ members: [{ ...staff, active: true }], audit: [] });
      if (path.endsWith("luxe_inbox_access"))
        return Response.json({ ...staff, role: "staff", active: payload.p_active });
      assert.fail("Unexpected provider request " + path);
    },
  });
  return { handler, state, calls };
}
async function login(handler, options = {}) {
  const response = await handler.handle(
    request("login", {
      method: "POST",
      value: { email: staff.email, password: "test-password" },
      ...options,
    }),
    context,
  );
  return {
    response,
    value: await response.json(),
    cookie: response.headers.get("set-cookie")?.split(";")[0] ?? "",
  };
}

test("inbox fails closed for invalid configuration, deployment contexts and forged IP headers", async () => {
  for (const override of [
    { LUXE_INBOX_ENABLED: "false" },
    { SUPABASE_SECRET_KEY: "publishable" },
    { LUXE_LEADS_HMAC_SECRET: "short" },
    { SITE_URL: "http://luxeinfra.in" },
  ]) {
    const { handler, calls } = setup({ env: override });
    assert.deepEqual(await (await handler.handle(request("session"), context)).json(), {
      enabled: false,
      authenticated: false,
    });
    assert.equal((await handler.handle(request("leads"), context)).status, 503);
    assert.equal(calls.length, 0);
  }
  const { handler, calls } = setup();
  for (const ctx of [
    { ...context, environment: "preview" },
    { ...context, runtime: {} },
    { ...context, runtime: { ip: "invalid" } },
    { ...context, environment: "local", runtime: { ip: "127.0.0.1" } },
  ]) {
    assert.equal(
      (
        await (
          await handler.handle(
            request("session", { headers: { "x-forwarded-for": "203.0.113.8" } }),
            ctx,
          )
        ).json()
      ).enabled,
      false,
    );
  }
  assert.equal(await handler.handle(new Request(site + "/api/enquiry-delivery"), context), null);
  assert.equal(calls.length, 0);
});

test("full Unicode enquiry pages remain readable while provider payloads and filters stay bounded", async () => {
  const items = Array.from({ length: 25 }, () => ({
    ...entry,
    message: "ह".repeat(10000),
    notes: "ह".repeat(4000),
  }));
  const { handler, state, calls } = setup({ items });
  const session = await login(handler);
  const response = await handler.handle(request("leads", { cookie: session.cookie }), context);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).items.length, 25);
  const before = calls.filter((call) => call.path.endsWith("luxe_inbox_list")).length;
  for (const suffix of ["?search=" + "a".repeat(101), "?page=401"])
    assert.equal(
      (await handler.handle(request("leads" + suffix, { cookie: session.cookie }), context)).status,
      400,
    );
  assert.equal(calls.filter((call) => call.path.endsWith("luxe_inbox_list")).length, before);
  state.items = [{ ...entry, message: "x".repeat(2 * 1024 * 1024 + 1) }];
  const oversized = await handler.handle(request("leads", { cookie: session.cookie }), context);
  assert.equal(oversized.status, 503);
  assert.doesNotMatch(await oversized.text(), /xxxx|sb_secret|test-access-token/);
});

test("login stores only a short-lived encrypted access cookie and returns a safe actor", async () => {
  const { handler, calls } = setup();
  const session = await login(handler);
  assert.equal(session.response.status, 200);
  assert.deepEqual(session.value.user, staff);
  assert.match(session.value.csrfToken, /^[a-f0-9]{64}$/);
  const cookie = session.response.headers.get("set-cookie");
  assert.match(cookie, /HttpOnly; Secure; SameSite=Strict; Path=\/api\/admin; Max-Age=1800$/);
  assert.doesNotMatch(cookie, /test-access-token|never-store-me|sales|test-password/);
  assert.ok(Buffer.byteLength(cookie) < 4000);
  assert.match(session.response.headers.get("cache-control"), /no-store/);
  assert.equal(session.response.headers.get("access-control-allow-origin"), null);
  assert.equal(calls[0].path, "/rest/v1/rpc/luxe_inbox_login_attempt");
  const check = await handler.handle(request("session", { cookie: session.cookie }), context);
  assert.deepEqual(await check.json(), session.value);
  assert.equal(
    check.headers.get("set-cookie"),
    null,
    "session reads do not extend absolute expiry",
  );
  assert.equal(calls.filter((call) => call.path.endsWith("luxe_inbox_actor")).length, 2);
});

test("tampered, duplicated and expired cookies never contact providers or expose access", async () => {
  const { handler, calls, state } = setup();
  const session = await login(handler);
  const before = calls.length;
  for (const cookie of [
    session.cookie + "changed",
    session.cookie + "; " + session.cookie,
    "__Secure-luxe_inbox_session=v1.bad",
    session.cookie.replace("v1.", "v2."),
  ]) {
    const result = await handler.handle(request("leads", { cookie }), context);
    assert.equal(result.status, 401);
    assert.match(result.headers.get("set-cookie"), /Max-Age=0/);
  }
  state.time += 30 * 60 * 1000;
  const expired = await handler.handle(request("session", { cookie: session.cookie }), context);
  assert.equal(expired.status, 401);
  assert.deepEqual(await expired.json(), { enabled: true, authenticated: false });
  assert.equal(calls.length, before);
});

test("same-origin and CSRF checks protect every mutation and no GET can log out", async () => {
  const { handler, calls } = setup();
  const session = await login(handler);
  const before = calls.length;
  for (const options of [
    { origin: "https://attacker.example" },
    { headers: { "sec-fetch-site": "cross-site" } },
  ]) {
    const result = await handler.handle(
      request("login", {
        method: "POST",
        value: { email: staff.email, password: "test-password" },
        ...options,
      }),
      context,
    );
    assert.equal(result.status, 403);
  }
  assert.equal(calls.length, before);
  for (const csrf of [undefined, "wrong", "a".repeat(65)])
    assert.equal(
      (
        await handler.handle(
          request("logout", { method: "POST", cookie: session.cookie, csrf }),
          context,
        )
      ).status,
      403,
    );
  assert.equal(
    (await handler.handle(request("logout", { cookie: session.cookie }), context)).status,
    405,
  );
  const result = await handler.handle(
    request("logout", { method: "POST", cookie: session.cookie, csrf: session.value.csrfToken }),
    context,
  );
  assert.equal(result.status, 200);
  assert.match(result.headers.get("set-cookie"), /Max-Age=0/);
});

test("nonstaff, revoked membership and unconfirmed users cannot retain inbox access", async () => {
  for (const state of [{ denied: true }, { confirmed: false }, { invalidPassword: true }]) {
    const { handler } = setup(state);
    const result = await login(handler);
    assert.equal(result.response.status, 401);
    assert.deepEqual(result.value, {
      error: "Sign-in failed. Check your details and approved access.",
    });
    assert.match(result.response.headers.get("set-cookie"), /Max-Age=0/);
  }
  const { handler, state } = setup();
  const session = await login(handler);
  state.denied = true;
  assert.equal(
    (await handler.handle(request("leads", { cookie: session.cookie }), context)).status,
    401,
  );
});

test("login quota precedes authentication and provider failures stay generic", async () => {
  const limited = setup({ allowed: false });
  const quota = await login(limited.handler);
  assert.equal(quota.response.status, 429);
  assert.equal(limited.calls.length, 1);
  assert.equal(quota.response.headers.get("retry-after"), "900");
  for (const path of ["/auth/v1/token", "/auth/v1/user", "/rest/v1/rpc/luxe_inbox_actor"]) {
    const { handler } = setup({ fail: path });
    const result = await login(handler);
    assert.equal(result.response.status, 503);
    assert.doesNotMatch(
      JSON.stringify(result.value),
      /credentials|sb_secret|stack|token|test-password/,
    );
  }
});

test("lead list, detail and updates use actor-scoped fixed RPCs and whitelist output", async () => {
  const { handler, calls } = setup();
  const session = await login(handler);
  const list = await handler.handle(
    request("leads?search=Noida&status=new&kind=quote&page=2", { cookie: session.cookie }),
    context,
  );
  assert.equal(list.status, 200);
  assert.deepEqual(await list.json(), { items: [entry], total: 1, page: 2, pageSize: 25, summary });
  assert.deepEqual(calls.at(-1).payload, {
    p_actor: staff.id,
    p_search: "Noida",
    p_status: "new",
    p_kind: "quote",
    p_page: 2,
  });
  assert.deepEqual(
    await (
      await handler.handle(request("leads/" + entry.id, { cookie: session.cookie }), context)
    ).json(),
    entry,
  );
  const result = await handler.handle(
    request("leads/" + entry.id, {
      cookie: session.cookie,
      csrf: session.value.csrfToken,
      method: "PATCH",
      value: {
        status: "new",
        notes: "Call tomorrow",
        followUpAt: null,
        expectedUpdatedAt: entry.updatedAt,
      },
    }),
    context,
  );
  assert.equal(result.status, 200);
  assert.equal((await result.json()).notes, "Call tomorrow");
  assert.deepEqual(calls.at(-1).payload, {
    p_actor: staff.id,
    p_id: entry.id,
    p_status: "new",
    p_notes: "Call tomorrow",
    p_follow_up_at: null,
    p_expected_updated_at: entry.updatedAt,
  });
  for (const path of [
    "leads?page=0",
    "leads?status=deleted",
    "leads?search=x&search=y",
    "leads?admin=true",
    "leads/not-a-uuid",
  ])
    assert.equal(
      (await handler.handle(request(path, { cookie: session.cookie }), context)).status,
      400,
    );
});

test("only owners may manage team access and arbitrary request fields are rejected", async () => {
  const { handler, state, calls } = setup();
  const session = await login(handler);
  state.role = "staff";
  assert.equal(
    (await handler.handle(request("team", { cookie: session.cookie }), context)).status,
    403,
  );
  assert.equal(
    calls.some((call) => call.path.endsWith("luxe_inbox_team")),
    false,
  );
  state.role = "owner";
  assert.equal(
    (await handler.handle(request("team", { cookie: session.cookie }), context)).status,
    200,
  );
  assert.equal(
    (
      await handler.handle(
        request("team", {
          method: "POST",
          cookie: session.cookie,
          csrf: session.value.csrfToken,
          value: { email: "staff@example.test", active: true, role: "owner" },
        }),
        context,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await handler.handle(
        request("team", {
          method: "POST",
          cookie: session.cookie,
          csrf: session.value.csrfToken,
          value: { email: "staff@example.test", active: true },
        }),
        context,
      )
    ).status,
    200,
  );
});

test("local development requires explicit opt-in and loopback origin plus trusted loopback IP", async () => {
  const localContext = { environment: "local", runtime: { ip: "127.0.0.1" } };
  const { handler } = setup({ env: { LUXE_INBOX_LOCAL: "true" } });
  const base = "http://127.0.0.1:3000";
  const response = await handler.handle(
    request("login", {
      base,
      origin: base,
      method: "POST",
      value: { email: staff.email, password: "test-password" },
    }),
    localContext,
  );
  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie"), /^luxe_inbox_local_session=/);
  assert.doesNotMatch(response.headers.get("set-cookie"), /Secure/);
  assert.equal(
    (
      await (
        await handler.handle(request("session", { base: "http://example.test:3000" }), localContext)
      ).json()
    ).enabled,
    false,
  );
  assert.equal(
    (
      await (
        await handler.handle(request("session", { base }), {
          ...localContext,
          runtime: { ip: "203.0.113.8" },
        })
      ).json()
    ).enabled,
    false,
  );
});

test("oversized cookies, malformed login bodies and unsupported media fail without leaking credentials", async () => {
  const oversized = setup({ oversized: true });
  const result = await login(oversized.handler);
  assert.equal(result.response.status, 503);
  assert.match(result.response.headers.get("set-cookie"), /Max-Age=0/);
  assert.equal(JSON.stringify(result.value).includes("x".repeat(100)), false);
  const { handler, calls } = setup();
  const invalidBodies = [
    { email: staff.email, password: "test-password", role: "owner" },
    { email: staff.email, password: "x".repeat(257) },
    { email: "not-an-email", password: "test-password" },
  ];
  for (const value of invalidBodies)
    assert.equal(
      (await handler.handle(request("login", { method: "POST", value }), context)).status,
      400,
    );
  assert.equal(
    (
      await handler.handle(
        request("login", {
          method: "POST",
          value: invalidBodies[0],
          headers: { "content-length": "5000" },
        }),
        context,
      )
    ).status,
    413,
  );
  assert.equal(
    (
      await handler.handle(
        request("login", {
          method: "POST",
          value: invalidBodies[0],
          headers: { "content-type": "text/plain" },
        }),
        context,
      )
    ).status,
    415,
  );
  assert.equal(calls.length, 0);
});

test("RPC conflicts and capacity errors preserve safe status codes while dropping provider details", async () => {
  let conflict = false;
  const base = setup();
  const conflictHandler = createHostedInbox({
    env,
    fetch: async (url, init) => {
      const pathname = new URL(url).pathname;
      if (pathname.endsWith("luxe_inbox_login_attempt")) return Response.json(true);
      if (pathname === "/auth/v1/token")
        return Response.json({ access_token: "test-access-token", expires_in: 3600 });
      if (pathname === "/auth/v1/user")
        return Response.json({ ...staff, email_confirmed_at: entry.createdAt });
      if (pathname.endsWith("luxe_inbox_actor")) return Response.json(staff);
      if (pathname.endsWith("luxe_inbox_update"))
        return Response.json(
          { error: "row details never shown", supplied: JSON.parse(init.body) },
          { status: conflict ? 429 : 409 },
        );
      assert.fail("Unexpected call");
    },
  });
  const session = await login(conflictHandler);
  for (const status of [409, 429]) {
    const result = await conflictHandler.handle(
      request("leads/" + entry.id, {
        method: "PATCH",
        cookie: session.cookie,
        csrf: session.value.csrfToken,
        value: {
          status: "new",
          notes: "Private note",
          followUpAt: null,
          expectedUpdatedAt: entry.updatedAt,
        },
      }),
      context,
    );
    assert.equal(result.status, status);
    assert.doesNotMatch(await result.text(), /row details|Private note|p_actor/);
    conflict = true;
  }
  assert.equal(base.calls.length, 0);
});
