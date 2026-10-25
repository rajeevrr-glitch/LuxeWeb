import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aiConfig,
  generateRoom,
  generationFailure,
  photoAspectRatio,
  roomPrompt,
} from "../scripts/visualiser-provider.mjs";

const image = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+cS6kAAAAASUVORK5CYII=",
  "base64",
);
const config = aiConfig({
  LUXE_AI_PROVIDER: "gemini",
  LUXE_AI_ENABLED: "true",
  GEMINI_API_KEY: "test-only-placeholder",
});
const response = (parts, extras = {}) =>
  new Response(
    JSON.stringify({ candidates: [{ finishReason: "STOP", content: { parts }, ...extras }] }),
  );

test("restyling omits absent measurements and carries selected changes, retained features and region guidance", () => {
  const prompt = roomPrompt({
    room: "Master bedroom",
    style: "Warm minimal",
    unit: "feet",
    changes: "Add storage and warm light.",
    keep: "Keep the window.",
    requestedChanges: ["furniture", "lighting"],
    preserve: ["flooring"],
    editArea: { x: 0.5, y: 0.2, width: 0.4, height: 0.6 },
  });
  assert.match(prompt, /Not supplied/);
  assert.match(prompt, /camera position/);
  assert.match(prompt, /50% from the left, 20% from the top/);
  assert.match(prompt, /Retain the existing floor/);
  assert.doesNotMatch(prompt, /undefined|NaN/);
  assert.equal(photoAspectRatio(1024, 768), "4:3");
  assert.equal(photoAspectRatio(768, 1024), "3:4");
  assert.equal(photoAspectRatio(0, 768), "1:1");
});

test("both shortlisted models receive one matched-aspect photo edit without a retry", async () => {
  for (const model of ["gemini-nano-banana-2.1", "gemini-3-pro-image"]) {
    let calls = 0;
    const result = await generateRoom({
      config: { ...config, model },
      photo: image,
      prompt: "Same room. Keep openings.",
      aspectRatio: "4:3",
      fetcher: async (url, options) => {
        calls++;
        assert.ok(url.endsWith(model + ":generateContent"));
        const body = JSON.parse(options.body);
        assert.equal(body.generationConfig.candidateCount, 1);
        assert.deepEqual(body.generationConfig.imageConfig, {
          imageSize: "1K",
          aspectRatio: "4:3",
        });
        return response([
          { inlineData: { mimeType: "image/png", data: image.toString("base64") } },
        ]);
      },
    });
    assert.equal(calls, 1);
    assert.deepEqual(result, image);
  }
});

test("Gemini needs an explicit switch and key; unknown providers or unsafe model names fail closed", () => {
  assert.equal(aiConfig({ GEMINI_API_KEY: "placeholder" }).enabled, false);
  assert.equal(aiConfig({ LUXE_AI_PROVIDER: "gemini", LUXE_AI_ENABLED: "true" }).enabled, false);
  assert.equal(config.provider, "gemini");
  assert.equal(config.model, "gemini-nano-banana-2.1");
  assert.equal(config.label, "Google Gemini");
  assert.equal(config.maxAttempts, 2);
  assert.equal(
    aiConfig({
      LUXE_AI_PROVIDER: "typo",
      LUXE_AI_ENABLED: "true",
      HF_TOKEN: "placeholder",
      GEMINI_API_KEY: "placeholder",
    }).enabled,
    false,
  );
  assert.equal(
    aiConfig({
      LUXE_AI_PROVIDER: "gemini",
      LUXE_AI_ENABLED: "true",
      GEMINI_API_KEY: "placeholder",
      GEMINI_IMAGE_MODEL: "../other?key=leak",
    }).enabled,
    false,
  );
});

test("a confirmed free Gemini account cannot start paid image generation", async () => {
  const free = aiConfig({
    GEMINI_API_KEY: "test-only-placeholder",
    LUXE_AI_ENABLED: "true",
    GEMINI_API_TIER: "free",
  });
  assert.equal(free.enabled, false);
  assert.equal(free.blockedReason, "billing_required");
  let calls = 0;
  await assert.rejects(
    generateRoom({
      config: free,
      fetcher: async () => {
        calls++;
      },
    }),
    /not enabled/,
  );
  assert.equal(calls, 0);
  assert.equal(
    aiConfig({
      GEMINI_API_KEY: "test-only-placeholder",
      LUXE_AI_ENABLED: "true",
      GEMINI_API_TIER: "paid",
    }).enabled,
    true,
  );
});

test("Gemini sends one image edit with a server header, bounded output and the cancellation signal", async () => {
  let calls = 0;
  const signal = new AbortController().signal;
  const result = await generateRoom({
    config,
    photo: image,
    prompt: "Keep the room. Add storage.",
    signal,
    fetcher: async (url, options) => {
      calls++;
      assert.equal(
        url,
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-nano-banana-2.1:generateContent",
      );
      assert.ok(!url.includes(config.key));
      assert.equal(options.headers["x-goog-api-key"], config.key);
      assert.equal(options.redirect, "error");
      assert.equal(options.signal, signal);
      const body = JSON.parse(options.body);
      assert.equal(body.contents[0].parts[0].text, "Keep the room. Add storage.");
      assert.equal(body.contents[0].parts[1].inlineData.data, image.toString("base64"));
      assert.equal(body.contents[0].parts[1].inlineData.mimeType, "image/jpeg");
      assert.equal(body.generationConfig.candidateCount, 1);
      assert.equal(body.generationConfig.imageConfig.imageSize, "1K");
      assert.ok(!options.body.includes(config.key));
      return response([
        { text: "Concept" },
        { thought: true, inlineData: { mimeType: "image/png", data: "not-used" } },
        { inlineData: { mimeType: "image/png", data: image.toString("base64") } },
      ]);
    },
  });
  assert.equal(calls, 1);
  assert.deepEqual(result, image);
});

test("Gemini refusal, text-only, unsupported data and malformed base64 never become a concept", async () => {
  for (const result of [
    response([{ text: "No image" }]),
    response([{ inlineData: { mimeType: "text/html", data: image.toString("base64") } }]),
    response([{ inlineData: { mimeType: "image/png", data: "%%%invalid%%%" } }]),
    response([{ inlineData: { mimeType: "image/png", data: image.toString("base64") } }], {
      finishReason: "IMAGE_SAFETY",
    }),
  ])
    await assert.rejects(
      generateRoom({ config, photo: image, prompt: "Room", fetcher: async () => result }),
      (error) => ["no_image", "content_blocked"].includes(generationFailure(error).code),
    );
});

test("provider failures produce actionable codes without forwarding private error contents", async () => {
  const cases = [
    [400, {}, "request_rejected"],
    [401, {}, "key_rejected"],
    [402, {}, "billing_required"],
    [403, {}, "access_denied"],
    [404, {}, "model_unavailable"],
    [429, {}, "quota_exceeded"],
    [503, {}, "provider_busy"],
    [403, { details: [{ reason: "BILLING_DISABLED" }] }, "billing_required"],
    [
      429,
      {
        details: [
          {
            violations: [
              {
                quotaMetric:
                  "generativelanguage.googleapis.com/generate_content_free_tier_requests",
              },
            ],
          },
        ],
      },
      "billing_required",
    ],
  ];
  for (const [status, fields, expected] of cases) {
    let calls = 0;
    await assert.rejects(
      generateRoom({
        config,
        photo: image,
        prompt: "Room",
        fetcher: async () => {
          calls++;
          return new Response(
            JSON.stringify({
              error: { ...fields, message: config.key + " private room description" },
            }),
            { status },
          );
        },
      }),
      (error) => {
        const safe = generationFailure(error);
        assert.equal(safe.code, expected);
        assert.equal(safe.status, status);
        assert.ok(safe.message.length > 10);
        assert.doesNotMatch(JSON.stringify(safe), /test-only-placeholder|private room description/);
        return true;
      },
    );
    assert.equal(calls, 1);
  }
});

test("oversized, malformed and unstructured provider errors retain safe HTTP classification", async () => {
  for (const body of [
    "not json",
    new Uint8Array(64 * 1024 + 1),
    JSON.stringify({ error: { details: "untrusted" } }),
  ]) {
    await assert.rejects(
      generateRoom({
        config,
        photo: image,
        prompt: "Room",
        fetcher: async () => new Response(body, { status: 429 }),
      }),
      (error) => generationFailure(error).code === "quota_exceeded",
    );
  }
  assert.equal(generationFailure(new TypeError("private endpoint and key")).code, "network_error");
  assert.equal(generationFailure(new Error("private provider text"), true).code, "timeout");
  assert.equal(generationFailure(new Error("private provider text")).code, "unknown");
  assert.doesNotMatch(
    JSON.stringify(generationFailure(new Error("private provider text"))),
    /private provider text/,
  );
});

test("Gemini rejects provider errors without exposing their payload or retrying", async () => {
  let calls = 0;
  await assert.rejects(
    generateRoom({
      config,
      photo: image,
      prompt: "Room",
      fetcher: async () => {
        calls++;
        return new Response("private-provider-payload", { status: 429 });
      },
    }),
    (error) =>
      error.message === "Image provider could not complete the request." && error.status === 429,
  );
  assert.equal(calls, 1);
});

test("Gemini responses stop at the size bound before image decoding", async () => {
  await assert.rejects(
    generateRoom({
      config,
      photo: image,
      prompt: "Room",
      fetcher: async () => new Response(new Uint8Array(22 * 1024 * 1024 + 1)),
    }),
    /Image response too large/,
  );
});
