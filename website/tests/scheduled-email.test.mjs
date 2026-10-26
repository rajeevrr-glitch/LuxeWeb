import test from "node:test";
import assert from "node:assert/strict";
import { createScheduledEmailHandler, config } from "../netlify/functions/lead-email.mjs";

test("scheduled email runs only on the trusted published production deployment", async () => {
  const calls = [];
  const handler = createScheduledEmailHandler(async (options) => {
    calls.push(options);
    return { enabled: true, processed: 0, state: "idle" };
  });
  const request = new Request("https://example.test/", { headers: { context: "production" } });
  for (const context of [
    undefined,
    {},
    { deploy: { context: "deploy-preview", published: true } },
    { deploy: { context: "production", published: false } },
  ]) {
    assert.equal((await (await handler(request, context)).json()).state, "disabled");
  }
  assert.equal(calls.length, 0);
  const result = await handler(request, { deploy: { context: "production", published: true } });
  assert.equal((await result.json()).state, "idle");
  assert.deepEqual(calls, [{ environment: "production" }]);
  assert.equal(result.headers.get("cache-control"), "no-store");
  assert.equal(config.schedule, "*/5 * * * *");
  assert.equal(Object.hasOwn(config, "path"), false);
});
