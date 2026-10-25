import { test } from "node:test";
import assert from "node:assert/strict";
import { friendlyErrorMessage } from "../src/lib/error-messages.ts";

test("public errors never display internal exception text", () => {
  for (const error of [
    new Error("Private path: C:/private/customer.json"),
    "Database connection token=secret",
    null,
    {},
  ]) {
    assert.equal(friendlyErrorMessage(error), "Something didn't load the way it should.");
  }
  assert.match(
    friendlyErrorMessage(new Error("fetch failed at private host")),
    /check your connection/,
  );
  assert.match(friendlyErrorMessage(new Error("timeout at private host")), /too long/);
});
