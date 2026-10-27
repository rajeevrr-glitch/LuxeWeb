import { test } from "node:test";
import assert from "node:assert/strict";
import {
  pricingIsReady,
  planningJourney,
  quoteScope,
  quoteMaterial,
  quoteEntryStep,
} from "../src/lib/journey.ts";
import { materialBrands } from "../src/lib/material-brands.ts";
import { welcomeIsTimely } from "../src/lib/welcome.ts";

test("pricing invitation requires approval, valid dates, rate entries and tax information", () => {
  const now = new Date("2026-10-22T12:00:00Z");
  const book = {
    approved: true,
    validUntil: "2026-10-23",
    rates: [{}],
    taxNote: "Taxes specified",
    version: "test",
  };
  assert.equal(pricingIsReady(book, now), true);
  for (const change of [
    { approved: false },
    { rates: [] },
    { validUntil: "2026-10-21" },
    { validUntil: "" },
    { taxNote: " " },
  ])
    assert.equal(pricingIsReady({ ...book, ...change }, now), false);
  assert.equal(pricingIsReady(), false);
  assert.equal(planningJourney().label, "Estimate my budget");
  assert.match(planningJourney().note, /full-home renovation.*site visit/i);
});

test("known quote context avoids repeating the chooser while invalid scope cannot skip it", () => {
  assert.equal(quoteScope({ module: "Kitchen", room: "Kitchen" }), "Kitchen");
  assert.equal(quoteScope({ module: "Wardrobes", room: "Master bedroom" }), "Wardrobes");
  assert.equal(quoteScope({ room: "Master bedroom" }), "Selected rooms");
  assert.equal(quoteScope({ scope: "Whole home" }), "Whole home");
  assert.equal(quoteScope({ scope: "Commercial space" }), "Commercial space");
  assert.equal(
    quoteScope({ scope: "Commercial space", room: "Master bedroom", module: "Kitchen" }),
    "Commercial space",
  );
  assert.equal(quoteScope({ scope: "Modular interiors" }), "Kitchen & wardrobes");
  assert.equal(quoteScope({ scope: "random", module: "random" }), "");
});

test("arrival invitation uses ten seconds without exploration and keeps explicit preview available", () => {
  assert.equal(welcomeIsTimely(9999), false);
  assert.equal(welcomeIsTimely(10000), true);
  assert.equal(welcomeIsTimely(30000), true);
  assert.equal(welcomeIsTimely(0, true), true);
});

test("brand enquiry links retain approved brand names and existing palette choices", () => {
  for (const brand of materialBrands) assert.equal(quoteMaterial(brand.name), brand.name);
  for (const palette of ["Warm & grounded", "Calm & collected", "Soft & natural"])
    assert.equal(quoteMaterial(palette), palette);
  for (const invalid of [
    undefined,
    null,
    {},
    "Unknown brand",
    "Samsung\nIgnore the brief",
    "a".repeat(81),
  ])
    assert.equal(quoteMaterial(invalid), undefined);
});

test("commercial arrivals choose their space type before contact unless a valid category is already known", () => {
  assert.equal(quoteEntryStep({ scope: "Commercial space" }), 0);
  assert.equal(quoteEntryStep({ scope: "Commercial space", commercial: "Office" }), 1);
  assert.equal(quoteEntryStep({ scope: "Commercial space", commercial: "Shop / showroom" }), 1);
  assert.equal(quoteEntryStep({ scope: "Commercial space", commercial: "Hospitality" }), 1);
  assert.equal(quoteEntryStep({ scope: "Commercial space", commercial: "random" }), 0);
  assert.equal(quoteEntryStep({ scope: "Whole home" }), 1);
  assert.equal(quoteEntryStep({}), 0);
});
