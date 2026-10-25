import { test } from "node:test";
import assert from "node:assert/strict";
import { diwaliCampaign, festiveCampaignContext, promotionState } from "../src/lib/promotion.ts";
import { partnerRole, partnerMessage, validatePartner } from "../src/lib/partnership.ts";

const offer = {
  id: "fixture",
  approved: true,
  percent: 15,
  startsAt: "2026-10-22T00:00:00+05:30",
  endsAt: "2026-10-25T00:00:00+05:30",
  terms: ["Synthetic test terms"],
};
test("unapproved and incomplete offers stay unavailable in a normal build", () => {
  const now = new Date("2026-10-23T12:00:00+05:30");
  for (const change of [
    { approved: false },
    { terms: [] },
    { terms: [" "] },
    { startsAt: "" },
    { endsAt: "bad" },
    { percent: 0 },
    { percent: 101 },
  ]) {
    assert.equal(promotionState({ ...offer, ...change }, false, now), "unavailable");
  }
  assert.equal(promotionState({ ...offer, approved: false }, true, now), "preview");
});
test("an approved complete campaign runs only within its booking window", () => {
  assert.equal(promotionState(offer, false, new Date("2026-10-21T23:59:59+05:30")), "unavailable");
  assert.equal(promotionState(offer, false, new Date(offer.startsAt)), "live");
  assert.equal(promotionState(offer, false, new Date(offer.endsAt)), "unavailable");
  assert.equal(
    promotionState({ ...offer, endsAt: offer.startsAt }, false, new Date(offer.startsAt)),
    "unavailable",
  );
});

test("owner-approved ongoing offers run without inventing expiry dates", () => {
  const ongoing = { ...offer, availability: "ongoing", startsAt: "", endsAt: "" };
  assert.equal(promotionState(ongoing, false), "live");
  assert.equal(promotionState({ ...ongoing, approved: false }, false), "unavailable");
  assert.equal(promotionState({ ...ongoing, terms: [] }, false), "unavailable");
  assert.equal(promotionState({ ...ongoing, percent: 101 }, false), "unavailable");
  assert.equal(promotionState({ ...ongoing, availability: "scheduled" }, false), "unavailable");
  assert.match(diwaliCampaign.benefit, /15% off on all works/);
  assert.match(diwaliCampaign.benefit, /additional Diwali gifts/);
  assert.equal(festiveCampaignContext("unrecognised"), "");
  assert.equal(festiveCampaignContext(diwaliCampaign.id), diwaliCampaign.enquiryContext);
});
const draft = {
  role: "design",
  name: "Test Designer",
  phone: "+91 98765 43210",
  city: "Noida",
  organisation: "",
  note: "",
};
test("partner introductions validate role, required details and Indian phone", () => {
  assert.equal(validatePartner(draft), "");
  assert.equal(partnerRole("invented"), undefined);
  for (const change of [
    { role: "invented" },
    { name: " " },
    { city: "" },
    { phone: "12345" },
    { phone: "5123456789" },
    { note: "x".repeat(601) },
  ]) {
    assert.notEqual(validatePartner({ ...draft, ...change }), "");
  }
});
test("each opportunity produces the right short handoff without invented rewards", () => {
  assert.match(partnerMessage(draft), /Interest: Design collaboration/);
  assert.match(
    partnerMessage({ ...draft, role: "careers", note: "Portfolio: https://example.com" }),
    /Interest: Career interest/,
  );
  assert.match(partnerMessage({ ...draft, role: "referral" }), /Interest: Referral partnership/);
  assert.doesNotMatch(partnerMessage(draft), /undefined|commission|guaranteed|Organisation/);
});
