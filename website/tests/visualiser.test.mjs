import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { createVisualiserServer } from "../scripts/visualiser-server.mjs";
import { aiConfig, generateRoom } from "../scripts/visualiser-provider.mjs";
const origin = "http://127.0.0.1:5173";
const fixture = await sharp({
  create: { width: 320, height: 256, channels: 3, background: "#d5e1ed" },
})
  .withMetadata()
  .jpeg()
  .toBuffer();
const brief = () => ({
  id: randomUUID(),
  room: "Kitchen",
  style: "Warm minimal",
  length: 12,
  width: 10,
  height: 9,
  unit: "feet",
  changes: "Add concealed storage and warm lighting.",
  keep: "Keep the window.",
  consent: true,
  provider: "huggingface",
});
const lead = () => ({
  id: randomUUID(),
  name: "Test Person",
  phone: "9876543210",
  city: "Lucknow",
  room: "Kitchen",
  style: "Warm minimal",
  consent: true,
  website: "",
});
async function setup(t, options = {}) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "luxe-ai-test-"));
  const usageFile = path.join(dir, "usage.json");
  let calls = 0;
  const config = options.config || {
    enabled: true,
    provider: "huggingface",
    label: "TEST FIXTURE — NOT AI",
    maxAttempts: 2,
  };
  const server = createVisualiserServer({
    config,
    usageFile,
    generate: async ({ photo, prompt }) => {
      calls++;
      assert.match(prompt, /Keep the window/);
      assert.doesNotMatch(prompt, /Test Person|9876543210|Lucknow/);
      assert.equal((await sharp(photo).metadata()).exif, undefined);
      return fixture;
    },
    ...options,
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const url = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    assert.ok(dir.startsWith(path.join(os.tmpdir(), "luxe-ai-test-")));
    await rm(dir, { recursive: true, force: true });
  });
  async function capture(data, cookie, source = origin) {
    return fetch(url + "/api/visualiser/leads", {
      method: "POST",
      headers: { Cookie: cookie, Origin: source, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }
  async function session({ captureLead = true } = {}) {
    const response = await fetch(url + "/api/visualiser/status");
    const result = {
      cookie: response.headers.get("set-cookie").split(";")[0],
      status: await response.json(),
    };
    if (captureLead) assert.equal((await capture(lead(), result.cookie)).status, 201);
    return result;
  }
  async function send(data, cookie, bytes = fixture, contentType = "image/jpeg", source = origin) {
    const body = new FormData();
    body.append("brief", JSON.stringify(data));
    body.append("photo", new Blob([bytes], { type: contentType }), "room.jpg");
    return fetch(url + "/api/visualiser/jobs", {
      method: "POST",
      headers: { Cookie: cookie, Origin: source },
      body,
    });
  }
  async function get(id, cookie, suffix = "") {
    return fetch(`${url}/api/visualiser/jobs/${id}${suffix}`, { headers: { Cookie: cookie } });
  }
  async function done(id, cookie) {
    for (let i = 0; i < 100; i++) {
      const job = await (await get(id, cookie)).json();
      if (job.state !== "generating") return job;
      await new Promise((r) => setTimeout(r, 10));
    }
    throw new Error("Test generation did not finish");
  }
  return {
    server,
    config,
    usageFile,
    leadDirectory: path.join(dir, "room-enquiries"),
    url,
    session,
    capture,
    send,
    get,
    done,
    calls: () => calls,
  };
}
test("room concepts require server-side contact capture before any paid attempt", async (t) => {
  const s = await setup(t);
  const { cookie, status } = await s.session({ captureLead: false });
  assert.equal(status.captureAvailable, true);
  const denied = await s.send(brief(), cookie);
  assert.equal(denied.status, 403);
  assert.equal((await denied.json()).code, "contact_required");
  assert.equal(s.calls(), 0);
  await assert.rejects(readFile(s.usageFile), { code: "ENOENT" });
  const contact = lead();
  const receipt = await s.capture(contact, cookie);
  assert.equal(receipt.status, 201);
  const saved = await receipt.json();
  assert.match(saved.reference, /^LR-[A-F0-9]{16}$/);
  assert.equal(saved.state, "saved_locally");
  const same = await s.capture(contact, cookie);
  assert.deepEqual(await same.json(), saved);
  assert.equal((await s.capture({ ...contact, city: "Noida" }, cookie)).status, 409);
  const record = JSON.parse(
    await readFile(path.join(s.leadDirectory, contact.id + ".json"), "utf8"),
  );
  assert.deepEqual(record.contact, { name: contact.name, phone: "+919876543210", city: "Lucknow" });
  assert.equal(record.consent.accepted, true);
  assert.equal(record.state, "saved_locally");
  assert.equal("photo" in record, false);
  assert.equal("prompt" in record, false);
  assert.equal((await readdir(s.leadDirectory)).length, 1);
  const b = brief();
  assert.equal((await s.send(b, cookie)).status, 202);
  assert.equal((await s.done(b.id, cookie)).state, "completed");
  const other = await s.session({ captureLead: false });
  assert.equal((await s.send(brief(), other.cookie)).status, 403);
  assert.equal((await s.get(b.id, other.cookie, "/concept")).status, 404);
  assert.equal(s.calls(), 1);
});

test("contact capture enforces origin, session, separate consent and bounded personal details", async (t) => {
  const s = await setup(t);
  const { cookie } = await s.session({ captureLead: false });
  for (const values of [
    { consent: false },
    { name: "x" },
    { phone: "123" },
    { city: "x" },
    { name: "Test\nInjected" },
    { photo: "not-allowed" },
    { website: "spam" },
  ])
    assert.equal((await s.capture({ ...lead(), ...values }, cookie)).status, 400);
  assert.equal((await s.capture(lead(), cookie, "https://outside.example")).status, 403);
  assert.equal((await s.capture(lead(), "")).status, 401);
  assert.equal(
    (await fetch(s.url + "/api/visualiser/leads", { headers: { Cookie: cookie } })).status,
    404,
  );
  assert.equal(s.calls(), 0);
  await assert.rejects(readFile(s.usageFile), { code: "ENOENT" });
  for (let i = 0; i < 3; i++) assert.equal((await s.capture(lead(), cookie)).status, 201);
  assert.equal((await s.capture(lead(), cookie)).status, 429);
});

test("private contact capture works when image allowance is exhausted without generating", async (t) => {
  const s = await setup(t, {
    config: { enabled: true, provider: "gemini", label: "TEST", maxAttempts: 0 },
  });
  const { cookie } = await s.session({ captureLead: false });
  assert.equal((await s.capture(lead(), cookie)).status, 201);
  assert.equal((await s.send({ ...brief(), provider: "gemini" }, cookie)).status, 429);
  assert.equal(s.calls(), 0);
  await assert.rejects(readFile(s.usageFile), { code: "ENOENT" });
});
test("a failed private save never unlocks generation", async (t) => {
  const s = await setup(t);
  const { cookie } = await s.session({ captureLead: false });
  await writeFile(s.leadDirectory, "This is not a directory.");
  const result = await s.capture(lead(), cookie);
  assert.equal(result.status, 503);
  assert.equal((await s.send(brief(), cookie)).status, 403);
  assert.equal(s.calls(), 0);
  await assert.rejects(readFile(s.usageFile), { code: "ENOENT" });
});
test("AI is off by default and a disabled endpoint cannot call a provider", async (t) => {
  assert.equal(aiConfig({}).enabled, false);
  assert.equal(aiConfig({ LUXE_AI_ENABLED: "true" }).enabled, false);
  const s = await setup(t, {
    config: { enabled: false, provider: "huggingface", label: "HF", maxAttempts: 2 },
  });
  const { cookie, status } = await s.session();
  assert.equal(status.enabled, false);
  assert.equal((await s.send(brief(), cookie)).status, 503);
  assert.equal(s.calls(), 0);
  await assert.rejects(generateRoom({ config: aiConfig({}) }), /not enabled/);
});

test("OpenAI adapter sends one image edit and decodes its result without external traffic", async () => {
  let calls = 0;
  const result = await generateRoom({
    config: {
      enabled: true,
      key: "test-only-placeholder",
      provider: "openai",
      model: "test-model",
    },
    photo: fixture,
    prompt: "Keep the room; add storage.",
    fetcher: async (url, options) => {
      calls++;
      assert.equal(url, "https://api.openai.com/v1/images/edits");
      assert.equal(options.method, "POST");
      assert.equal(options.headers.Authorization, "Bearer test-only-placeholder");
      assert.equal(options.body.get("n"), "1");
      assert.equal(options.body.get("model"), "test-model");
      assert.equal(options.body.get("image[]").type, "image/jpeg");
      return new Response(JSON.stringify({ data: [{ b64_json: fixture.toString("base64") }] }));
    },
  });
  assert.equal(calls, 1);
  assert.deepEqual(result, fixture);
});
test("consent, photo signature, dimensions, origin and session are enforced before generation", async (t) => {
  const s = await setup(t);
  const { cookie } = await s.session();
  assert.equal((await s.send({ ...brief(), consent: false }, cookie)).status, 400);
  assert.equal((await s.send({ ...brief(), unit: "metres", width: 100 }, cookie)).status, 400);
  assert.equal((await s.send({ ...brief(), length: 0.5 }, cookie)).status, 400);
  assert.equal((await s.send(brief(), cookie, Buffer.from("not an image"))).status, 400);
  assert.equal((await s.send(brief(), cookie, fixture, "image/png")).status, 400);
  assert.equal(
    (await s.send(brief(), cookie, fixture, "image/jpeg", "https://outside.example")).status,
    403,
  );
  assert.equal((await s.send(brief(), "")).status, 401);
  assert.equal(s.calls(), 0);
});
test("Gemini room requests use the same private session and consent checks", async (t) => {
  const s = await setup(t, {
    config: { enabled: true, provider: "gemini", label: "Google Gemini", maxAttempts: 2 },
  });
  const { cookie, status } = await s.session();
  assert.equal(status.provider, "gemini");
  assert.equal(status.providerLabel, "Google Gemini");
  const request = { ...brief(), provider: "gemini" };
  assert.equal((await s.send({ ...request, consent: false }, cookie)).status, 400);
  assert.equal((await s.send(request, cookie)).status, 202);
  assert.equal((await s.done(request.id, cookie)).state, "completed");
  assert.equal(s.calls(), 1);
  const other = await s.session();
  assert.equal((await s.get(request.id, other.cookie, "/concept")).status, 404);
});

test("photo restyling needs no dimensions and rejects partial measurements, conflicting keep choices or an invalid marked area", async (t) => {
  let calls = 0;
  const s = await setup(t, {
    config: { enabled: true, provider: "gemini", label: "TEST", maxAttempts: 2 },
    generate: async ({ prompt, aspectRatio }) => {
      calls++;
      assert.match(prompt, /Not supplied/);
      assert.equal(aspectRatio, "5:4");
      return fixture;
    },
  });
  const { cookie } = await s.session();
  const request = {
    ...brief(),
    provider: "gemini",
    length: undefined,
    width: undefined,
    height: undefined,
    requestedChanges: ["lighting"],
    preserve: ["flooring"],
  };
  assert.equal((await s.send({ ...request, length: 12 }, cookie)).status, 400);
  assert.equal(
    (await s.send({ ...request, editArea: { x: 0.8, y: 0, width: 0.5, height: 0.5 } }, cookie))
      .status,
    400,
  );
  assert.equal((await s.send({ ...request, requestedChanges: ["flooring"] }, cookie)).status, 400);
  assert.equal(calls, 0);
  assert.equal((await s.send(request, cookie)).status, 202);
  assert.equal((await s.done(request.id, cookie)).state, "completed");
  assert.equal(calls, 1);
});
test("completed image stays session-private; retries deduplicate and metadata is stripped", async (t) => {
  const s = await setup(t);
  const { cookie } = await s.session();
  const b = { ...brief(), unit: "metres", length: 30.48, width: 0.305, height: 9.144 };
  assert.equal((await s.send(b, cookie)).status, 202);
  const job = await s.done(b.id, cookie);
  assert.equal(job.state, "completed");
  assert.equal((await s.send(b, cookie)).status, 202);
  assert.equal(s.calls(), 1);
  assert.equal((await s.send({ ...b, keep: "Different" }, cookie)).status, 409);
  const image = await s.get(b.id, cookie, "/concept");
  assert.equal(image.status, 200);
  assert.equal(image.headers.get("cache-control"), "no-store");
  assert.equal((await sharp(Buffer.from(await image.arrayBuffer())).metadata()).exif, undefined);
  const other = await s.session();
  assert.equal((await s.get(b.id, other.cookie, "/concept")).status, 404);
  assert.deepEqual(JSON.parse(await readFile(s.usageFile, "utf8")), { attempts: 1 });
  const deleted = await fetch(`${s.url}/api/visualiser/jobs/${b.id}`, {
    method: "DELETE",
    headers: { Cookie: cookie, Origin: origin },
  });
  assert.equal(deleted.status, 200);
  assert.equal((await s.get(b.id, cookie)).status, 404);
});
test("failed provider attempts consume the persistent pilot allowance without exposing errors", async (t) => {
  let calls = 0;
  const s = await setup(t, {
    config: { enabled: true, provider: "huggingface", label: "TEST", maxAttempts: 1 },
    generate: async () => {
      calls++;
      throw new Error("secret-provider-detail");
    },
  });
  const { cookie } = await s.session();
  const b = brief();
  assert.equal((await s.send(b, cookie)).status, 202);
  const job = await s.done(b.id, cookie);
  assert.equal(job.state, "failed");
  assert.doesNotMatch(JSON.stringify(job), /secret-provider-detail/);
  assert.equal((await s.send(brief(), cookie)).status, 429);
  assert.equal(calls, 1);
  assert.equal((await s.session()).status.remaining, 0);
  const restarted = createVisualiserServer({ config: s.config, usageFile: s.usageFile });
  await new Promise((r) => restarted.listen(0, "127.0.0.1", r));
  try {
    const result = await fetch(
      `http://127.0.0.1:${restarted.address().port}/api/visualiser/status`,
    ).then((r) => r.json());
    assert.equal(result.remaining, 0);
  } finally {
    restarted.closeAllConnections();
    await new Promise((r) => restarted.close(r));
  }
});

test("a free Gemini account shows its billing block before any photo can be sent", async (t) => {
  const s = await setup(t, {
    config: aiConfig({
      GEMINI_API_KEY: "test-only-placeholder",
      LUXE_AI_ENABLED: "true",
      GEMINI_API_TIER: "free",
    }),
  });
  const { cookie, status } = await s.session();
  assert.equal(status.enabled, false);
  assert.equal(status.reason, "billing_required");
  assert.match(status.message, /paid image-generation access/);
  assert.equal(status.remaining, 2);
  assert.equal((await s.send({ ...brief(), provider: "gemini" }, cookie)).status, 503);
  assert.equal(s.calls(), 0);
  await assert.rejects(readFile(s.usageFile), { code: "ENOENT" });
});

test("Gemini quota failures reach the user safely and do not cause another provider call", async (t) => {
  const diagnostics = [];
  let calls = 0;
  const config = aiConfig({ GEMINI_API_KEY: "test-only-placeholder", LUXE_AI_ENABLED: "true" });
  const s = await setup(t, {
    config,
    onFailure: (value) => diagnostics.push(value),
    generate: (options) =>
      generateRoom({
        ...options,
        fetcher: async () => {
          calls++;
          return new Response(
            JSON.stringify({ error: { message: "secret-provider-detail " + config.key } }),
            { status: 429 },
          );
        },
      }),
  });
  const { cookie } = await s.session();
  const b = { ...brief(), provider: "gemini" };
  assert.equal((await s.send(b, cookie)).status, 202);
  const job = await s.done(b.id, cookie);
  assert.equal(job.state, "failed");
  assert.equal(job.errorCode, "quota_exceeded");
  assert.match(job.error, /quota or rate limit/);
  assert.deepEqual(diagnostics, [{ provider: "gemini", code: "quota_exceeded", status: 429 }]);
  assert.doesNotMatch(
    JSON.stringify({ job, diagnostics }),
    /secret-provider-detail|test-only-placeholder/,
  );
  assert.equal((await s.send(b, cookie)).status, 202);
  assert.equal(calls, 1);
  assert.equal((await s.session()).status.remaining, 1);
});
