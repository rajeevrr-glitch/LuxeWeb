import assert from "node:assert/strict";
import test from "node:test";
import { trafficAuthNavigation, trafficPage, trafficSource } from "../src/lib/traffic.ts";
import {
  browserTrafficPreference,
  chooseTrafficOptOut,
  trafficOptedOut,
  trafficPreferenceKey,
} from "../src/lib/traffic-preference.ts";

test("only fixed public page paths can become traffic buckets", () => {
  assert.equal(trafficPage("/"), "/");
  assert.equal(trafficPage("/design-ideas/kitchen/"), "/design-ideas/kitchen");
  for (const p of [
    "/admin",
    "/admin/",
    "/reset-password",
    "/api/admin/leads",
    "/callback?name=private",
    "/#access_token=private",
    "https://luxeinfra.in/",
  ])
    assert.equal(trafficPage(p), null);
});

test("referrer URLs become fixed source categories without exporting their contents", () => {
  const own = "https://luxeinfra.in";
  assert.equal(trafficSource("", own), "direct");
  assert.equal(trafficSource(own + "/callback?phone=private", own), "direct");
  assert.equal(trafficSource("https://www.google.co.in/search?q=private", own), "google");
  assert.equal(trafficSource("https://l.instagram.com/?u=private", own), "instagram");
  assert.equal(trafficSource("https://google.com.attacker.test/private", own), "referral");
  assert.equal(trafficSource("https://example.test/private?token=private", own), "referral");
  assert.equal(trafficSource("javascript:private", own), "direct");
});

test("legacy auth arrivals are excluded even when they briefly reach a public path", () => {
  for (const [search, hash] of [
    ["", "#access_token=synthetic&type=recovery"],
    ["?code=synthetic", ""],
    ["", "#error_code=otp_expired"],
  ])
    assert.equal(trafficAuthNavigation(search, hash), true);
  assert.equal(trafficAuthNavigation("?offer=festive-15", "#room-studio"), false);
});

test("browser privacy signals exclude collection independently of a stored choice", () => {
  assert.equal(browserTrafficPreference({ doNotTrack: "1" }), true);
  assert.equal(browserTrafficPreference({ globalPrivacyControl: true }), true);
  assert.equal(browserTrafficPreference({ doNotTrack: "0", globalPrivacyControl: false }), false);
});

test("opt-out stores only a boolean and survives unavailable browser storage for this document", () => {
  const saved = [];
  let stored = null;
  const storage = {
    getItem: () => stored,
    setItem: (key, value) => {
      saved.push([key, value]);
      stored = value;
    },
  };
  assert.equal(chooseTrafficOptOut(true, storage), true);
  assert.deepEqual(saved, [[trafficPreferenceKey, "true"]]);
  assert.equal(trafficOptedOut(storage), true);
  assert.equal(chooseTrafficOptOut(false, storage), true);
  assert.equal(trafficOptedOut(storage), false);
  stored = "true"; // Another tab opts out after this tab previously opted in.
  assert.equal(trafficOptedOut(storage), true);
  const blocked = {
    getItem() {
      throw Error("blocked");
    },
    setItem() {
      throw Error("blocked");
    },
  };
  assert.equal(chooseTrafficOptOut(true, blocked), false);
  assert.equal(trafficOptedOut(blocked), true);
  chooseTrafficOptOut(false, storage);
});
