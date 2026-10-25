import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";

const base = "http://127.0.0.1:3000";
const routes = ["/", "/callback?scope=Selected%20rooms&room=Master%20bedroom", "/project-brief", "/partner-with-us?role=careers", "/privacy"];
const assets = new Set();
for (const route of routes) {
  const response = await fetch(base + route);
  assert.equal(response.status, 200, route);
  assert.match(response.headers.get("x-robots-tag") || "", /noindex/);
  const html = await response.text();
  for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)/g)) assets.add(match[1]);
  if (route.startsWith("/callback")) {
    assert.match(html, /Master bedroom/);
    assert.match(html, /Continue in WhatsApp/);
    assert.match(html, /Press Send there/);
    assert.doesNotMatch(html, /Modular kitchen/);
  }
  if (route === "/privacy") assert.match(html, /passes the draft details to WhatsApp/);
}
for (const asset of assets) assert.equal((await fetch(base + asset)).status, 200, asset);
for (const route of ["/.env", "/.private/check", "/api/enquiries", "/api/desk/enquiries", "/missing-v20"]) assert.equal((await fetch(base + route)).status, 404, route);
assert.equal((await fetch(base + "/api/enquiries", { method: "POST", body: "{}" })).status, 405);
assert.equal((await fetch(base + "/api/visualiser/status").then(r => r.json())).enabled, false);
const result = {pages:routes.length, assets:assets.size, stagingNoindex:true, privatePathsBlocked:true, automaticIntake:405, publicAI:"disabled", actualMessageSent:false};
await writeFile(new URL("./luxeweb/outputs/review-v20/live-smoke.json", import.meta.url), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
