import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateEstimate,
  emptyEstimate,
  describeEstimate,
  renovationPackages,
  readEstimate,
} from "../src/lib/estimate.ts";
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

const renovation = {
  ...emptyEstimate,
  scope: "Whole home",
  condition: "Renovation",
  city: "Noida",
  configuration: "2 BHK",
  areaBand: "above",
  workArea: "800",
  renovationTier: "essential",
};
test("owner renovation rates multiply only actual work floor area and produce a starting amount", () => {
  for (const [tier, rate, total] of [
    ["essential", 1100, 880000],
    ["signature", 1400, 1120000],
    ["luxe", 1700, 1360000],
  ]) {
    const result = calculateEstimate({ ...renovation, renovationTier: tier });
    assert.equal(result.status, "priced");
    assert.equal(result.priceKind, "starting");
    assert.equal(result.min, total);
    assert.equal(result.max, total);
    assert.equal(result.rate, rate);
    assert.equal(result.lines.length, 1);
    assert.equal(result.lines[0].quantity, 800);
    assert.match(result.reason, /early stage.*final price.*site visit/i);
    assert.match(result.taxNote, /final quotation/);
  }
  assert.equal(
    calculateEstimate({ ...renovation, workArea: "780.5", renovationTier: "signature" }).min,
    1092700,
  );
});
test("size bands, carpet area and cabinet frontage cannot substitute for renovation work area", () => {
  for (const workArea of ["", " ", "0", "0.5", "-1", "100001", "Infinity", "NaN", "letters"]) {
    const result = calculateEstimate({ ...renovation, area: "900", kitchenArea: "25", workArea });
    assert.equal(result.status, "review");
    assert.equal(result.min, null);
  }
  assert.equal(calculateEstimate({ ...renovation, renovationTier: "bespoke" }).status, "review");
  assert.equal(
    calculateEstimate({ ...renovation, workArea: "100000", renovationTier: "luxe" }).min,
    170000000,
  );
});
test("renovation-only rates cannot price new homes, modular work, selected rooms or unknown locations", () => {
  for (const changed of [
    { condition: "New home" },
    { scope: "Modular interiors" },
    { scope: "Selected rooms" },
    { region: "Other" },
    { city: " " },
  ])
    assert.equal(calculateEstimate({ ...renovation, ...changed }).status, "review");
  assert.equal(calculateEstimate(renovation, { ...book, approved: false }, now).status, "review");
  const message = describeEstimate(renovation);
  assert.match(message, /Essential · ₹1,100\/sq ft/);
  assert.match(message, /Area of renovation work: 800 sq ft/);
  assert.match(message, /Indicative budget: ₹8,80,000\+/);
  assert.match(message, /final price.*site visit/i);
  assert.doesNotMatch(message, /Finish preference/);
  assert.doesNotMatch(message, /15%|discount/i);
  for (const changed of [{ region: "Other" }, { workArea: "0.5" }, { workArea: "" }]) {
    assert.doesNotMatch(describeEstimate({ ...renovation, ...changed }), /Indicative budget:/);
  }
});
test("saved renovation choices restore safely without restoring personal information", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  let stored = { ...renovation, name: "Do not restore", phone: "9000000000" };
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: { getItem: () => JSON.stringify(stored) },
  });
  try {
    for (const tier of renovationPackages) {
      stored = { ...stored, renovationTier: tier.id };
      const restored = readEstimate();
      assert.equal(restored.renovationTier, tier.id);
      assert.equal(restored.workArea, "800");
      assert.equal("name" in restored, false);
      assert.equal("phone" in restored, false);
    }
    stored = { ...stored, renovationTier: "unknown" };
    assert.equal(readEstimate().renovationTier, "");
    const { workArea: _workArea, renovationTier: _tier, ...legacy } = stored;
    stored = legacy;
    assert.equal(readEstimate().workArea, "");
    assert.equal(readEstimate().renovationTier, "");
  } finally {
    if (original) Object.defineProperty(globalThis, "sessionStorage", original);
    else Reflect.deleteProperty(globalThis, "sessionStorage");
  }
});
