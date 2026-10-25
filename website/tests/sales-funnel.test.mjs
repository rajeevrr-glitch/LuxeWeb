import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyContact, validateLead, leadMessage } from "../src/lib/sales-funnel.ts";
import {
  emptyEstimate,
  homeConfigurations,
  homeSizeLabel,
  calculateEstimate,
  readEstimate,
} from "../src/lib/estimate.ts";

const contact = { ...emptyContact, name: "QA Preview", phone: "+91 90000 00000", city: "Noida" };
test("saved studio-home bands survive reload and legacy ambiguous configurations require a new choice", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  let stored = {
    ...emptyEstimate,
    city: "Noida",
    configuration: "1 RK",
    areaBand: "up-to",
    name: "Do not restore",
    phone: "9000000000",
  };
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: { getItem: () => JSON.stringify(stored) },
  });
  try {
    const restored = readEstimate();
    assert.equal(restored.configuration, "1 RK");
    assert.equal(restored.areaBand, "up-to");
    assert.equal("name" in restored, false);
    assert.equal("phone" in restored, false);
    stored = { ...stored, configuration: "4+ BHK" };
    assert.equal(readEstimate().configuration, "");
  } finally {
    if (original) Object.defineProperty(globalThis, "sessionStorage", original);
    else Reflect.deleteProperty(globalThis, "sessionStorage");
  }
});
test("contact step validates required identity, contact and location without requiring email", () => {
  assert.equal(validateLead(contact), "");
  for (const value of [
    { ...contact, name: " " },
    { ...contact, city: " " },
    { ...contact, phone: "12345" },
    { ...contact, phone: "5000000000" },
    { ...contact, email: "invalid@" },
    { ...contact, region: "Unknown" },
    { ...contact, callTime: "Guaranteed 5pm" },
  ])
    assert.notEqual(validateLead(value), "");
  assert.equal(validateLead({ ...contact, email: "qa@example.com" }), "");
});
test("quote handoff carries contact preference and project context without claiming a booking or receipt", () => {
  const message = leadMessage(
    { ...contact, callTime: "Evening · 5–8 pm", email: "qa@example.com" },
    "2 BHK\nUp to 800 sq ft carpet area",
  );
  for (const value of [
    "QA Preview",
    "Noida",
    "2 BHK",
    "Up to 800",
    "qa@example.com",
    "subject to confirmation",
  ])
    assert.ok(message.includes(value));
  assert.doesNotMatch(message, /booking confirmed|request received/i);
});
test("home discovery supports studio homes and preserves approximate size without inventing measurements", () => {
  assert.ok(homeConfigurations.includes("1 RK"));
  const draft = {
    ...emptyEstimate,
    scope: "Whole home",
    city: "Noida",
    configuration: "2 BHK",
    areaBand: "up-to",
    area: "",
  };
  assert.equal(homeSizeLabel(draft), "Up to 800 sq ft carpet area");
  assert.equal(homeSizeLabel({ ...draft, areaBand: "above" }), "Above 800 sq ft carpet area");
  assert.equal(homeSizeLabel({ ...draft, areaBand: "unsure" }), "Size to confirm");
  assert.equal(homeSizeLabel({ ...draft, area: "780" }), "780 sq ft carpet area");
  assert.equal(calculateEstimate(draft).min, null);
});
test("only explicitly approved size-band packages can price an approximate home size", () => {
  const draft = {
    ...emptyEstimate,
    scope: "Whole home",
    city: "Noida",
    configuration: "2 BHK",
    areaBand: "up-to",
    area: "",
    finish: "Laminate",
  };
  const rate = {
    id: "whole-home",
    scope: "Whole home",
    configuration: "2 BHK",
    areaBand: "up-to",
    region: "Delhi NCR",
    condition: "New home",
    finish: "Laminate",
    unit: "package",
    min: 100,
    max: 200,
    inclusions: ["Synthetic scope fixture"],
    exclusions: ["Synthetic exclusion"],
  };
  const book = {
    approved: true,
    version: "test-only",
    validUntil: "2026-12-31",
    taxNote: "Synthetic tax terms",
    rates: [rate],
  };
  const now = new Date("2026-10-22T12:00:00Z");
  assert.equal(calculateEstimate(draft, book, now).min, 100);
  assert.equal(calculateEstimate({ ...draft, area: "900" }, book, now).status, "review");
  assert.equal(
    calculateEstimate(draft, { ...book, rates: [{ ...rate, minHomeArea: 700 }] }, now).status,
    "review",
  );
  assert.equal(calculateEstimate({ ...draft, areaBand: "above" }, book, now).status, "review");
  assert.equal(calculateEstimate({ ...draft, areaBand: "unsure" }, book, now).status, "review");
  assert.equal(calculateEstimate(draft, { ...book, approved: false }, now).status, "review");
  const { areaBand: _removed, ...measuredRate } = rate;
  assert.equal(
    calculateEstimate(
      draft,
      { ...book, rates: [{ ...measuredRate, minHomeArea: 1, maxHomeArea: 800 }] },
      now,
    ).status,
    "review",
  );
  assert.equal(
    calculateEstimate(
      { ...draft, area: "900" },
      { ...book, rates: [{ ...rate, maxHomeArea: 800 }] },
      now,
    ).status,
    "review",
  );
});
