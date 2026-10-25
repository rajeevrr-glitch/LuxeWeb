import { test } from "node:test";
import assert from "node:assert/strict";
import { whatsappRequestUrl, openWhatsAppRequest } from "../src/lib/whatsapp.ts";

test("WhatsApp request keeps the complete message at the confirmed business number", () => {
  const message =
    "Hello LuxeInfra\nName: QA example\nKitchen & wardrobes: 2 BHK, 800 sq ft\n₹ budget? + finish / 50%";
  const destination = new URL(whatsappRequestUrl(message));
  assert.equal(destination.origin, "https://wa.me");
  assert.equal(destination.pathname, "/919026271638");
  assert.equal(destination.searchParams.get("text"), message);
  assert.equal([...destination.searchParams].length, 1);
});

test("direct handoff opens once synchronously without giving the external page opener access", () => {
  const calls = [];
  openWhatsAppRequest("My project", (...args) => calls.push(args));
  assert.deepEqual(calls, [[whatsappRequestUrl("My project"), "_blank", "noopener,noreferrer"]]);
});

test("a blocked new tab leaves callers free to show the on-page fallback", () => {
  assert.doesNotThrow(() =>
    openWhatsAppRequest("My project", () => {
      throw new Error("Blocked");
    }),
  );
});
