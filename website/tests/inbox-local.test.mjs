import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createLocalInbox } from "../scripts/inbox-local.mjs";
import { createProductionServer } from "../scripts/production-server.mjs";

test("the local inbox bridge stays private and disabled without explicit configuration", async (t) => {
  const inbox = createLocalInbox({ env: {} });
  const server = http.createServer(async (req, res) => {
    if (!(await inbox(req, res))) res.end("public fallback");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const status = await fetch(base + "/api/admin/session");
  assert.equal(status.status, 200);
  assert.deepEqual(await status.json(), { enabled: false, authenticated: false });
  assert.match(status.headers.get("cache-control"), /no-store/);
  assert.equal(status.headers.get("access-control-allow-origin"), null);
  assert.equal((await fetch(base + "/api/admin/leads")).status, 503);
  const login = await fetch(base + "/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "offline@example.invalid", password: "not-a-real-password" }),
  });
  assert.equal(login.status, 503);
  assert.equal(await (await fetch(base + "/")).text(), "public fallback");
});

test("admin pages are never indexable even when the public site is", async (t) => {
  const server = createProductionServer({
    indexable: true,
    inbox: createLocalInbox({ env: {} }),
    handler: { fetch: () => new Response("private workspace shell") },
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const admin = await fetch(base + "/admin");
  assert.equal(admin.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.equal(admin.headers.get("cache-control"), "no-store");
  assert.equal(admin.headers.get("x-frame-options"), "DENY");
  assert.match(await (await fetch(base + "/robots.txt")).text(), /Disallow: \/admin/);
  assert.doesNotMatch(await (await fetch(base + "/sitemap.xml")).text(), /\/admin/);
});
