import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createWhatsAppNotifier,
  whatsappConfigurationReady,
} from "../scripts/whatsapp-notification.mjs";

const settings = {
  LUXE_WHATSAPP_ACCESS_TOKEN: "synthetic_private_token_for_unit_tests",
  LUXE_WHATSAPP_PHONE_NUMBER_ID: "123456789012345",
  LUXE_WHATSAPP_RECIPIENT: "919876543210",
  LUXE_WHATSAPP_TEMPLATE: "website_request_summary",
  LUXE_WHATSAPP_LANGUAGE: "en_US",
  // Synthetic explicit version; this test neither chooses nor contacts a live version.
  LUXE_WHATSAPP_GRAPH_VERSION: "v99.0",
};
const request = {
  reference: "LX-20261023-abc123",
  kind: "Quote request",
  name: "Example Customer",
  phone: "+91 9876543210",
  city: "Example city",
  message: "Customer requested a two-bedroom interior consultation.",
};
const accepted = () =>
  Response.json({ messaging_product: "whatsapp", messages: [{ id: "wamid.unit_test_123" }] });

test("WhatsApp notification remains unavailable without every explicit valid server setting", () => {
  let calls = 0;
  const fetchImpl = () => {
    calls++;
    return accepted();
  };
  assert.equal(whatsappConfigurationReady({}), false);
  assert.equal(createWhatsAppNotifier({}, { fetchImpl }), null);
  for (const key of Object.keys(settings)) {
    const incomplete = { ...settings, [key]: "" };
    assert.equal(whatsappConfigurationReady(incomplete), false, key);
    assert.equal(createWhatsAppNotifier(incomplete, { fetchImpl }), null, key);
  }
  for (const [key, value] of [
    ["LUXE_WHATSAPP_GRAPH_VERSION", "https://other.example/"],
    ["LUXE_WHATSAPP_PHONE_NUMBER_ID", "12345/messages?token=leak"],
    ["LUXE_WHATSAPP_RECIPIENT", "not-a-number"],
    ["LUXE_WHATSAPP_TEMPLATE", "template/../../"],
    ["LUXE_WHATSAPP_LANGUAGE", "en_US\nheader"],
    ["LUXE_WHATSAPP_ACCESS_TOKEN", "token with spaces"],
  ])
    assert.equal(createWhatsAppNotifier({ ...settings, [key]: value }, { fetchImpl }), null);
  assert.equal(calls, 0);
});

test("WhatsApp notification uses the fixed official endpoint and six bounded single-line variables", async () => {
  let invocation;
  const notify = createWhatsAppNotifier(settings, {
    fetchImpl: async (url, options) => {
      invocation = { url, options };
      return accepted();
    },
  });
  const result = await notify({
    ...request,
    kind: "K".repeat(100),
    name: "N".repeat(200),
    phone: "P".repeat(80),
    city: "C".repeat(200),
    message: "Line one\n\tLine two    ".repeat(400),
    to: "918888888888",
    endpoint: "https://other.example/steal",
  });
  assert.deepEqual(result, { providerMessageId: "wamid.unit_test_123" });
  assert.equal(invocation.url, "https://graph.facebook.com/v99.0/123456789012345/messages");
  assert.equal(invocation.options.method, "POST");
  assert.equal(invocation.options.redirect, "error");
  assert.equal(
    invocation.options.headers.Authorization,
    `Bearer ${settings.LUXE_WHATSAPP_ACCESS_TOKEN}`,
  );
  const payload = JSON.parse(invocation.options.body);
  assert.equal(payload.to, settings.LUXE_WHATSAPP_RECIPIENT);
  assert.equal(payload.messaging_product, "whatsapp");
  assert.equal(payload.type, "template");
  assert.equal(payload.template.name, settings.LUXE_WHATSAPP_TEMPLATE);
  assert.deepEqual(payload.template.language, { code: "en_US" });
  assert.equal(payload.template.components.length, 1);
  const parameters = payload.template.components[0].parameters;
  assert.equal(parameters.length, 6);
  for (const [index, maximum] of [64, 40, 80, 32, 100, 400].entries()) {
    assert.equal(parameters[index].type, "text");
    assert.ok(parameters[index].text.length <= maximum);
    assert.doesNotMatch(parameters[index].text, /[\r\n\t]| {2}/);
  }
  assert.equal(parameters[0].text, request.reference);
  assert.match(parameters[5].text, /Summary only; full request saved under reference\.$/);
  assert.ok(parameters[5].text.includes("…"));
});

test("Unicode values stay within conservative template limits without splitting emoji", async () => {
  let parameters;
  await createWhatsAppNotifier(settings, {
    fetchImpl: async (_, options) => {
      parameters = JSON.parse(options.body).template.components[0].parameters;
      return accepted();
    },
  })({ ...request, name: "🙂".repeat(100), message: "🙂".repeat(1000) });
  assert.ok(parameters[2].text.length <= 80);
  assert.ok(parameters[5].text.length <= 400);
  assert.equal(parameters[2].text.isWellFormed(), true);
  assert.equal(parameters[5].text.isWellFormed(), true);
});

test("short requests still explicitly identify the notification as a saved-request summary", async () => {
  let parameters;
  await createWhatsAppNotifier(settings, {
    fetchImpl: async (_, options) => {
      parameters = JSON.parse(options.body).template.components[0].parameters;
      return accepted();
    },
  })(request);
  assert.equal(
    parameters[5].text,
    `${request.message} Summary only; full request saved under reference.`,
  );
});

test("invalid references and empty messages fail before an external request", async () => {
  let calls = 0;
  const notify = createWhatsAppNotifier(settings, {
    fetchImpl: async () => {
      calls++;
      return accepted();
    },
  });
  for (const input of [
    { ...request, reference: "X".repeat(65) },
    { ...request, reference: "reference\ninjection" },
    { ...request, message: " \n " },
    undefined,
  ])
    await assert.rejects(notify(input), { deliveryState: "failed", uncertain: false });
  assert.equal(calls, 0);
});

test("provider rejection is redacted, definite, and never retried", async () => {
  let calls = 0;
  const notify = createWhatsAppNotifier(settings, {
    fetchImpl: async () => {
      calls++;
      return Response.json(
        { error: { message: `secret ${settings.LUXE_WHATSAPP_ACCESS_TOKEN}` } },
        { status: 400 },
      );
    },
  });
  await assert.rejects(notify(request), (error) => {
    assert.equal(error.deliveryState, "failed");
    assert.equal(error.uncertain, false);
    assert.doesNotMatch(error.message + error.stack, /synthetic_private_token|secret/);
    assert.equal(error.cause, undefined);
    return true;
  });
  assert.equal(calls, 1);
});

test("network errors, provider errors, and malformed acceptances preserve uncertain status", async () => {
  for (const fetchImpl of [
    async () => {
      throw new Error(`network secret ${settings.LUXE_WHATSAPP_ACCESS_TOKEN}`);
    },
    async () => new Response("provider secret", { status: 503 }),
    async () => new Response("not json", { status: 200 }),
    async () => Response.json({ messaging_product: "whatsapp", messages: [] }),
    async () =>
      Response.json({ messaging_product: "whatsapp", messages: [{ id: "unexpected_id" }] }),
    async () => Response.json({ messages: [{ id: "wamid.valid_looking" }] }),
    async () => undefined,
  ]) {
    let calls = 0;
    const notify = createWhatsAppNotifier(settings, {
      fetchImpl: async (...args) => {
        calls++;
        return fetchImpl(...args);
      },
    });
    await assert.rejects(notify(request), (error) => {
      assert.equal(error.deliveryState, "uncertain");
      assert.equal(error.uncertain, true);
      assert.doesNotMatch(
        error.message + error.stack,
        /synthetic_private_token|provider secret|network secret/,
      );
      return true;
    });
    assert.equal(calls, 1);
  }
});

test("notification aborts after fifteen seconds without retrying or claiming failure certainty", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let calls = 0;
  let signal;
  const notify = createWhatsAppNotifier(settings, {
    fetchImpl: async (_, options) => {
      calls++;
      signal = options.signal;
      // Even a provider/fetch shim that ignores abort cannot hold the request open.
      return new Promise(() => {});
    },
  });
  const pending = notify(request);
  const check = assert.rejects(pending, { deliveryState: "uncertain", uncertain: true });
  t.mock.timers.tick(14_999);
  assert.equal(signal.aborted, false);
  t.mock.timers.tick(1);
  await check;
  assert.equal(signal.aborted, true);
  assert.equal(calls, 1);
});
