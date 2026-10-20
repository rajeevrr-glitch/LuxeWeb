import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createEnquiryServer } from "../scripts/enquiry-server.mjs";
const brief = () => ({
  id: randomUUID(),
  region: "Bengaluru",
  city: "Preview Test",
  property: "Apartment",
  area: "900",
  condition: "New home",
  configuration: "3 BHK",
  readiness: "Awaiting possession",
  scope: "Selected rooms",
  rooms: ["Kitchen"],
  work: { Kitchen: ["Design & layout"] },
  roomPriorities: { Kitchen: "First priority" },
  style: "Help me choose",
  priorities: [],
  budget: "Need guidance",
  timing: "Exploring ideas",
  name: "Preview Test",
  phone: "9000000000",
  email: "",
  method: "Phone",
  time: "Any time",
  notes: "Synthetic local test",
  consent: true,
  website: "",
  inspirations: [],
});
async function setup(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "luxeinfra-test-"));
  const server = createEnquiryServer({ directory });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  t.after(async () => {
    await new Promise((r) => server.close(r));
    assert.ok(directory.startsWith(path.join(os.tmpdir(), "luxeinfra-test-")));
    await rm(directory, { recursive: true, force: true });
  });
  return { directory, url: `http://127.0.0.1:${server.address().port}` };
}
async function submit(url, data, files = [], origin = "http://127.0.0.1:5173") {
  const form = new FormData();
  form.append("brief", JSON.stringify(data));
  for (const file of files) form.append("files", file.blob, file.name);
  return fetch(url + "/api/enquiries", { method: "POST", headers: { Origin: origin }, body: form });
}
test("valid brief and PDF persist privately; concurrent retries return one receipt", async (t) => {
  const { url, directory } = await setup(t);
  const data = brief();
  const files = [
    { name: "floor.pdf", blob: new Blob(["%PDF-1.7\nTest"], { type: "application/pdf" }) },
  ];
  const responses = await Promise.all([submit(url, data, files), submit(url, data, files)]);
  assert.deepEqual(
    responses.map((r) => r.status),
    [201, 201],
  );
  const [a, b] = await Promise.all(responses.map((r) => r.json()));
  assert.equal(a.reference, b.reference);
  assert.equal(a.notification, "not-configured");
  assert.equal((await readdir(directory)).length, 1);
  const stored = JSON.parse(await readFile(path.join(directory, data.id, "brief.json"), "utf8"));
  assert.equal(stored.region, "Bengaluru");
  assert.equal(stored.configuration, "3 BHK");
  assert.equal(stored.readiness, "Awaiting possession");
  assert.deepEqual(stored.roomPriorities, { Kitchen: "First priority" });
  assert.equal(stored.files[0].filename, "1.pdf");
  assert.equal((await fetch(url + "/" + data.id + "/brief.json")).status, 404);
  assert.equal((await submit(url, { ...data, city: "Changed" })).status, 409);
});
test("reject invalid contact, consent, empty room work, bot field, and missing email", async (t) => {
  const { url, directory } = await setup(t);
  for (const change of [
    { phone: "123" },
    { consent: false },
    { work: {} },
    { website: "bot" },
    { method: "Email", email: "" },
    { roomPriorities: { Kitchen: "Guaranteed phase 1" } },
    { roomPriorities: { Bathrooms: "Can wait" } },
  ])
    assert.equal((await submit(url, { ...brief(), ...change })).status, 400);
  assert.equal((await readdir(directory)).length, 0);
});

test("room priorities support older briefs and persist different priorities for each room", async (t) => {
  const { url, directory } = await setup(t);
  const old = brief();
  delete old.roomPriorities;
  assert.equal((await submit(url, old)).status, 201);
  const olderStored = JSON.parse(
    await readFile(path.join(directory, old.id, "brief.json"), "utf8"),
  );
  assert.deepEqual(olderStored.roomPriorities, {});
  const phased = {
    ...brief(),
    rooms: ["Kitchen", "Bathrooms"],
    scope: "Help me decide",
    roomPriorities: { Kitchen: "First priority", Bathrooms: "Can wait" },
  };
  assert.equal((await submit(url, phased)).status, 201);
  const stored = JSON.parse(await readFile(path.join(directory, phased.id, "brief.json"), "utf8"));
  assert.deepEqual(stored.roomPriorities, phased.roomPriorities);
});
test("reject disguised or excessive uploads and foreign origin", async (t) => {
  const { url } = await setup(t);
  const fake = {
    name: "fake.pdf",
    blob: new Blob(["<script>bad</script>"], { type: "application/pdf" }),
  };
  assert.equal((await submit(url, brief(), [fake])).status, 400);
  assert.equal((await submit(url, brief(), [fake, fake, fake, fake])).status, 400);
  assert.equal((await submit(url, brief(), [], "https://example.com")).status, 403);
  const status = await (await fetch(url + "/api/status")).json();
  assert.equal(status.notifications, false);
});
