import assert from "node:assert/strict";
import { test } from "node:test";
import { createHostedInbox } from "../src/lib/hosted-inbox.server.ts";
import { trafficPages, trafficSources, trafficDevices } from "../src/lib/traffic.ts";

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
const assignee = {
  id: "62345678-1234-4123-8123-123456789abc",
  displayName: "Studio coordinator",
  active: true,
};
const workflowCounts = { today: 1, overdue: 0, unscheduled: 0, unassigned: 0, mine: 0 };
const workflowMetadata = {
  enabled: true,
  canAssign: true,
  assignees: [{ id: assignee.id, displayName: assignee.displayName, role: "staff" }],
  counts: workflowCounts,
  asOf: "2026-10-27T06:00:00Z",
  timeZone: "Asia/Kolkata",
};
const notificationSummary = {
  pending: 1,
  retrying: 1,
  accepted: 0,
  failed: 0,
  needsReview: 0,
  expired: 0,
};
const notification = {
  id: "32345678-1234-4123-8123-123456789abc",
  reference: entry.reference,
  state: "leased",
  attempts: 1,
  createdAt: entry.createdAt,
  updatedAt: entry.updatedAt,
  nextAttemptAt: null,
  lastErrorCode: null,
  providerId: null,
};

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
    notifications: { summary: notificationSummary, items: [notification] },
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
      if (path.endsWith("luxe_inbox_work_list"))
        return Response.json(
          Object.hasOwn(state, "workList")
            ? state.workList
            : {
                items: state.items ?? [{ ...entry, assignedTo: assignee, privateColumn: "hidden" }],
                page: payload.p_page,
                pageSize: 25,
                total: 1,
                summary,
                workflow: { ...workflowMetadata, canAssign: state.role === "owner" },
                privateColumn: "hidden",
              },
        );
      if (path.endsWith("luxe_inbox_work_update")) {
        if (state.workUpdateStatus)
          return Response.json(
            { diagnostic: "Private assignment conflict", supplied: payload },
            { status: state.workUpdateStatus },
          );
        return Response.json(
          Object.hasOwn(state, "leadResult")
            ? state.leadResult
            : {
                ...entry,
                notes: payload.p_notes,
                assignedTo: payload.p_change_assignee
                  ? payload.p_assigned_to === null
                    ? null
                    : { ...assignee, id: payload.p_assigned_to }
                  : assignee,
                privateColumn: "hidden",
              },
        );
      }
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
        return Response.json(
          Object.hasOwn(state, "leadResult")
            ? state.leadResult
            : {
                ...entry,
                notes: payload.p_notes ?? entry.notes,
                assignedTo: assignee,
                privateColumn: "hidden",
              },
        );
      if (path.endsWith("luxe_inbox_team"))
        return Response.json({ members: [{ ...staff, active: true }], audit: [] });
      if (path.endsWith("luxe_inbox_access"))
        return Response.json({ ...staff, role: "staff", active: payload.p_active });
      if (path.endsWith("luxe_inbox_notifications")) return Response.json(state.notifications);
      if (path.endsWith("luxe_inbox_traffic"))
        return Response.json(state.traffic ?? trafficFixture(payload.p_days));
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

function trafficFixture(days = 7) {
  const through = "2026-10-27";
  const daily = Array.from({ length: days }, (_, index) => ({
    date: new Date(Date.parse(through + "T00:00:00Z") - (days - index - 1) * 86400000)
      .toISOString()
      .slice(0, 10),
    pageViews: index === days - 1 ? 2 : 0,
    visitorDays: index === days - 1 ? 1 : 0,
    leads: index === days - 1 ? 1 : 0,
  }));
  return {
    enabled: true,
    days,
    timeZone: "Asia/Kolkata",
    asOf: "2026-10-27T06:00:00Z",
    from: daily[0].date,
    through,
    summary: { pageViews: 2, visitorDays: 1, recentVisitors: 1, leads: 1 },
    daily,
    pages: trafficPages.map((page, index) => ({ page, pageViews: index === 0 ? 2 : 0 })),
    sources: trafficSources.map((source, index) => ({ source, pageViews: index === 0 ? 2 : 0 })),
    devices: trafficDevices.map((device, index) => ({ device, pageViews: index === 0 ? 2 : 0 })),
  };
}

test("traffic aggregates remain private, owner-only and disabled unless configured", async () => {
  const enabled = setup({ env: { LUXE_TRAFFIC_ENABLED: "true" } });
  assert.equal((await enabled.handler.handle(request("traffic"), context)).status, 401);
  const staffOnly = setup({ role: "staff", env: { LUXE_TRAFFIC_ENABLED: "true" } });
  const signed = await login(staffOnly.handler);
  assert.equal(
    (await staffOnly.handler.handle(request("traffic", { cookie: signed.cookie }), context)).status,
    403,
  );
  assert.equal(
    staffOnly.calls.some((c) => c.path.endsWith("luxe_inbox_traffic")),
    false,
  );
  const off = setup();
  const owner = await login(off.handler);
  const result = await off.handler.handle(request("traffic", { cookie: owner.cookie }), context);
  assert.deepEqual(await result.json(), { enabled: false });
  assert.equal(
    off.calls.some((c) => c.path.endsWith("luxe_inbox_traffic")),
    false,
  );
});

test("owner traffic periods call only the aggregate RPC and strip unknown private fields", async () => {
  const server = setup({ env: { LUXE_TRAFFIC_ENABLED: "true" } }),
    owner = await login(server.handler);
  for (const days of [7, 30, 90]) {
    const fixture = trafficFixture(days);
    server.state.traffic = {
      ...fixture,
      visitorHash: "private daily identifier",
      customerEmail: "private@example.test",
    };
    const response = await server.handler.handle(
      request("traffic?days=" + days, { cookie: owner.cookie }),
      context,
    );
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), fixture);
    const call = server.calls.at(-1);
    assert.ok(call.path.endsWith("luxe_inbox_traffic"));
    assert.deepEqual(call.payload, { p_actor: staff.id, p_days: days });
  }
});

test("traffic report periods and methods cannot turn the owner view into an arbitrary query", async () => {
  const server = setup({ env: { LUXE_TRAFFIC_ENABLED: "true" } }),
    owner = await login(server.handler);
  for (const suffix of ["?days=1", "?days=07", "?days=7&days=30", "?days=7&actor=private"])
    assert.equal(
      (await server.handler.handle(request("traffic" + suffix, { cookie: owner.cookie }), context))
        .status,
      400,
    );
  const mutation = await server.handler.handle(
    request("traffic", {
      cookie: owner.cookie,
      csrf: owner.value.csrfToken,
      method: "POST",
      value: {},
    }),
    context,
  );
  assert.equal(mutation.status, 405);
  assert.equal(
    server.calls.some((c) => c.path.endsWith("luxe_inbox_traffic")),
    false,
  );
});

test("malformed report, provider errors and invalid collection settings fail closed", async () => {
  const server = setup({
      env: { LUXE_TRAFFIC_ENABLED: "true" },
      traffic: { ...trafficFixture(), pages: [{ page: "/admin?token=private", pageViews: 2 }] },
    }),
    owner = await login(server.handler);
  let response = await server.handler.handle(request("traffic", { cookie: owner.cookie }), context);
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /token=private|visitorHash|private@example/);
  server.state.fail = "/rest/v1/rpc/luxe_inbox_traffic";
  response = await server.handler.handle(request("traffic", { cookie: owner.cookie }), context);
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /secret|credentials|stack/);
  const broken = setup({
      env: { LUXE_TRAFFIC_ENABLED: "true", LUXE_TRAFFIC_DAILY_LIMIT: "invalid" },
    }),
    signed = await login(broken.handler);
  assert.equal(
    (await broken.handler.handle(request("traffic", { cookie: signed.cookie }), context)).status,
    503,
  );
  assert.equal(
    broken.calls.some((c) => c.path.endsWith("luxe_inbox_traffic")),
    false,
  );
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

test("email activity requires owner access and only supports reads", async () => {
  const { handler, state, calls } = setup();
  assert.equal((await handler.handle(request("notifications"), context)).status, 401);
  assert.equal(calls.length, 0, "signed-out requests must not contact the provider");
  const session = await login(handler);
  state.role = "staff";
  assert.equal(
    (await handler.handle(request("notifications", { cookie: session.cookie }), context)).status,
    403,
  );
  state.role = "owner";
  const mutation = await handler.handle(
    request("notifications", {
      method: "POST",
      cookie: session.cookie,
      csrf: session.value.csrfToken,
      value: {},
    }),
    context,
  );
  assert.equal(mutation.status, 405);
  assert.equal(mutation.headers.get("allow"), "GET");
  assert.equal(
    calls.some((call) => call.path.endsWith("luxe_inbox_notifications")),
    false,
    "staff and mutation requests must not read the notification queue",
  );
});

test("owner email activity preserves processing states while whitelisting metadata and configuration", async () => {
  const resendKey = "re_" + "mock-private-key".repeat(3);
  const retry = {
    ...notification,
    id: "42345678-1234-4123-8123-123456789abc",
    state: "retry",
    attempts: 2,
    nextAttemptAt: "2026-10-26T06:05:00Z",
    lastErrorCode: "provider_rate_limit",
    providerId: "52345678-1234-4123-8123-123456789abc",
  };
  const { handler, calls } = setup({
    env: {
      LUXE_LEADS_ENABLED: "true",
      LUXE_EMAIL_ALERTS_ENABLED: "true",
      LUXE_EMAIL_FROM: "LuxeInfra <leads@alerts.luxeinfra.in>",
      RESEND_API_KEY: resendKey,
    },
    notifications: {
      summary: { ...notificationSummary, privateKey: env.SUPABASE_SECRET_KEY },
      items: [
        {
          ...notification,
          name: "Customer identity never exposed",
          phone: entry.phone,
          message: "Customer message never exposed",
          payload: { apiKey: resendKey },
        },
        { ...retry, providerResponse: "Private provider diagnostic" },
      ],
      apiKey: resendKey,
      notificationBody: "Private email content",
    },
  });
  const session = await login(handler);
  const response = await handler.handle(
    request("notifications", { cookie: session.cookie }),
    context,
  );
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control"), /no-store/);
  const value = await response.json();
  assert.deepEqual(value, {
    configuration: {
      enabled: true,
      ready: true,
      provider: "resend",
      sender: "LuxeInfra <leads@alerts.luxeinfra.in>",
      recipients: ["sales@luxeinfra.in", "infoluxeinfra@gmail.com"],
    },
    summary: notificationSummary,
    items: [notification, retry],
  });
  assert.deepEqual(calls.at(-1), {
    path: "/rest/v1/rpc/luxe_inbox_notifications",
    payload: { p_actor: staff.id },
  });
  const output = JSON.stringify(value);
  for (const secret of [env.SUPABASE_SECRET_KEY, env.LUXE_LEADS_HMAC_SECRET, resendKey])
    assert.equal(output.includes(secret), false);
  assert.doesNotMatch(
    output,
    /Customer identity|Customer message|Private provider|Private email|notificationBody|test-access-token/,
  );
  assert.equal(output.includes(entry.phone), false);
});

test("disabled or incomplete email configuration remains separate from persisted queue activity", async () => {
  for (const emailEnvironment of [
    { LUXE_EMAIL_ALERTS_ENABLED: "false" },
    {
      LUXE_EMAIL_ALERTS_ENABLED: "true",
      LUXE_EMAIL_FROM: "Private invalid sender\r\nBcc: not-public@example.test",
      RESEND_API_KEY: "not-a-valid-private-key",
    },
  ]) {
    const { handler } = setup({ env: { LUXE_LEADS_ENABLED: "true", ...emailEnvironment } });
    const session = await login(handler);
    const result = await handler.handle(
      request("notifications", { cookie: session.cookie }),
      context,
    );
    assert.equal(result.status, 200);
    const value = await result.json();
    assert.equal(
      value.configuration.enabled,
      emailEnvironment.LUXE_EMAIL_ALERTS_ENABLED === "true",
    );
    assert.equal(value.configuration.ready, false);
    assert.equal(value.configuration.sender, null);
    assert.deepEqual(value.summary, notificationSummary);
    assert.deepEqual(value.items, [notification]);
    assert.doesNotMatch(
      JSON.stringify(value),
      /Private invalid|Bcc|not-public|not-a-valid-private-key/,
    );
  }
});

test("malformed email queue responses and provider failures fail closed without diagnostic leakage", async () => {
  const valid = { summary: notificationSummary, items: [notification] };
  for (const notifications of [
    null,
    { ...valid, summary: { ...notificationSummary, pending: -1 } },
    { ...valid, items: Array.from({ length: 51 }, () => notification) },
    { ...valid, items: [{ ...notification, state: "delivered-and-read" }] },
    { ...valid, items: [{ ...notification, attempts: 6 }] },
    { ...valid, items: [{ ...notification, reference: "private database detail" }] },
    { ...valid, items: [{ ...notification, providerId: "secret provider credential" }] },
  ]) {
    const { handler } = setup({ notifications });
    const session = await login(handler);
    const result = await handler.handle(
      request("notifications", { cookie: session.cookie }),
      context,
    );
    assert.equal(result.status, 503);
    assert.deepEqual(await result.json(), {
      error: "The private inbox could not complete this request. Please try again.",
    });
  }
  const { handler } = setup({ fail: "/rest/v1/rpc/luxe_inbox_notifications" });
  const session = await login(handler);
  const failed = await handler.handle(
    request("notifications", { cookie: session.cookie }),
    context,
  );
  assert.equal(failed.status, 503);
  assert.doesNotMatch(await failed.text(), /secret|provider|credentials|stack|sb_secret/);
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

test("workflow is opt-in and signed-out visitors cannot read assignments or workload", async () => {
  for (const enabled of [undefined, "false", "TRUE", "true"]) {
    const { handler, calls } = setup({ env: { LUXE_WORKFLOW_ENABLED: enabled } });
    assert.equal((await handler.handle(request("leads?work=today"), context)).status, 401);
    assert.equal(calls.length, 0);
    const session = await login(handler);
    const list = await handler.handle(request("leads", { cookie: session.cookie }), context);
    assert.equal(list.status, 200);
    const value = await list.json();
    if (enabled === "true") {
      assert.equal(value.workflow.enabled, true);
      assert.deepEqual(value.items[0].assignedTo, assignee);
      assert.ok(calls.at(-1).path.endsWith("luxe_inbox_work_list"));
    } else {
      assert.deepEqual(value, { items: [entry], total: 1, page: 1, pageSize: 25, summary });
      assert.ok(calls.at(-1).path.endsWith("luxe_inbox_list"));
      const before = calls.filter((call) => call.path.endsWith("luxe_inbox_list")).length;
      assert.equal(
        (await handler.handle(request("leads?work=today", { cookie: session.cookie }), context))
          .status,
        400,
      );
      assert.equal(calls.filter((call) => call.path.endsWith("luxe_inbox_list")).length, before);
    }
  }
});

test("workload filters use the fixed actor-scoped RPC and preserve filters before pagination", async () => {
  const { handler, calls } = setup({ env: { LUXE_WORKFLOW_ENABLED: "true" } });
  const session = await login(handler);
  for (const work of ["", "today", "overdue", "unscheduled", "unassigned", "mine"]) {
    const result = await handler.handle(
      request("leads?search=Noida&status=new&kind=quote&page=2&work=" + work, {
        cookie: session.cookie,
      }),
      context,
    );
    assert.equal(result.status, 200);
    assert.deepEqual(await result.json(), {
      items: [{ ...entry, assignedTo: assignee }],
      total: 1,
      page: 2,
      pageSize: 25,
      summary,
      workflow: workflowMetadata,
    });
    assert.deepEqual(calls.at(-1), {
      path: "/rest/v1/rpc/luxe_inbox_work_list",
      payload: {
        p_actor: staff.id,
        p_search: "Noida",
        p_status: "new",
        p_kind: "quote",
        p_page: 2,
        p_work: work,
      },
    });
  }
  const before = calls.filter((call) => call.path.endsWith("luxe_inbox_work_list")).length;
  for (const suffix of [
    "?work=everyone",
    "?work=Today",
    "?work=today&work=mine",
    "?work=mine&assignedTo=" + assignee.id,
    "?work=today&page=401",
    "?work=today&kind=unknown",
    "?work=today&status=deleted",
  ]) {
    const result = await handler.handle(
      request("leads" + suffix, { cookie: session.cookie }),
      context,
    );
    assert.equal(result.status, 400, suffix);
  }
  assert.equal(calls.filter((call) => call.path.endsWith("luxe_inbox_work_list")).length, before);
});

test("workflow list and detail whitelist names and role metadata without exposing staff email or diagnostics", async () => {
  const privateValue = "Private assignment diagnostic";
  const rawAssignee = { ...assignee, email: "private-staff@example.test", privateValue };
  const { handler, calls } = setup({
    env: { LUXE_WORKFLOW_ENABLED: "true" },
    workList: {
      items: [{ ...entry, assignedTo: rawAssignee, privateValue }],
      page: 1,
      pageSize: 25,
      total: 1,
      summary: { ...summary, privateValue },
      workflow: {
        ...workflowMetadata,
        assignees: [{ ...rawAssignee, role: "staff", apiKey: env.SUPABASE_SECRET_KEY }],
        counts: { ...workflowCounts, privateValue },
        privateValue,
        secret: env.LUXE_LEADS_HMAC_SECRET,
      },
      privateValue,
    },
    leadResult: { ...entry, assignedTo: rawAssignee, privateValue },
  });
  const session = await login(handler);
  for (const path of ["leads", "leads/" + entry.id]) {
    const response = await handler.handle(request(path, { cookie: session.cookie }), context);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control"), /no-store/);
    assert.equal(response.headers.get("access-control-allow-origin"), null);
    const value = await response.json();
    if (path === "leads") {
      assert.deepEqual(value.workflow, workflowMetadata);
      assert.deepEqual(value.items, [{ ...entry, assignedTo: assignee }]);
    } else {
      assert.deepEqual(value, { ...entry, assignedTo: assignee });
      assert.deepEqual(calls.at(-1), {
        path: "/rest/v1/rpc/luxe_inbox_lead",
        payload: { p_actor: staff.id, p_id: entry.id },
      });
    }
    const output = JSON.stringify(value);
    for (const secret of [privateValue, env.SUPABASE_SECRET_KEY, env.LUXE_LEADS_HMAC_SECRET])
      assert.equal(output.includes(secret), false);
    assert.doesNotMatch(output, /private-staff|test-access-token|apiKey/);
  }
});

test("owner assignment changes are explicit and clearing assignment is distinct from keeping it", async () => {
  const { handler, calls } = setup({ env: { LUXE_WORKFLOW_ENABLED: "true" } });
  const session = await login(handler);
  const patch = {
    status: "contacted",
    notes: "Call after the site visit",
    followUpAt: "2026-10-28T08:30:00Z",
    expectedUpdatedAt: entry.updatedAt,
  };
  for (const change of [{}, { assignedTo: assignee.id }, { assignedTo: null }]) {
    const result = await handler.handle(
      request("leads/" + entry.id, {
        method: "PATCH",
        cookie: session.cookie,
        csrf: session.value.csrfToken,
        value: { ...patch, ...change },
      }),
      context,
    );
    assert.equal(result.status, 200);
    assert.deepEqual(calls.at(-1), {
      path: "/rest/v1/rpc/luxe_inbox_work_update",
      payload: {
        p_actor: staff.id,
        p_id: entry.id,
        p_status: patch.status,
        p_notes: patch.notes,
        p_follow_up_at: patch.followUpAt,
        p_expected_updated_at: patch.expectedUpdatedAt,
        p_change_assignee: Object.hasOwn(change, "assignedTo"),
        p_assigned_to: change.assignedTo ?? null,
      },
    });
    assert.deepEqual(
      (await result.json()).assignedTo,
      change.assignedTo === null ? null : assignee,
    );
  }
});

test("staff may update follow-up work but cannot assign, unassign, or escalate permissions", async () => {
  const { handler, state, calls } = setup({ env: { LUXE_WORKFLOW_ENABLED: "true" } });
  const session = await login(handler);
  state.role = "staff";
  const patch = {
    status: "contacted",
    notes: "Spoke with the client",
    followUpAt: null,
    expectedUpdatedAt: entry.updatedAt,
  };
  const list = await handler.handle(
    request("leads?work=mine", { cookie: session.cookie }),
    context,
  );
  assert.equal(list.status, 200);
  assert.equal((await list.json()).workflow.canAssign, false);
  for (const assignedTo of [assignee.id, null]) {
    const result = await handler.handle(
      request("leads/" + entry.id, {
        method: "PATCH",
        cookie: session.cookie,
        csrf: session.value.csrfToken,
        value: { ...patch, assignedTo },
      }),
      context,
    );
    assert.equal(result.status, 403);
  }
  assert.equal(
    calls.some((call) => call.path.endsWith("luxe_inbox_work_update")),
    false,
  );
  const accepted = await handler.handle(
    request("leads/" + entry.id, {
      method: "PATCH",
      cookie: session.cookie,
      csrf: session.value.csrfToken,
      value: patch,
    }),
    context,
  );
  assert.equal(accepted.status, 200);
  assert.equal(calls.at(-1).payload.p_change_assignee, false);
  assert.equal(calls.at(-1).payload.p_assigned_to, null);
  const before = calls.filter((call) => call.path.endsWith("luxe_inbox_work_update")).length;
  for (const extra of [{ role: "owner" }, { p_actor: assignee.id }, { canAssign: true }]) {
    const result = await handler.handle(
      request("leads/" + entry.id, {
        method: "PATCH",
        cookie: session.cookie,
        csrf: session.value.csrfToken,
        value: { ...patch, ...extra },
      }),
      context,
    );
    assert.equal(result.status, 400);
  }
  assert.equal(calls.filter((call) => call.path.endsWith("luxe_inbox_work_update")).length, before);
});

test("workflow mutations retain CSRF, origin, strict assignment and stale-update protections", async () => {
  const { handler, state, calls } = setup({ env: { LUXE_WORKFLOW_ENABLED: "true" } });
  const session = await login(handler);
  const patch = {
    status: "new",
    notes: "Private follow-up note",
    followUpAt: null,
    expectedUpdatedAt: entry.updatedAt,
    assignedTo: assignee.id,
  };
  const options = {
    method: "PATCH",
    cookie: session.cookie,
    csrf: session.value.csrfToken,
    value: patch,
  };
  for (const invalid of [
    { csrf: undefined },
    { csrf: "invalid" },
    { origin: "https://attacker.example" },
    { headers: { "sec-fetch-site": "cross-site" } },
  ])
    assert.equal(
      (await handler.handle(request("leads/" + entry.id, { ...options, ...invalid }), context))
        .status,
      403,
    );
  for (const invalid of [
    { assignedTo: "not-a-uuid" },
    { assignedTo: { id: assignee.id } },
    { assignedTo: "" },
    { assignedTo: 1 },
    { role: "owner" },
    { status: "deleted" },
    { notes: "x".repeat(4001) },
    { followUpAt: "invalid" },
    { expectedUpdatedAt: "invalid" },
  ])
    assert.equal(
      (
        await handler.handle(
          request("leads/" + entry.id, { ...options, value: { ...patch, ...invalid } }),
          context,
        )
      ).status,
      400,
    );
  assert.equal(
    calls.some((call) => call.path.endsWith("luxe_inbox_work_update")),
    false,
  );
  for (const status of [409, 429]) {
    state.workUpdateStatus = status;
    const result = await handler.handle(request("leads/" + entry.id, options), context);
    assert.equal(result.status, status);
    assert.doesNotMatch(
      await result.text(),
      /Private assignment|Private follow-up|p_actor|assignedTo/,
    );
  }
});

test("malformed workflow RPC responses fail closed instead of returning partial or private metadata", async () => {
  const valid = {
    items: [{ ...entry, assignedTo: assignee }],
    total: 1,
    page: 1,
    pageSize: 25,
    summary,
    workflow: workflowMetadata,
  };
  for (const workList of [
    null,
    { ...valid, workflow: null },
    { ...valid, workflow: { ...workflowMetadata, enabled: false } },
    { ...valid, workflow: { ...workflowMetadata, canAssign: "owner" } },
    { ...valid, workflow: { ...workflowMetadata, timeZone: "UTC" } },
    { ...valid, workflow: { ...workflowMetadata, asOf: "invalid" } },
    { ...valid, workflow: { ...workflowMetadata, counts: { ...workflowCounts, mine: -1 } } },
    { ...valid, workflow: { ...workflowMetadata, assignees: [{ ...assignee, role: "admin" }] } },
    {
      ...valid,
      workflow: {
        ...workflowMetadata,
        assignees: [{ ...assignee, id: "Private identifier", role: "staff" }],
      },
    },
    { ...valid, items: [{ ...entry, assignedTo: { ...assignee, active: "true" } }] },
    { ...valid, items: [{ ...entry, assignedTo: { ...assignee, id: "Private identifier" } }] },
    { ...valid, page: 2 },
  ]) {
    const { handler } = setup({ env: { LUXE_WORKFLOW_ENABLED: "true" }, workList });
    const session = await login(handler);
    const result = await handler.handle(request("leads", { cookie: session.cookie }), context);
    assert.equal(result.status, 503);
    assert.deepEqual(await result.json(), {
      error: "The private inbox could not complete this request. Please try again.",
    });
  }
  const { handler } = setup({
    env: { LUXE_WORKFLOW_ENABLED: "true" },
    fail: "/rest/v1/rpc/luxe_inbox_work_list",
  });
  const session = await login(handler);
  const failed = await handler.handle(request("leads", { cookie: session.cookie }), context);
  assert.equal(failed.status, 503);
  assert.doesNotMatch(await failed.text(), /secret|credentials|stack|sb_secret/);
});

test("invalid detail and update assignments are rejected and legacy updates never invoke workflow RPCs", async () => {
  for (const assignedTo of [undefined, "Private identifier", { ...assignee, active: "yes" }]) {
    const { handler } = setup({
      env: { LUXE_WORKFLOW_ENABLED: "true" },
      leadResult: { ...entry, ...(assignedTo === undefined ? {} : { assignedTo }) },
    });
    const session = await login(handler);
    for (const options of [
      { cookie: session.cookie },
      {
        cookie: session.cookie,
        csrf: session.value.csrfToken,
        method: "PATCH",
        value: {
          status: "new",
          notes: "",
          followUpAt: null,
          expectedUpdatedAt: entry.updatedAt,
        },
      },
    ]) {
      const result = await handler.handle(request("leads/" + entry.id, options), context);
      assert.equal(result.status, 503);
      assert.doesNotMatch(await result.text(), /Private identifier|active|assignedTo/);
    }
  }
  const { handler, calls } = setup();
  const session = await login(handler);
  const result = await handler.handle(
    request("leads/" + entry.id, {
      method: "PATCH",
      cookie: session.cookie,
      csrf: session.value.csrfToken,
      value: {
        status: "new",
        notes: "Legacy update",
        followUpAt: null,
        expectedUpdatedAt: entry.updatedAt,
      },
    }),
    context,
  );
  assert.equal(result.status, 200);
  assert.ok(calls.at(-1).path.endsWith("luxe_inbox_update"));
  assert.equal(Object.hasOwn(await result.json(), "assignedTo"), false);
  assert.equal(
    calls.some((call) => /luxe_inbox_work_/.test(call.path)),
    false,
  );
});
