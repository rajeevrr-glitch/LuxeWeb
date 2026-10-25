import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { createEnquiryDelivery } from "../scripts/enquiry-delivery.mjs";

const origin = "https://luxeinfra.in";
const request = (overrides = {}) => ({
  id: randomUUID(),
  kind: "quote",
  name: "Review Customer",
  phone: "9026271638",
  city: "Delhi NCR",
  message: "I would like to discuss a 2 BHK interior project.",
  consent: true,
  website: "",
  ...overrides,
});

async function setup(t, options = {}) {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "luxe-enquiry-delivery-"));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const directory = path.join(temporary, "private-requests");
  return {
    directory,
    delivery: createEnquiryDelivery({
      enabled: true,
      origins: [origin],
      directory,
      notify: async () => ({ providerMessageId: "test-provider-acceptance" }),
      ...options,
    }),
  };
}

async function submit(delivery, payload = request(), options = {}) {
  const body = options.body ?? JSON.stringify(payload);
  const chunks = options.chunks || [Buffer.from(body)];
  const req = Readable.from(chunks);
  req.method = options.method || "POST";
  req.headers = {
    origin,
    "content-type": "application/json",
    ...options.headers,
  };
  req.socket = { remoteAddress: options.address || "127.0.0.1" };
  const headers = new Map();
  const res = {
    writableEnded: false,
    destroyed: false,
    setHeader(key, value) {
      headers.set(key.toLowerCase(), value);
    },
    writeHead(code, values) {
      this.statusCode = code;
      for (const [key, value] of Object.entries(values)) headers.set(key.toLowerCase(), value);
    },
    end(value) {
      this.writableEnded = true;
      this.body = value ? JSON.parse(value) : undefined;
    },
  };
  await delivery.handle(req, res);
  req.destroy();
  return { status: res.statusCode, body: res.body, headers };
}

test("automatic delivery defaults off and missing account, origins or durable directory cannot activate it", async (t) => {
  let calls = 0;
  const { directory } = await setup(t);
  const defaults = { origins: [origin], directory, notify: async () => calls++ };
  for (const options of [
    {},
    defaults,
    { ...defaults, enabled: true, directory: undefined },
    { ...defaults, enabled: true, directory: "relative-directory" },
    { ...defaults, enabled: true, notify: null },
    { ...defaults, enabled: true, origins: [] },
    { ...defaults, enabled: true, origins: [origin + "/path"] },
  ]) {
    const delivery = createEnquiryDelivery(options);
    assert.deepEqual(delivery.status(), { enabled: false, channel: "whatsapp" });
    assert.equal((await submit(delivery)).status, 503);
  }
  assert.equal(calls, 0);
  await assert.rejects(stat(directory), { code: "ENOENT" });
});

test("only same-origin JSON POST requests with the complete consent schema are accepted", async (t) => {
  let calls = 0;
  const { delivery, directory } = await setup(t, {
    rateLimit: 100,
    notify: async () => {
      calls++;
      return { providerMessageId: "accepted" };
    },
  });
  assert.equal((await submit(delivery, request(), { method: "GET" })).status, 405);
  for (const invalidOrigin of [
    undefined,
    "null",
    "https://luxeinfra.in.evil.test",
    "http://luxeinfra.in",
  ])
    assert.equal(
      (await submit(delivery, request(), { headers: { origin: invalidOrigin } })).status,
      403,
    );
  assert.equal(
    (await submit(delivery, request(), { headers: { "content-type": "text/plain" } })).status,
    415,
  );
  assert.equal(
    (await submit(delivery, request(), { headers: { "content-encoding": "gzip" } })).status,
    415,
  );
  for (const invalid of [
    request({ id: "../../outside" }),
    request({ kind: "other" }),
    request({ name: "" }),
    request({ name: "x".repeat(81) }),
    request({ city: "x".repeat(101) }),
    request({ phone: "1234567890" }),
    request({ message: "x".repeat(10001) }),
    request({ message: "hello\u0000" }),
    request({ consent: false }),
    request({ website: "spam.example" }),
    request({ unexpected: "not accepted" }),
    [],
  ])
    assert.equal((await submit(delivery, invalid)).status, 400);
  assert.equal((await submit(delivery, null, { body: "{broken" })).status, 400);
  assert.equal(calls, 0);
  await assert.rejects(stat(directory), { code: "ENOENT" });
});

test("request size is bounded in bytes for declared and streamed bodies", async (t) => {
  const { delivery, directory } = await setup(t);
  assert.equal(
    (await submit(delivery, request(), { headers: { "content-length": String(64 * 1024 + 1) } }))
      .status,
    413,
  );
  assert.equal(
    (await submit(delivery, null, { body: JSON.stringify(request()) + " ".repeat(64 * 1024) }))
      .status,
    413,
  );
  assert.equal(
    (await submit(delivery, null, { chunks: [Buffer.alloc(32000), Buffer.alloc(34000)] })).status,
    413,
  );
  await assert.rejects(stat(directory), { code: "ENOENT" });
});

test("a maximum-length Hindi brief is accepted and preserved across notification and private storage", async (t) => {
  const payload = request({ name: "आरव शर्मा", city: "ग़ाज़ियाबाद", message: "घर".repeat(5000) });
  assert.equal(payload.message.length, 10000);
  assert.ok(Buffer.byteLength(JSON.stringify(payload), "utf8") > 24 * 1024);
  let notified;
  const { delivery, directory } = await setup(t, {
    notify: async (value) => {
      notified = value;
      return { providerMessageId: "accepted-hindi-brief" };
    },
  });
  const response = await submit(delivery, payload);
  assert.equal(response.status, 202);
  assert.equal(notified.message, payload.message);
  assert.equal(notified.name, payload.name);
  assert.equal(notified.city, payload.city);
  const saved = JSON.parse(await readFile(path.join(directory, payload.id + ".json"), "utf8"));
  assert.equal(saved.request.message, payload.message);
  assert.equal(saved.state, "accepted");
});

test("provider acceptance follows private durable persistence and returns only a public reference", async (t) => {
  const payload = request({
    name: "  Review   Customer  ",
    phone: "+91 (90262) 71638",
    city: " Delhi ",
  });
  let directory;
  let notification;
  const fixture = await setup(t, {
    notify: async (value) => {
      notification = value;
      const saved = JSON.parse(await readFile(path.join(directory, payload.id + ".json"), "utf8"));
      assert.equal(saved.state, "provider_pending");
      assert.equal(saved.consent.accepted, true);
      assert.equal(saved.request.phone, "+919026271638");
      return { providerMessageId: "provider-private-message-id" };
    },
  });
  directory = fixture.directory;
  assert.equal(fixture.delivery.status().enabled, true);
  const result = await submit(fixture.delivery, payload);
  assert.equal(result.status, 202);
  assert.equal(result.body.state, "accepted");
  assert.match(result.body.reference, /^LX-\d{8}-[A-F0-9]{12}$/);
  assert.deepEqual(Object.keys(result.body).sort(), ["reference", "state"]);
  assert.equal(notification.name, "Review Customer");
  assert.equal(notification.city, "Delhi");
  assert.equal(notification.phone, "+919026271638");
  assert.equal(notification.message, payload.message);
  const files = await readdir(directory);
  assert.deepEqual(files, [payload.id + ".json"]);
  const saved = JSON.parse(await readFile(path.join(directory, files[0]), "utf8"));
  assert.equal(saved.state, "accepted");
  assert.equal(saved.providerMessageId, "provider-private-message-id");
  assert.equal(saved.reference, result.body.reference);
  assert.equal(result.headers.get("cache-control"), "no-store");
  if (process.platform !== "win32") {
    assert.equal((await stat(directory)).mode & 0o077, 0);
    assert.equal((await stat(path.join(directory, files[0]))).mode & 0o077, 0);
  }
});

test("concurrent duplicate submits notify once and conflicting payloads cannot reuse an ID", async (t) => {
  let calls = 0;
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  const { delivery, directory } = await setup(t, {
    notify: async () => {
      calls++;
      await gate;
      return { providerMessageId: "provider-accepted-once" };
    },
  });
  const payload = request();
  const first = submit(delivery, payload);
  const second = submit(delivery, payload);
  const conflict = await submit(delivery, { ...payload, message: "Changed project" });
  assert.equal(conflict.status, 409);
  release();
  const [one, two] = await Promise.all([first, second]);
  assert.equal(one.status, 202);
  assert.deepEqual(one.body, two.body);
  assert.equal(calls, 1);
  assert.equal((await submit(delivery, { ...payload, city: "Bengaluru" })).status, 409);
  const restarted = createEnquiryDelivery({
    enabled: true,
    origins: [origin],
    directory,
    notify: async () => {
      throw new Error("A restart must not send again");
    },
  });
  const repeated = await submit(restarted, payload);
  assert.equal(repeated.status, 202);
  assert.deepEqual(repeated.body, one.body);
});

test("separate server instances use an atomic claim before contacting the provider", async (t) => {
  let calls = 0;
  let release;
  let started;
  const gate = new Promise((resolve) => (release = resolve));
  const providerStarted = new Promise((resolve) => (started = resolve));
  const notify = async () => {
    calls++;
    started();
    await gate;
    return { providerMessageId: "single-atomic-acceptance" };
  };
  const { delivery, directory } = await setup(t, { notify });
  const other = createEnquiryDelivery({ enabled: true, origins: [origin], directory, notify });
  const payload = request();
  const first = submit(delivery, payload);
  await providerStarted;
  const second = await submit(other, payload);
  assert.equal(second.status, 503);
  assert.equal(second.body.state, "provider_pending");
  assert.equal(calls, 1);
  release();
  const accepted = await first;
  assert.equal(accepted.status, 202);
  assert.equal(second.body.reference, accepted.body.reference);
  assert.deepEqual((await submit(other, payload)).body, accepted.body);
  assert.equal(calls, 1);
});

test("provider rejection is generic, durable and cannot be automatically retried", async (t) => {
  let calls = 0;
  const { delivery, directory } = await setup(t, {
    notify: async () => {
      calls++;
      throw Object.assign(new Error("Secret token/provider account information"), {
        deliveryState: "failed",
      });
    },
  });
  const payload = request();
  const first = await submit(delivery, payload);
  const retry = await submit(delivery, payload);
  assert.equal(first.status, 503);
  assert.equal(first.body.state, "failed");
  assert.deepEqual(retry.body, first.body);
  assert.doesNotMatch(JSON.stringify(first.body), /Secret|token|provider account/);
  assert.equal(calls, 1);
  const record = await readFile(path.join(directory, payload.id + ".json"), "utf8");
  assert.doesNotMatch(record, /Secret|token|provider account/);
  assert.equal(JSON.parse(record).state, "failed");
});

test("timeout and ambiguous provider responses remain uncertain instead of inviting duplicate sends", async (t) => {
  let calls = 0;
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  const { delivery, directory } = await setup(t, {
    deliveryTimeoutMs: 10,
    notify: async () => {
      calls++;
      await gate;
      return { providerMessageId: "late-acceptance" };
    },
  });
  const payload = request();
  // Keep the process alive while testing the unref'd production timeout.
  const keepAlive = setTimeout(() => {}, 1000);
  const result = await submit(delivery, payload);
  clearTimeout(keepAlive);
  assert.equal(result.status, 503);
  assert.equal(result.body.state, "uncertain");
  assert.equal((await submit(delivery, payload)).body.reference, result.body.reference);
  assert.equal(calls, 1);
  release();
  await gate;
  const record = JSON.parse(await readFile(path.join(directory, payload.id + ".json"), "utf8"));
  assert.equal(record.state, "uncertain");
  const ambiguous = await setup(t, { notify: async () => ({}) });
  const missingReceipt = await submit(ambiguous.delivery);
  assert.equal(missingReceipt.status, 503);
  assert.equal(missingReceipt.body.state, "uncertain");
});

test("rate limiting trusts the socket address, expires predictably and does not persist rejected requests", async (t) => {
  let now = Date.now();
  let calls = 0;
  const { delivery, directory } = await setup(t, {
    clock: () => now,
    rateLimit: 2,
    rateWindowMs: 1000,
    notify: async () => {
      calls++;
      return { providerMessageId: "accepted" };
    },
  });
  assert.equal((await submit(delivery)).status, 202);
  assert.equal((await submit(delivery)).status, 202);
  const blocked = await submit(delivery, request(), { headers: { "x-forwarded-for": "10.1.1.1" } });
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get("retry-after"), "1");
  assert.equal(calls, 2);
  assert.equal((await readdir(directory)).length, 2);
  now += 1001;
  assert.equal((await submit(delivery)).status, 202);
  assert.equal(calls, 3);
});

test("the number of active provider calls is bounded and unsafe storage never calls a provider", async (t) => {
  let calls = 0;
  let release;
  let started;
  const gate = new Promise((resolve) => (release = resolve));
  const began = new Promise((resolve) => (started = resolve));
  const { delivery } = await setup(t, {
    maxConcurrent: 1,
    notify: async () => {
      calls++;
      started();
      await gate;
      return { providerMessageId: "accepted" };
    },
  });
  const first = submit(delivery);
  await began;
  const blockedPayload = request();
  const blocked = await submit(delivery, blockedPayload);
  assert.equal(blocked.status, 503);
  assert.equal(blocked.body.reference, undefined);
  assert.equal(calls, 1);
  release();
  assert.equal((await first).status, 202);
  assert.equal((await submit(delivery, blockedPayload)).status, 202);
  assert.equal(calls, 2);
  const invalidStorage = createEnquiryDelivery({
    enabled: true,
    origins: [origin],
    directory: path.resolve(import.meta.dirname, "enquiry-delivery.test.mjs"),
    notify: async () => calls++,
  });
  assert.equal((await submit(invalidStorage)).status, 503);
  assert.equal(calls, 2);
});
