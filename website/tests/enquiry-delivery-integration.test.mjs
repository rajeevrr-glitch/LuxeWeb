import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createProductionServer, deliveryForEnvironment } from "../scripts/production-server.mjs";
import { createEnquiryDelivery } from "../scripts/enquiry-delivery.mjs";

async function start(t, delivery) {
  const server = createProductionServer({
    delivery,
    handler: { fetch: () => new Response("page") },
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  t.after(() => new Promise((r) => server.close(r)));
  return `http://127.0.0.1:${server.address().port}`;
}

test("public server exposes only disabled status until explicitly configured", async (t) => {
  const base = await start(t);
  assert.deepEqual(await fetch(base + "/api/enquiry-delivery/status").then((r) => r.json()), {
    enabled: false,
    channel: "whatsapp",
  });
  assert.equal((await fetch(base + "/api/enquiry-delivery", { method: "POST" })).status, 503);
  assert.equal((await fetch(base + "/api/enquiries", { method: "POST" })).status, 405);
  assert.equal((await fetch(base + "/api/desk/enquiries")).status, 404);
  assert.equal((await fetch(base + "/.private/delivery")).status, 404);
});

test("configured public route saves full request and accepts one fake notification, without a WhatsApp app handoff", async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), "luxe-delivery-public-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const calls = [];
  const delivery = createEnquiryDelivery({
    enabled: true,
    directory,
    origins: ["https://luxeinfra.in"],
    notify: async (data) => {
      calls.push(data);
      return { providerMessageId: "wamid.integration-test" };
    },
  });
  const base = await start(t, delivery);
  const payload = {
    id: randomUUID(),
    kind: "quote",
    name: "Website QA",
    phone: "9026271638",
    city: "Preview only",
    message: "Whole home / 2 BHK / above 800 sq ft",
    consent: true,
    website: "",
  };
  const submit = () =>
    fetch(base + "/api/enquiry-delivery", {
      method: "POST",
      headers: { Origin: "https://luxeinfra.in", "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  const response = await submit();
  assert.equal(response.status, 202);
  const receipt = await response.json();
  assert.equal(receipt.state, "accepted");
  assert.deepEqual(await (await submit()).json(), receipt);
  assert.equal(calls.length, 1);
  const record = JSON.parse(await readFile(path.join(directory, payload.id + ".json"), "utf8"));
  assert.equal(record.request.message, payload.message);
  assert.equal(record.reference, receipt.reference);
  assert.equal((await fetch(base + "/.private/" + payload.id + ".json")).status, 404);
});

test("startup rejects private storage under the built public tree and incomplete account config", () => {
  const configured = {
    LUXE_ENQUIRY_DELIVERY_ENABLED: "true",
    LUXE_ENQUIRY_DATA_DIR: path.resolve("dist/client/private"),
    LUXE_WHATSAPP_ACCESS_TOKEN: "fake-test-token-at-least16",
    LUXE_WHATSAPP_PHONE_NUMBER_ID: "123456789",
    LUXE_WHATSAPP_RECIPIENT: "919026271638",
    LUXE_WHATSAPP_TEMPLATE: "luxe_enquiry",
    LUXE_WHATSAPP_LANGUAGE: "en",
    LUXE_WHATSAPP_GRAPH_VERSION: "v99.0",
  };
  assert.equal(deliveryForEnvironment(configured).status().enabled, false);
  for (const location of ["public/private", "dist/private", "src/private", "."])
    assert.equal(
      deliveryForEnvironment({
        ...configured,
        LUXE_ENQUIRY_DATA_DIR: path.resolve(location),
      }).status().enabled,
      false,
    );
  assert.equal(
    deliveryForEnvironment({
      LUXE_ENQUIRY_DELIVERY_ENABLED: "true",
      LUXE_ENQUIRY_DATA_DIR: tmpdir(),
    }).status().enabled,
    false,
  );
  assert.equal(
    deliveryForEnvironment({
      ...configured,
      LUXE_ENQUIRY_DATA_DIR: path.join(tmpdir(), "private-luxe-test"),
    }).status().enabled,
    true,
  );
});
