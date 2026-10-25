import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const base = "http://127.0.0.1:3000";
const routes = ["/", "/guides", "/guides/first-design-conversation", "/guides/compare-interior-quotes", "/guides/plan-your-kitchen", "/guides/renovation-priorities", "/my-inspiration", "/materials", "/how-it-works", "/callback?scope=Selected%20rooms&room=Master%20bedroom", "/privacy"];
const assets = new Set();
for (const route of routes) {
  const response = await fetch(base + route);
  assert.equal(response.status, 200, route);
  assert.match(response.headers.get("x-robots-tag") || "", /noindex/);
  const html = await response.text();
  for (const match of html.matchAll(/(?:src|href|srcSet)="([^"]+)"/g))
    for (const part of match[1].split(",")) {
      const asset = part.trim().split(/\s/)[0];
      if (asset.startsWith("/assets/")) assets.add(asset);
    }
}
for (const asset of assets) assert.equal((await fetch(base + asset)).status, 200, asset);
const sitemap = await (await fetch(base + "/sitemap.xml")).text();
const sitemapPaths = [...sitemap.matchAll(/<loc>https:\/\/luxeinfra.in([^<]*)<\/loc>/g)].map(match => match[1] || "/");
for (const route of sitemapPaths) assert.equal((await fetch(base + route)).status, 200, route);
for (const route of ["/.env", "/.private/check", "/api/enquiries", "/api/desk/enquiries", "/guides/not-a-guide"])
  assert.equal((await fetch(base + route)).status, 404, route);
assert.equal((await fetch(base + "/api/enquiries", {method:"POST",body:"{}"})).status, 405);
assert.equal((await fetch(base + "/api/enquiry-delivery/status").then(response => response.json())).enabled, false);
assert.equal((await fetch(base + "/api/enquiry-delivery", {method:"POST",body:"{}"})).status, 503);
assert.equal((await fetch(base + "/api/visualiser/status").then(response => response.json())).enabled, false);
const result = {pages:routes.length, assets:assets.size, sitemapPages:sitemapPaths.length, stagingNoindex:true, privatePathsBlocked:true, unknownGuide:404, legacyIntake:405, automaticDelivery:"unconfigured,503", publicAI:"disabled", actualMessageSent:false};
await writeFile(new URL("./luxeweb/outputs/review-v22/live-smoke.json",import.meta.url),JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
