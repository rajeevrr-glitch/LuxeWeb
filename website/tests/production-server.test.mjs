import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { createProductionServer } from "../scripts/production-server.mjs";
test("public server never enables pilot APIs or exposes private files", async (t) => {
  const server = createProductionServer({ handler: { fetch: () => new Response("page") } });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  t.after(() => new Promise((r) => server.close(r)));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const p of [
    "/.env.local",
    "/.private/enquiries",
    "/api/enquiries",
    "/api/visualiser/jobs/test",
    "/assets/missing.js",
  ])
    assert.equal((await fetch(base + p)).status, 404);
  assert.equal((await fetch(base + "/api/enquiries", { method: "POST" })).status, 405);
  assert.equal((await (await fetch(base + "/api/visualiser/status")).json()).enabled, false);
  const page = await fetch(base + "/plan");
  assert.equal(await page.text(), "page");
  assert.equal(page.headers.get("x-frame-options"), "DENY");
  assert.equal(page.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.match(await (await fetch(base + "/robots.txt")).text(), /Disallow: \//);
});

test("malformed paths return 400 and the sitemap contains public room collections", async (t) => {
  const server = createProductionServer({
    indexable: true,
    handler: { fetch: () => new Response("missing", { status: 404 }) },
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  t.after(() => new Promise((r) => server.close(r)));
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(base + "/%ZZ")).status, 400);
  const missing = await fetch(base + "/missing");
  assert.equal(missing.headers.get("x-robots-tag"), "noindex, nofollow");
  const sitemap = await (await fetch(base + "/sitemap.xml")).text();
  assert.match(sitemap, /https:\/\/luxeinfra.in\/design-ideas\/bedroom/);
  assert.match(sitemap, /https:\/\/luxeinfra.in\/partner-with-us/);
  assert.match(sitemap, /https:\/\/luxeinfra.in\/projects/);
  for (const slug of [
    "first-design-conversation",
    "compare-interior-quotes",
    "plan-your-kitchen",
    "renovation-priorities",
  ])
    assert.ok(sitemap.includes(`https://luxeinfra.in/guides/${slug}`));
  assert.doesNotMatch(sitemap, /\/offers|\/callback|\/project-brief|\/api\//);
});

test("project films use correct media types, HEAD responses and bounded byte ranges", async (t) => {
  const server = createProductionServer({
    clientDirectory: path.resolve("public"),
    handler: { fetch: () => new Response("missing", { status: 404 }) },
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/projects/harsh-pal-walkthrough.mp4`;
  const original = await readFile(path.resolve("public/projects/harsh-pal-walkthrough.mp4"));
  const head = await fetch(url, { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(head.headers.get("content-type"), "video/mp4");
  assert.equal(head.headers.get("accept-ranges"), "bytes");
  assert.equal(Number(head.headers.get("content-length")), original.length);
  assert.equal((await head.arrayBuffer()).byteLength, 0);
  for (const [range, start, end] of [
    ["bytes=0-15", 0, 15],
    ["bytes=16-", 16, original.length - 1],
    ["bytes=-20", original.length - 20, original.length - 1],
    [
      `bytes=${original.length - 8}-${original.length + 100}`,
      original.length - 8,
      original.length - 1,
    ],
  ]) {
    const response = await fetch(url, { headers: { Range: range } });
    assert.equal(response.status, 206);
    assert.equal(response.headers.get("content-range"), `bytes ${start}-${end}/${original.length}`);
    assert.equal(Number(response.headers.get("content-length")), end - start + 1);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), original.subarray(start, end + 1));
  }
});

test("invalid or multipart film ranges fail safely while If-Range gets a full response", async (t) => {
  const server = createProductionServer({
    clientDirectory: path.resolve("public"),
    handler: { fetch: () => new Response("missing", { status: 404 }) },
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/projects/harsh-pal-walkthrough.mp4`;
  for (const range of [
    "bytes=-0",
    "bytes=12-2",
    "bytes=99999999-",
    "bytes=0-2,4-7",
    "bytes=-",
    "items=0-2",
    "bytes=999999999999999999999-",
  ]) {
    const response = await fetch(url, { headers: { Range: range } });
    assert.equal(response.status, 416);
    assert.match(response.headers.get("content-range"), /^bytes \*\/\d+$/);
    assert.equal((await response.arrayBuffer()).byteLength, 0);
  }
  const response = await fetch(url, { headers: { Range: "bytes=0-15", "If-Range": '"old-file"' } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-range"), null);
  await response.arrayBuffer();
});
