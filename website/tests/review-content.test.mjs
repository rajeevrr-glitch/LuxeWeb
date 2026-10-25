import { test } from "node:test";
import assert from "node:assert/strict";
import { selectReviewContent } from "../src/lib/review-content.ts";

test("an empty review collection never substitutes invented customer feedback", () => {
  assert.deepEqual(selectReviewContent([]), { mode: "empty", cards: [] });
});
test("only approved, permissioned reviews appear as client stories", () => {
  const review = {
    id: "test-review",
    approved: true,
    publicationConsent: true,
    name: "Test client",
    quote: "A verified test fixture",
    city: "Noida",
    scope: "Kitchen",
  };
  assert.equal(selectReviewContent([{ ...review, approved: false }]).mode, "empty");
  assert.equal(selectReviewContent([{ ...review, publicationConsent: false }]).mode, "empty");
  assert.equal(selectReviewContent([{ ...review, name: " " }]).mode, "empty");
  const selected = selectReviewContent([review]);
  assert.equal(selected.mode, "approved");
  assert.equal(selected.cards[0].byline, "Test client");
  assert.equal(selected.cards.length, 1);
});
