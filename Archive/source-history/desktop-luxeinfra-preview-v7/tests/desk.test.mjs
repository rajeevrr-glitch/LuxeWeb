import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import { createDeskServer } from "../scripts/desk-server.mjs";
async function setup(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "luxe-desk-test-"));
  const id = randomUUID();
  await mkdir(path.join(directory, id));
  const brief = {
    id,
    name: "Synthetic Test",
    receivedAt: new Date().toISOString(),
    receipt: { reference: "TEST-ONLY" },
    files: [{ filename: "1.pdf", originalName: "plan.pdf" }],
    fingerprint: "private-hash",
    website: "",
  };
  await writeFile(path.join(directory, id, "brief.json"), JSON.stringify(brief));
  await writeFile(path.join(directory, id, "1.pdf"), "%PDF-1.7 sample");
  const key = "test-only-access-code-123456789";
  const server = createDeskServer({ directory, key });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await new Promise((r) => server.close(r));
    assert.ok(directory.startsWith(path.join(os.tmpdir(), "luxe-desk-test-")));
    await rm(directory, { recursive: true, force: true });
  });
  return { directory, id, base, headers: { Authorization: "Bearer " + key }, brief };
}
test("desk requires access code and rejects foreign origins; records omit internal fingerprint", async (t) => {
  const { base, headers } = await setup(t);
  assert.equal((await fetch(base + "/api/enquiries")).status, 401);
  assert.equal(
    (
      await fetch(base + "/api/enquiries", {
        headers: { ...headers, Origin: "https://foreign.example" },
      })
    ).status,
    403,
  );
  const r = await fetch(base + "/api/enquiries", { headers });
  assert.equal(r.status, 200);
  const data = await r.json();
  assert.equal(data.records.length, 1);
  assert.equal(data.records[0].fingerprint, undefined);
  const page = await fetch(base);
  assert.ok(page.headers.get("content-security-policy").includes("frame-ancestors 'none'"));
  assert.ok(!(await page.text()).includes("Synthetic Test"));
});
test("workflow updates persist separately and reject stale versions or invalid stages", async (t) => {
  const { base, id, headers, directory, brief } = await setup(t);
  const update = async (body) =>
    fetch(`${base}/api/enquiries/${id}/workflow`, {
      method: "PUT",
      headers: { ...headers, Origin: base, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  assert.equal((await update({ status: "Unknown", note: "", version: 0 })).status, 400);
  const response = await update({ status: "Contacted", note: "Test follow-up", version: 0 });
  assert.equal(response.status, 200);
  const workflow = await response.json();
  assert.equal(workflow.version, 1);
  assert.equal(workflow.history[0].from, "New");
  assert.equal((await update({ status: "Won", note: "Stale tab", version: 0 })).status, 409);
  assert.deepEqual(
    JSON.parse(await readFile(path.join(directory, id, "brief.json"), "utf8")),
    brief,
  );
  assert.equal(
    JSON.parse(await readFile(path.join(directory, id, "workflow.json"), "utf8")).note,
    "Test follow-up",
  );
});
test("attachment downloads are authenticated and confined to recorded files", async (t) => {
  const { base, id, headers } = await setup(t);
  const url = `${base}/api/enquiries/${id}/files/1.pdf`;
  assert.equal((await fetch(url)).status, 401);
  const response = await fetch(url, { headers });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/octet-stream");
  assert.equal(await response.text(), "%PDF-1.7 sample");
  assert.equal((await fetch(`${base}/api/enquiries/${id}/files/2.pdf`, { headers })).status, 404);
  assert.equal(
    (await fetch(`${base}/api/enquiries/${id}/files/brief.json`, { headers })).status,
    404,
  );
});
