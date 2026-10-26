import assert from "node:assert/strict";
import { test } from "node:test";
import { createHostedLeadIntake, hostedLeadConfiguration } from "../src/lib/hosted-leads.server.ts";

const site = "https://luxeinfra.in";
const env = {
  SUPABASE_URL: "https://aaaaaaaaaaaaaaaaaaaa.supabase.co",
  SUPABASE_SECRET_KEY: "sb_secret_" + "test".repeat(10),
  LUXE_LEADS_HMAC_SECRET: "ab".repeat(32),
  LUXE_LEADS_ENABLED: "true",
  SITE_URL: site,
};
const context = { environment: "production", runtime: { ip: "203.0.113.8" } };
const input = {
  id: "12345678-1234-4123-8123-123456789abc",
  kind: "quote",
  name: "QA Customer",
  phone: "(90000) 00000",
  city: "Noida",
  message: "Please discuss my kitchen requirements.",
  consent: true,
  website: "",
};
const receipt = {
  reference: "LX-20261026-ABCDEF123456",
  created_at: "2026-10-26T05:00:00Z",
  duplicate: false,
};

async function session(handler, ctx = context) {
  const response = await handler.handle(new Request(site + "/api/enquiry-delivery/status"), ctx);
  return { response, cookie: response?.headers.get("set-cookie")?.split(";")[0] ?? "" };
}
function submission(cookie, value = input, extra = {}) {
  return new Request(site + "/api/enquiry-delivery", {
    method: "POST",
    headers: { Origin: site, "Content-Type": "application/json", Cookie: cookie, ...extra },
    body: JSON.stringify(value),
  });
}

test("hosted intake stays disconnected unless server config, production context and origin all match", async () => {
  for (const override of [
    { LUXE_LEADS_ENABLED: "false" },
    { SUPABASE_URL: "https://attacker.example" },
    { SUPABASE_URL: env.SUPABASE_URL + "/" },
    { SUPABASE_SECRET_KEY: "sb_publishable_" + "a".repeat(32) },
    { LUXE_LEADS_HMAC_SECRET: "short" },
    { SITE_URL: "http://luxeinfra.in" },
    { SITE_URL: "https://luxeinfra.in/path" },
  ]) {
    const handler = createHostedLeadIntake({
      env: { ...env, ...override },
      fetch: () => assert.fail("must not call Supabase"),
    });
    assert.equal(
      await handler.handle(new Request(site + "/api/enquiry-delivery/status"), context),
      null,
    );
  }
  const handler = createHostedLeadIntake({ env });
  assert.equal(
    await handler.handle(new Request(site + "/api/enquiry-delivery/status"), {
      ...context,
      environment: "preview",
    }),
    null,
  );
  assert.equal(
    await handler.handle(
      new Request("https://other.netlify.app/api/enquiry-delivery/status"),
      context,
    ),
    null,
  );
  assert.equal(await handler.handle(new Request(site + "/api/visualiser/jobs"), context), null);
  assert.equal(hostedLeadConfiguration({ ...env, SITE_URL: undefined, URL: site }).valid, true);
});

test("capability response creates a protected cookie without contacting Supabase or promising notifications", async () => {
  const handler = createHostedLeadIntake({
    env,
    fetch: () => assert.fail("status must not call DB"),
  });
  const { response, cookie } = await session(handler);
  assert.deepEqual(await response.json(), {
    enabled: true,
    channel: "database",
    notifications: { email: false, whatsapp: false },
  });
  assert.match(cookie, /^__Secure-luxe_lead_session=/);
  assert.match(
    response.headers.get("set-cookie"),
    /HttpOnly; Secure; SameSite=Strict; Path=\/api\/enquiry-delivery/,
  );
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.doesNotMatch(response.headers.get("set-cookie"), /QA Customer|90000|sb_secret/);
  const reused = await handler.handle(
    new Request(site + "/api/enquiry-delivery/status", { headers: { Cookie: cookie } }),
    context,
  );
  assert.equal(reused.headers.get("set-cookie").split(";")[0], cookie);
});

test("public email capability requires complete enabled settings and trusted production context without provider calls", async (t) => {
  const configured = {
    ...env,
    RESEND_API_KEY: "re_" + "mock_private_key".repeat(3),
    LUXE_EMAIL_FROM: "LuxeInfra <leads@alerts.luxeinfra.in>",
    LUXE_EMAIL_ALERTS_ENABLED: "true",
  };
  const cases = [
    { name: "complete enabled configuration", overrides: {}, expected: true },
    { name: "missing Resend key", overrides: { RESEND_API_KEY: undefined }, expected: false },
    {
      name: "alerts explicitly disabled",
      overrides: { LUXE_EMAIL_ALERTS_ENABLED: "false" },
      expected: false,
    },
    {
      name: "alerts not enabled",
      overrides: { LUXE_EMAIL_ALERTS_ENABLED: undefined },
      expected: false,
    },
    {
      name: "unapproved sending domain",
      overrides: { LUXE_EMAIL_FROM: "LuxeInfra <leads@other.example>" },
      expected: false,
    },
    {
      name: "daily limit outside the supported range",
      overrides: { LUXE_EMAIL_DAILY_LIMIT: "101" },
      expected: false,
    },
    {
      name: "missing trusted runtime IP",
      overrides: {},
      runtime: {},
      intakeEnabled: false,
      expected: false,
    },
    {
      name: "invalid trusted runtime IP",
      overrides: {},
      runtime: { ip: "not-an-ip" },
      intakeEnabled: false,
      expected: false,
    },
  ];
  for (const item of cases) {
    await t.test(item.name, async () => {
      let providerCalls = 0;
      const handler = createHostedLeadIntake({
        env: { ...configured, ...item.overrides },
        fetch: () => {
          providerCalls++;
          assert.fail("Public capability reads must not call Supabase or Resend");
        },
      });
      const response = await handler.handle(
        new Request(site + "/api/enquiry-delivery/status", {
          headers: { "x-forwarded-for": "203.0.113.8" },
        }),
        { ...context, runtime: item.runtime ?? context.runtime },
      );
      assert.equal(response.status, 200);
      const payload = await response.json();
      assert.deepEqual(payload, {
        enabled: item.intakeEnabled ?? true,
        channel: "database",
        notifications: { email: item.expected, whatsapp: false },
      });
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.equal(providerCalls, 0);
      const serialized = JSON.stringify(payload);
      for (const privateValue of [
        configured.RESEND_API_KEY,
        configured.SUPABASE_SECRET_KEY,
        configured.LUXE_LEADS_HMAC_SECRET,
        configured.SUPABASE_URL,
        configured.LUXE_EMAIL_FROM,
      ])
        assert.equal(serialized.includes(privateValue), false);
      assert.doesNotMatch(serialized, /apiKey|sender|recipients|configuration|RESEND_API_KEY/);
    });
  }
  await t.test("preview and development contexts never advertise live sending", async () => {
    const handler = createHostedLeadIntake({
      env: configured,
      fetch: () => assert.fail("Non-production status must not call a provider"),
    });
    for (const environment of ["preview", "local", "development"])
      assert.equal(
        await handler.handle(new Request(site + "/api/enquiry-delivery/status"), {
          ...context,
          environment,
        }),
        null,
      );
  });
});

test("only the trusted Netlify context supplies an IP; forged forwarding headers do not enable intake", async () => {
  const handler = createHostedLeadIntake({
    env,
    fetch: () => assert.fail("missing IP must fail closed"),
  });
  for (const runtime of [undefined, {}, { ip: "not-an-ip" }]) {
    const response = await handler.handle(
      new Request(site + "/api/enquiry-delivery/status", {
        headers: { "x-forwarded-for": "203.0.113.8", "x-nf-client-connection-ip": "203.0.113.8" },
      }),
      { environment: "production", runtime },
    );
    assert.equal((await response.json()).enabled, false);
    assert.equal(response.headers.get("set-cookie"), null);
  }
});

test("valid lead saves through the fixed Supabase RPC; only receipt reaches the browser", async () => {
  let posted;
  const handler = createHostedLeadIntake({
    env,
    fetch: async (url, init) => {
      assert.equal(url, env.SUPABASE_URL + "/rest/v1/rpc/luxe_submit_enquiry");
      assert.equal(init.headers.apikey, env.SUPABASE_SECRET_KEY);
      assert.equal(init.headers.Authorization, undefined);
      assert.equal(init.redirect, "error");
      posted = JSON.parse(init.body);
      return Response.json({ ...receipt, private_provider_field: "must not escape" });
    },
  });
  const { cookie } = await session(handler);
  const response = await handler.handle(submission(cookie), context);
  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), { reference: receipt.reference, state: "accepted" });
  assert.equal(posted.p_phone, "+919000000000");
  assert.equal(posted.p_name, input.name);
  assert.equal(posted.p_origin, site);
  for (const key of ["p_fingerprint", "p_ip_hash", "p_phone_hash"])
    assert.match(posted[key], /^[a-f0-9]{64}$/);
  assert.notEqual(posted.p_ip_hash, posted.p_phone_hash);
  assert.equal(Object.hasOwn(posted, "ip"), false);
  assert.equal(Object.hasOwn(posted, "p_ip"), false);
});

test("same details retain their fingerprint across retries, sessions and IPs; edits change it", async () => {
  const calls = [];
  const handler = createHostedLeadIntake({
    env,
    fetch: async (_url, init) => {
      calls.push(JSON.parse(init.body));
      return Response.json(receipt);
    },
  });
  const first = await session(handler);
  assert.equal((await handler.handle(submission(first.cookie), context)).status, 202);
  const second = await session(handler);
  assert.equal(
    (
      await handler.handle(submission(second.cookie), {
        ...context,
        runtime: { ip: "2001:db8::1" },
      })
    ).status,
    202,
  );
  assert.equal(calls[0].p_fingerprint, calls[1].p_fingerprint);
  assert.notEqual(calls[0].p_ip_hash, calls[1].p_ip_hash);
  assert.equal(
    (await handler.handle(submission(second.cookie, { ...input, city: "Delhi" }), context)).status,
    202,
  );
  assert.notEqual(calls[0].p_fingerprint, calls[2].p_fingerprint);
});

test("cross-origin requests, missing/tampered/expired sessions and non-JSON submissions never reach DB", async () => {
  let now = Date.parse("2026-10-26T05:00:00Z");
  const handler = createHostedLeadIntake({
    env,
    now: () => now,
    fetch: () => assert.fail("invalid request reached DB"),
  });
  const { cookie } = await session(handler);
  for (const request of [
    submission(cookie, input, { Origin: "https://attacker.example" }),
    submission(cookie, input, { "Sec-Fetch-Site": "cross-site" }),
    submission(""),
    submission(cookie.slice(0, -1) + (cookie.endsWith("a") ? "b" : "a")),
  ])
    assert.equal((await handler.handle(request, context)).status, 403);
  assert.equal(
    (await handler.handle(submission(cookie, input, { "Content-Type": "text/plain" }), context))
      .status,
    415,
  );
  now += 2 * 60 * 60 * 1000 + 1;
  assert.equal((await handler.handle(submission(cookie), context)).status, 403);
});

test("consent, field validation, honeypot and bounded body are enforced before DB writes", async () => {
  const handler = createHostedLeadIntake({
    env,
    fetch: () => assert.fail("invalid request reached DB"),
  });
  const { cookie } = await session(handler);
  for (const value of [
    { ...input, consent: false },
    { ...input, website: "spam.example" },
    { ...input, name: "\nHidden" },
    { ...input, city: "x".repeat(101) },
    { ...input, phone: "1234" },
    { ...input, kind: "admin" },
    { ...input, message: "x".repeat(10001) },
    { ...input, unknown: "field" },
  ])
    assert.equal((await handler.handle(submission(cookie, value), context)).status, 400);
  assert.equal(
    (await handler.handle(submission(cookie, { ...input, message: "x".repeat(70_000) }), context))
      .status,
    413,
  );
  assert.equal(
    (await handler.handle(submission(cookie, input, { "Content-Length": "999999" }), context))
      .status,
    413,
  );
  const badJson = new Request(site + "/api/enquiry-delivery", {
    method: "POST",
    headers: { Origin: site, "Content-Type": "application/json", Cookie: cookie },
    body: "{",
  });
  assert.equal((await handler.handle(badJson, context)).status, 400);
});

test("conflicts, limits, unavailable schema, network ambiguity and malformed receipts never become success", async () => {
  for (const [providerStatus, expected] of [
    [409, 409],
    [429, 429],
    [401, 503],
    [404, 503],
    [500, 503],
  ]) {
    const handler = createHostedLeadIntake({
      env,
      fetch: async () =>
        Response.json({ private_error: env.SUPABASE_SECRET_KEY }, { status: providerStatus }),
    });
    const { cookie } = await session(handler);
    const response = await handler.handle(submission(cookie), context);
    assert.equal(response.status, expected);
    assert.doesNotMatch(await response.text(), /sb_secret|private_error/);
    if (expected === 429) assert.equal(response.headers.get("retry-after"), "600");
  }
  for (const value of [
    { ...receipt, reference: "bad" },
    { ...receipt, duplicate: "false" },
    { ...receipt, created_at: "bad" },
    { ok: true },
    "not-a-receipt",
  ]) {
    const handler = createHostedLeadIntake({ env, fetch: async () => Response.json(value) });
    const { cookie } = await session(handler);
    assert.equal((await handler.handle(submission(cookie), context)).status, 503);
  }
  let attempts = 0;
  const handler = createHostedLeadIntake({
    env,
    fetch: async () => {
      attempts++;
      throw new Error("secret network details");
    },
  });
  const { cookie } = await session(handler);
  const response = await handler.handle(submission(cookie), context);
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /secret network details/);
  assert.equal(attempts, 1);
});

test("HEAD and method handling cannot create leads or expose response bodies", async () => {
  const handler = createHostedLeadIntake({ env, fetch: () => assert.fail("must not reach DB") });
  const head = await handler.handle(
    new Request(site + "/api/enquiry-delivery/status", { method: "HEAD" }),
    context,
  );
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  assert.equal(head.headers.get("set-cookie"), null);
  const wrongStatus = await handler.handle(
    new Request(site + "/api/enquiry-delivery/status", { method: "POST" }),
    context,
  );
  assert.equal(wrongStatus.status, 405);
  assert.equal(wrongStatus.headers.get("allow"), "GET, HEAD");
  const wrongAction = await handler.handle(new Request(site + "/api/enquiry-delivery"), context);
  assert.equal(wrongAction.status, 405);
  assert.equal(wrongAction.headers.get("allow"), "POST");
});
