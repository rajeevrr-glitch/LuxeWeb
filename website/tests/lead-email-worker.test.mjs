import assert from "node:assert/strict";
import { test } from "node:test";
import {
  emailAlertConfiguration,
  runLeadEmailWorker,
} from "../src/lib/lead-email-worker.server.ts";

const clock = Date.parse("2026-10-26T07:00:00Z");
const site = "https://luxeinfra.in";
const env = {
  SUPABASE_URL: "https://aaaaaaaaaaaaaaaaaaaa.supabase.co",
  SUPABASE_SECRET_KEY: "sb_secret_" + "test".repeat(10),
  LUXE_LEADS_HMAC_SECRET: "ab".repeat(32),
  LUXE_LEADS_ENABLED: "true",
  SITE_URL: site,
  RESEND_API_KEY: "re_" + "test".repeat(10),
  LUXE_EMAIL_FROM: "LuxeInfra <leads@alerts.luxeinfra.in>",
  LUXE_EMAIL_ALERTS_ENABLED: "true",
};
const job = {
  id: "12345678-1234-4123-8123-123456789abc",
  leadId: "22345678-1234-4123-8123-123456789abc",
  reference: "LX-20261026-ABCDEF123456",
  createdAt: "2026-10-26T06:59:00Z",
  attempts: 1,
  firstSendAt: null,
  payload: null,
  idempotencyKey: "new-lead-email-v1/22345678-1234-4123-8123-123456789abc",
  lead: {
    name: "Internal QA",
    phone: "+919000000000",
    city: "System verification",
    kind: "quote",
    message: "This is an offline worker test. No real customer or email is involved.",
  },
};
const providerId = "32345678-1234-4123-8123-123456789abc";
const json = (value, status = 200, headers = {}) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });

function harness(overrides = {}) {
  const calls = [];
  const chosenJob = overrides.job === undefined ? structuredClone(job) : overrides.job;
  const mock = async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push({ url, init, body });
    assert.equal(init.method, "POST");
    assert.equal(init.redirect, "error");
    assert.ok(init.signal instanceof AbortSignal);
    if (url === "https://api.resend.com/emails") {
      assert.equal(init.headers.Authorization, "Bearer " + env.RESEND_API_KEY);
      assert.equal(init.headers.apikey, undefined);
      assert.equal(init.headers["Idempotency-Key"], job.idempotencyKey);
      return overrides.provider ? overrides.provider(body, init) : json({ id: providerId });
    }
    assert.equal(init.headers.apikey, env.SUPABASE_SECRET_KEY);
    assert.equal(init.headers.Authorization, undefined);
    assert.match(
      url,
      new RegExp("^" + env.SUPABASE_URL.replaceAll(".", "\\.") + "/rest/v1/rpc/luxe_email_"),
    );
    if (url.endsWith("luxe_email_claim")) {
      assert.match(body.p_lease_token, /^[a-f0-9-]{36}$/);
      return overrides.claim ? overrides.claim(body) : json(chosenJob);
    }
    if (url.endsWith("luxe_email_prepare")) {
      return overrides.prepare
        ? overrides.prepare(body)
        : json({
            id: chosenJob.id,
            payload: chosenJob.payload ?? body.p_payload,
            idempotencyKey: chosenJob.idempotencyKey,
            firstSendAt: chosenJob.firstSendAt ?? new Date(clock).toISOString(),
          });
    }
    if (url.endsWith("luxe_email_settle")) {
      assert.match(body.p_error_code ?? "accepted", /^[a-z][a-z0-9_]{0,63}$/);
      return overrides.settle ? overrides.settle(body) : json({ state: body.p_outcome });
    }
    assert.fail("unexpected request");
  };
  return {
    calls,
    run: (options = {}) =>
      runLeadEmailWorker({
        env,
        fetch: mock,
        now: () => clock,
        environment: "production",
        ...options,
      }),
    settle: () => calls.find((call) => call.url.endsWith("luxe_email_settle"))?.body,
    provider: () => calls.filter((call) => call.url === "https://api.resend.com/emails"),
  };
}

test("email worker requires complete private configuration, explicit enable and production", async () => {
  assert.equal(emailAlertConfiguration(env).valid, true);
  assert.equal(emailAlertConfiguration(env).dailyLimit, 80);
  for (const change of [
    { RESEND_API_KEY: "" },
    { RESEND_API_KEY: "re_unsafe\r\nHeader: injected" },
    { LUXE_EMAIL_FROM: "LuxeInfra <leads@attacker.example>" },
    { LUXE_EMAIL_FROM: "LuxeInfra <leads@alerts.luxeinfra.in>\n" },
    { LUXE_EMAIL_DAILY_LIMIT: "101" },
    { LUXE_EMAIL_DAILY_LIMIT: "0" },
    { LUXE_EMAIL_DAILY_LIMIT: "1.5" },
    { LUXE_EMAIL_DAILY_LIMIT: " 80" },
    { SUPABASE_SECRET_KEY: "public-key" },
    { SITE_URL: "https://luxeinfra.in/path" },
    { LUXE_EMAIL_ALERTS_ENABLED: "false" },
    { LUXE_LEADS_ENABLED: "false" },
  ]) {
    const result = await runLeadEmailWorker({
      env: { ...env, ...change },
      environment: "production",
      fetch: () => assert.fail("disabled worker must never use network"),
    });
    assert.equal(result.enabled, false);
  }
  for (const environment of [undefined, "preview", "deploy-preview", "development"]) {
    const result = await runLeadEmailWorker({
      env,
      environment,
      fetch: () => assert.fail("non-production worker must never use network"),
    });
    assert.equal(result.state, "disabled");
  }
});

test("one claimed lead becomes one recipient-limited internal email and one receipt update", async () => {
  const worker = harness();
  assert.deepEqual(await worker.run(), { enabled: true, processed: 1, state: "accepted" });
  assert.equal(worker.calls.length, 4);
  assert.equal(
    new Set(
      worker.calls.filter((call) => call.body.p_lease_token).map((call) => call.body.p_lease_token),
    ).size,
    1,
  );
  const { body } = worker.provider()[0];
  assert.deepEqual(Object.keys(body).sort(), ["from", "html", "subject", "text", "to"]);
  assert.deepEqual(body.to, ["sales@luxeinfra.in", "infoluxeinfra@gmail.com"]);
  assert.equal(body.from, env.LUXE_EMAIL_FROM);
  assert.match(body.subject, /Quote request/i);
  assert.match(body.text, /Internal QA/);
  assert.match(body.text, /https:\/\/luxeinfra\.in\/admin/);
  assert.match(body.html, /background:#173e72/);
  assert.doesNotMatch(body.html, /<img|src=|track|unsubscribe/i);
  assert.equal(worker.settle().p_provider_id, providerId);
  assert.equal(worker.settle().p_outcome, "accepted");
});

test("customer HTML is escaped, never used in headers or recipients, and summary is limited", async () => {
  const candidate = structuredClone(job);
  candidate.lead.name = '<img src=x onerror="alert(1)">';
  candidate.lead.city = "<script>attack()</script>";
  candidate.lead.message = "<iframe>unsafe</iframe> " + "x".repeat(2000);
  const worker = harness({ job: candidate });
  assert.equal((await worker.run()).state, "accepted");
  const body = worker.provider()[0].body;
  assert.match(body.html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.match(body.html, /&lt;script&gt;attack\(\)&lt;\/script&gt;/);
  assert.doesNotMatch(body.html, /<img|<script|<iframe/);
  assert.doesNotMatch(body.subject, /unsafe|alert|attack/);
  const summary = body.text.split("\nBrief\n")[1].split("\n\nOpen private")[0];
  assert.equal(summary.length, 400);
});

test("empty queue does not call provider or prepare", async () => {
  const worker = harness({ job: null });
  assert.deepEqual(await worker.run(), { enabled: true, processed: 0, state: "idle" });
  assert.equal(worker.calls.length, 1);
});

test("invalid queue data and overlarge database responses fail before any provider request", async () => {
  for (const candidate of [
    { ...job, id: "invalid" },
    { ...job, leadId: "invalid" },
    { ...job, reference: "bad" },
    { ...job, attempts: 6 },
    { ...job, attempts: 0 },
    { ...job, idempotencyKey: "attacker-key" },
    { ...job, createdAt: "2099-01-01T00:00:00Z" },
    { ...job, lead: { ...job.lead, phone: "wrong" } },
    { ...job, lead: { ...job.lead, name: "Name\r\nHeader" } },
    { ...job, lead: { ...job.lead, message: "x".repeat(10001) } },
  ]) {
    const worker = harness({ job: candidate });
    assert.equal((await worker.run()).state, "invalid_job");
    assert.equal(worker.provider().length, 0);
  }
  const worker = harness({ claim: () => new Response("x".repeat(256 * 1024 + 1)) });
  assert.equal((await worker.run()).state, "database_unavailable");
  assert.equal(worker.provider().length, 0);
});

test("database preparation failure never reaches Resend and budget deferral never sends", async () => {
  for (const prepare of [
    () => json({ error: "private DB detail" }, 503),
    () => Promise.reject(new Error("private network detail")),
    () => json({ deferred: true }),
    () => json({ blocked: true, state: "needs_review" }),
    () => json({ blocked: true, state: "expired" }),
  ]) {
    const worker = harness({ prepare });
    const result = await worker.run();
    assert.ok(["database_unavailable", "deferred", "blocked"].includes(result.state));
    assert.equal(worker.provider().length, 0);
    assert.doesNotMatch(JSON.stringify(result), /private|9000000000/);
  }
});

test("retries send only the database-frozen payload with the same stable idempotency key", async () => {
  const initial = harness();
  await initial.run();
  const frozen = initial.provider()[0].body;
  const candidate = {
    ...structuredClone(job),
    payload: frozen,
    attempts: 2,
    firstSendAt: new Date(clock - 60_000).toISOString(),
  };
  candidate.lead.name = "Changed after original snapshot";
  candidate.lead.message = "New brief must never overwrite first email";
  const worker = harness({ job: candidate });
  assert.equal((await worker.run()).state, "accepted");
  assert.deepEqual(worker.provider()[0].body, frozen);
  assert.equal(worker.provider().length, 1);
});

test("recipient, sender, link or HTML mutation in frozen payload is held for owner review", async () => {
  const initial = harness();
  await initial.run();
  const original = initial.provider()[0].body;
  const changes = [
    { to: ["attacker@example.com", "sales@luxeinfra.in"] },
    { from: "LuxeInfra <lead@attacker.example>" },
    { subject: original.subject + "\r\nBcc:attacker@example.com" },
    {
      html: original.html.replace(
        "</section>",
        '<img src="https://attacker.example/track"></section>',
      ),
    },
    { html: original.html.replace(site + "/admin", "https://attacker.example") },
    { text: original.text.replace(site + "/admin", "https://attacker.example") },
    { bcc: "attacker@example.com" },
  ];
  for (const change of changes) {
    const worker = harness({ job: { ...job, payload: { ...original, ...change } } });
    assert.equal((await worker.run()).state, "needs_review");
    assert.equal(worker.provider().length, 0);
    assert.equal(worker.settle().p_error_code, "invalid_frozen_payload");
  }
});

test("idempotency retry cutoff is enforced before preparation and again on returned snapshot", async () => {
  const worker = harness({
    job: { ...job, firstSendAt: new Date(clock - 23 * 60 * 60 * 1000).toISOString() },
  });
  assert.equal((await worker.run()).state, "needs_review");
  assert.equal(worker.calls.length, 2);
  assert.equal(worker.provider().length, 0);
  const returned = harness({
    prepare: (body) =>
      json({
        id: job.id,
        payload: body.p_payload,
        idempotencyKey: job.idempotencyKey,
        firstSendAt: new Date(clock - 24 * 60 * 60 * 1000).toISOString(),
      }),
  });
  assert.equal((await returned.run()).state, "needs_review");
  assert.equal(returned.provider().length, 0);
});

test("provider rate limits, server errors, timeouts and concurrent idempotency request are retryable once", async () => {
  for (const provider of [
    () =>
      json({ name: "rate_limit_exceeded", message: "do not expose" }, 429, {
        "Retry-After": "99999999",
      }),
    () => json({}, 503),
    () => json({}, 408),
    () => json({ name: "concurrent_idempotent_requests" }, 409),
    () => Promise.reject(new Error("timeout with private provider details")),
  ]) {
    const worker = harness({ provider });
    const result = await worker.run();
    assert.equal(result.state, "retry");
    assert.equal(worker.provider().length, 1);
    assert.equal(worker.settle().p_outcome, "retry");
    assert.ok(worker.settle().p_retry_after >= 60 && worker.settle().p_retry_after <= 86400);
    assert.doesNotMatch(JSON.stringify(result), /private|do not expose|apiKey|payload/);
  }
});

test("provider configuration and validation rejections are permanent failures", async () => {
  for (const status of [400, 401, 403, 409, 422]) {
    const worker = harness({
      provider: () =>
        json({ name: "invalid_idempotent_request", message: "private provider error" }, status),
    });
    assert.equal((await worker.run()).state, "failed");
    assert.equal(worker.provider().length, 1);
    assert.equal(worker.settle().p_outcome, "failed");
  }
});

test("malformed, overlarge or missing successful receipts remain uncertain, never definitely failed", async () => {
  for (const provider of [
    () => json({ id: "bad" }),
    () => json({}),
    () => new Response("not JSON", { status: 200 }),
    () => new Response("x".repeat(8193), { status: 200 }),
    () =>
      new Response(JSON.stringify({ id: providerId }), {
        status: 200,
        headers: { "Content-Length": "8193" },
      }),
  ]) {
    const worker = harness({ provider });
    assert.equal((await worker.run()).state, "retry");
    assert.equal(worker.settle().p_error_code, "provider_outcome_uncertain");
    assert.equal(worker.provider().length, 1);
  }
});

test("accepted provider delivery with failed receipt persistence is not sent again in the same run", async () => {
  const worker = harness({ settle: () => json({ message: "private DB error" }, 503) });
  assert.deepEqual(await worker.run(), { enabled: true, processed: 1, state: "settle_pending" });
  assert.equal(worker.provider().length, 1);
  assert.equal(worker.settle().p_outcome, "accepted");
  assert.equal(worker.settle().p_provider_id, providerId);
});

test("hung database transport stops after five seconds without attempting provider delivery", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const worker = harness({ claim: () => new Promise(() => {}) });
  const pending = worker.run();
  context.mock.timers.tick(5000);
  assert.equal((await pending).state, "database_unavailable");
  assert.equal(worker.provider().length, 0);
});

test("provider body timeout is uncertain and its reader is cancelled before safe settlement", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  let started;
  const streaming = new Promise((resolve) => {
    started = resolve;
  });
  let cancelled = false;
  const worker = harness({
    provider: () =>
      new Response(
        new ReadableStream({
          pull() {
            started();
            return new Promise(() => {});
          },
          cancel() {
            cancelled = true;
          },
        }),
      ),
  });
  const pending = worker.run();
  await streaming;
  context.mock.timers.tick(8000);
  assert.equal((await pending).state, "retry");
  assert.equal(cancelled, true);
  assert.equal(worker.settle().p_error_code, "provider_outcome_uncertain");
  assert.equal(worker.provider().length, 1);
});
