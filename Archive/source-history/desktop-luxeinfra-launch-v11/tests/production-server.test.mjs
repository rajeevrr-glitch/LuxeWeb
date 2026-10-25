import { test } from "node:test";
import assert from "node:assert/strict";
import { createProductionServer } from "../scripts/production-server.mjs";
test("public server never enables pilot APIs or exposes private files", async (t) => {
  const server = createProductionServer({ handler: { fetch: () => new Response("page") } });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  t.after(() => new Promise((r) => server.close(r)));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const p of ["/.env.local", "/.private/enquiries", "/api/enquiries", "/api/visualiser/jobs/test", "/assets/missing.js"])
    assert.equal((await fetch(base + p)).status, 404);
  assert.equal((await fetch(base + "/api/enquiries", { method: "POST" })).status, 405);
  assert.equal((await (await fetch(base + "/api/visualiser/status")).json()).enabled, false);
  const page = await fetch(base + "/plan");
  assert.equal(await page.text(), "page");
  assert.equal(page.headers.get("x-frame-options"), "DENY");
  assert.equal(page.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.match(await (await fetch(base + "/robots.txt")).text(), /Disallow: \//);
});
