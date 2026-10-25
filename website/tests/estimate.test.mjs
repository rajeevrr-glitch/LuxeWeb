import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateEstimate, emptyEstimate, describeEstimate } from "../src/lib/estimate.ts";
// Synthetic fixtures for arithmetic tests only. These never reach public pricing.
const now = new Date("2026-10-21T12:00:00Z");
const draft = {
  ...emptyEstimate,
  city: "Noida",
  finish: "Laminate",
  kitchenArea: "20",
  wardrobeArea: "30",
  wardrobes: true,
};
const base = {
  scope: "Modular interiors",
  region: "Delhi NCR",
  condition: "New home",
  finish: "Laminate",
  unit: "sq ft frontage",
  inclusions: ["Test cabinet specification"],
  exclusions: ["Test site work"],
};
const book = {
  approved: true,
  version: "test-only",
  validUntil: "2026-12-31",
  taxNote: "Test tax terms",
  rates: [
    { ...base, id: "kitchen", min: 100, max: 150 },
    { ...base, id: "wardrobes", min: 200, max: 250 },
  ],
};
test("prices remain unavailable without approved, current, complete commercial data", () => {
  assert.equal(calculateEstimate(draft).status, "review");
  for (const config of [
    { ...book, approved: false },
    { ...book, validUntil: "2020-01-01" },
    { ...book, taxNote: "" },
    { ...book, validUntil: "invalid" },
    { ...book, rates: book.rates.slice(0, 1) },
  ]) {
    const result = calculateEstimate(draft, config, now);
    assert.equal(result.status, "review");
    assert.equal(result.min, null);
    assert.deepEqual(result.lines, []);
  }
});
test("modular totals use frontage quantities and exact region, finish and condition", () => {
  const result = calculateEstimate(draft, book, now);
  assert.equal(result.status, "priced");
  assert.equal(result.min, 8000);
  assert.equal(result.max, 10500);
  assert.equal(result.version, "test-only");
  assert.equal(result.lines.length, 2);
  for (const altered of [
    { ...draft, region: "Other" },
    { ...draft, city: " " },
    { ...draft, condition: "Renovation" },
    { ...draft, finish: "Acrylic" },
  ])
    assert.equal(calculateEstimate(altered, book, now).status, "review");
});
test("unknown or unsafe measurements never produce a partial price", () => {
  for (const q of ["", "-1", "0", "Infinity", "NaN", "100001", "letters"])
    assert.equal(calculateEstimate({ ...draft, kitchenArea: q }, book, now).status, "review");
  const duplicate = { ...book, rates: [...book.rates, book.rates[0]] };
  assert.equal(calculateEstimate(draft, duplicate, now).status, "review");
  assert.equal(
    calculateEstimate(
      draft,
      { ...book, rates: book.rates.map((r) => ({ ...r, unit: "package" })) },
      now,
    ).status,
    "review",
  );
});
test("whole-home packages never add modular items again and require area bounds", () => {
  const whole = { ...draft, scope: "Whole home", configuration: "2 BHK", area: "900" };
  const config = {
    ...book,
    rates: [
      ...book.rates,
      {
        ...base,
        id: "whole-home",
        scope: "Whole home",
        unit: "package",
        configuration: "2 BHK",
        minHomeArea: 700,
        maxHomeArea: 1000,
        min: 500000,
        max: 600000,
      },
    ],
  };
  const result = calculateEstimate(whole, config, now);
  assert.equal(result.status, "priced");
  assert.equal(result.min, 500000);
  assert.equal(result.lines.length, 1);
  for (const area of ["", "600", "1001"])
    assert.equal(calculateEstimate({ ...whole, area }, config, now).status, "review");
  assert.equal(
    calculateEstimate({ ...whole, configuration: "3 BHK" }, config, now).status,
    "review",
  );
});
test("summary preserves relevant choices without irrelevant kitchen questions", () => {
  const summary = describeEstimate({
    ...draft,
    scope: "Selected rooms",
    rooms: ["Master bedroom"],
  });
  assert.match(summary, /Master bedroom/);
  assert.doesNotMatch(summary, /Kitchen/);
  assert.equal(
    calculateEstimate({ ...draft, scope: "Selected rooms" }, book, now).status,
    "review",
  );
});
