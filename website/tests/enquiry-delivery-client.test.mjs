import { test } from "node:test";
import assert from "node:assert/strict";
import {
  checkEnquiryDelivery,
  createEnquiryDeliveryRequest,
  EnquiryDeliveryError,
  enquiryDeliveryError,
  submitEnquiryDelivery,
} from "../src/lib/enquiry-delivery.ts";

const input = {
  kind: "quote",
  name: "QA Customer",
  phone: "9000000000",
  city: "Noida",
  message: "Please contact me about a kitchen project.",
  consent: true,
};
const reference = "LX-20261023-ABCDEF123456";

test("delivery retries retain their identity only while the submitted details match", () => {
  let next = 0;
  const createId = () => `00000000-0000-4000-8000-${String(++next).padStart(12, "0")}`;
  const first = createEnquiryDeliveryRequest(input, null, createId);
  assert.equal(first.website, "");
  assert.equal(createEnquiryDeliveryRequest({ ...input }, first, createId), first);
  assert.equal(createEnquiryDeliveryRequest({ ...input, website: "" }, first, createId), first);
  const edited = createEnquiryDeliveryRequest({ ...input, city: "Delhi" }, first, createId);
  assert.notEqual(edited.id, first.id);
  assert.notEqual(
    createEnquiryDeliveryRequest({ ...input, website: "bot.example" }, first, createId).id,
    first.id,
  );
  assert.equal(next, 3);
  assert.match(createEnquiryDeliveryRequest(input).id, /^[a-f0-9-]{36}$/);
});

test("automatic delivery is available only after an explicit successful capability response", async () => {
  const calls = [];
  const available = await checkEnquiryDelivery({
    fetch: async (...args) => {
      calls.push(args);
      return Response.json({ enabled: true });
    },
  });
  assert.equal(available, true);
  assert.equal(calls[0][0], "/api/enquiry-delivery/status");
  assert.equal(calls[0][1].cache, "no-store");
  assert.equal(calls[0][1].credentials, "same-origin");
  assert.equal(calls[0][1].method, "GET");
  for (const response of [
    Response.json({ enabled: false }),
    Response.json({ enabled: "true" }),
    Response.json({ enabled: true }, { status: 503 }),
    new Response("not json"),
  ]) {
    assert.equal(await checkEnquiryDelivery({ fetch: async () => response }), false);
  }
  assert.equal(
    await checkEnquiryDelivery({
      fetch: async () => {
        throw new Error("Network unavailable");
      },
    }),
    false,
  );
});

test("the client recognises provider acceptance without claiming device delivery", async () => {
  const request = createEnquiryDeliveryRequest(input);
  let posted;
  const result = await submitEnquiryDelivery(request, {
    fetch: async (path, options) => {
      assert.equal(path, "/api/enquiry-delivery");
      assert.equal(options.method, "POST");
      assert.equal(options.headers["Content-Type"], "application/json");
      posted = JSON.parse(options.body);
      return Response.json({ reference, state: "accepted" }, { status: 202 });
    },
  });
  assert.deepEqual(posted, request);
  assert.deepEqual(result, { reference, state: "accepted" });
});

test("persisted uncertain requests carry only their validated reference into a manual fallback", async () => {
  const request = createEnquiryDeliveryRequest(input);
  for (const status of [503, 409]) {
    await assert.rejects(
      submitEnquiryDelivery(request, {
        fetch: async () =>
          Response.json(
            { reference, state: "uncertain", error: "Private provider account information" },
            { status },
          ),
      }),
      (error) => {
        assert.ok(error instanceof EnquiryDeliveryError);
        assert.equal(error.message, enquiryDeliveryError);
        assert.equal(error.reference, reference);
        assert.doesNotMatch(error.stack, /Private provider account/);
        return true;
      },
    );
  }
  assert.equal(createEnquiryDeliveryRequest(input, request), request);
});

test("malformed references and unexpected response statuses cannot supply a fallback reference", async () => {
  const request = createEnquiryDeliveryRequest(input);
  for (const [status, value] of [
    [503, { reference: "<script>unsafe</script>" }],
    [503, { reference: "LX-20261023-EXAMPLE" }],
    [503, { reference: "LX-20261023-ABCDEF123456\n" }],
    [503, { reference: 12 }],
    [503, {}],
    [500, { reference }],
    [200, { reference, state: "accepted" }],
    [202, { reference: "LX-20261023-EXAMPLE", state: "accepted" }],
  ])
    await assert.rejects(
      submitEnquiryDelivery(request, { fetch: async () => Response.json(value, { status }) }),
      (error) => {
        assert.ok(error instanceof EnquiryDeliveryError);
        assert.equal(error.message, enquiryDeliveryError);
        assert.equal(error.reference, "");
        return true;
      },
    );
});

test("failed or malformed responses cannot become a success or leak server details", async () => {
  const request = createEnquiryDeliveryRequest(input);
  for (const response of [
    Response.json({ reference: "LX-VALID", state: "accepted" }),
    Response.json({ reference: "LX-VALID", state: "delivered" }, { status: 202 }),
    Response.json({ reference: "", state: "accepted" }, { status: 202 }),
    Response.json({ reference: "<script>example</script>", state: "accepted" }, { status: 202 }),
    Response.json({ error: "Private provider error" }, { status: 500 }),
    new Response("Private invalid response", { status: 202 }),
  ]) {
    await assert.rejects(submitEnquiryDelivery(request, { fetch: async () => response }), {
      message: enquiryDeliveryError,
    });
  }
});

test("an uncertain timeout keeps the same request available for a safe retry", async () => {
  const request = createEnquiryDeliveryRequest(input);
  await assert.rejects(
    submitEnquiryDelivery(request, {
      timeoutMs: 5,
      fetch: (_path, { signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(new Error("Aborted")), { once: true });
        }),
    }),
    { message: enquiryDeliveryError },
  );
  assert.equal(createEnquiryDeliveryRequest(input, request), request);
});
