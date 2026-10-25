import { test } from "node:test";
import assert from "node:assert/strict";
import {
  welcomeIsEligible,
  welcomeShouldOpen,
  welcomeStorageKey,
  createWelcomeTracker,
  commercialSpaceTypes,
  commercialSpaceType,
  welcomeProjectContext,
  welcomeIsTimely,
  welcomeDelayRemaining,
} from "../src/lib/welcome.ts";

test("normal arrival invitation becomes ready at ten seconds without a scroll condition", () => {
  assert.equal(welcomeIsTimely(0), false);
  assert.equal(welcomeIsTimely(9999), false);
  assert.equal(welcomeIsTimely(10000), true);
  assert.equal(welcomeIsTimely(30000), true);
  assert.equal(welcomeDelayRemaining(0), 10000);
  assert.equal(welcomeDelayRemaining(9999), 1);
  assert.equal(welcomeDelayRemaining(10000), 0);
  assert.equal(welcomeDelayRemaining(30000), 0);
  assert.equal(welcomeDelayRemaining(-1), 10000);
});

test("SPA navigation retains elapsed arrival time while protected journeys never invite", () => {
  // The component passes the browser's document clock, which does not restart at a route change.
  assert.equal(welcomeDelayRemaining(3000), 7000);
  assert.equal(welcomeDelayRemaining(8000), 2000);
  assert.equal(welcomeDelayRemaining(11000), 0);
  assert.equal(welcomeShouldOpen("/materials", false, false), true);
  assert.equal(welcomeShouldOpen("/callback", false, false), false);
  assert.equal(welcomeShouldOpen("/estimate", false, false), false);
  assert.equal(welcomeShouldOpen("/project-brief", false, false), false);
  assert.equal(welcomeIsTimely(0, true), true);
  assert.equal(welcomeDelayRemaining(0, true), 800);
});

test("commercial enquiries carry the chosen business category without residential measurements", () => {
  assert.deepEqual(commercialSpaceTypes, ["Office", "Shop / showroom", "Hospitality"]);
  for (const type of commercialSpaceTypes) {
    assert.equal(commercialSpaceType(type), type);
    assert.equal(
      welcomeProjectContext({
        project: "Commercial space",
        commercial: type,
        configuration: "2 BHK",
      }),
      "Interested in: Commercial space\nSpace type: " + type,
    );
  }
  assert.equal(commercialSpaceType("Unknown"), "");
  assert.equal(commercialSpaceType({ name: "Office" }), "");
  assert.equal(
    welcomeProjectContext({ project: "Commercial space", commercial: "Unknown" }),
    "Interested in: Commercial space",
  );
});

test("switching back to a residential enquiry cannot leak the commercial category", () => {
  assert.equal(
    welcomeProjectContext({ project: "Whole home", configuration: "2 BHK", commercial: "Office" }),
    "Interested in: Whole home\nHome type: 2 BHK",
  );
  assert.equal(
    welcomeProjectContext({ project: "Kitchen", configuration: "2 BHK", commercial: "Office" }),
    "Interested in: Kitchen",
  );
});

test("Diwali popup enquiries carry the approved campaign without accepting arbitrary source claims", () => {
  const home = welcomeProjectContext({ project: "Whole home", campaign: "diwali-edit" });
  const commercial = welcomeProjectContext({
    project: "Commercial space",
    commercial: "Office",
    campaign: "diwali-edit",
  });
  assert.match(home, /Campaign: The Diwali Edit/);
  assert.match(home, /15% off on all works \+ additional Diwali gifts/);
  assert.match(commercial, /Space type: Office/);
  assert.match(commercial, /Campaign: The Diwali Edit/);
  assert.doesNotMatch(
    welcomeProjectContext({ project: "Kitchen", campaign: "invented-discount" }),
    /Campaign:|discount/,
  );
});

test("manual open or dismissal cancels a pending invitation even in an explicit preview", () => {
  assert.equal(welcomeShouldOpen("/", false, false), true);
  assert.equal(welcomeShouldOpen("/", true, false), false);
  assert.equal(welcomeShouldOpen("/", true, false, true), true);
  assert.equal(welcomeShouldOpen("/", false, true), false);
  assert.equal(welcomeShouldOpen("/", true, true, true), false);
  assert.equal(welcomeShouldOpen("/callback", false, false, true), false);
});

test("welcome invites marketing visitors without interrupting active forms or privacy", () => {
  for (const path of [
    "/",
    "/about",
    "/design-ideas",
    "/design-ideas/kitchen",
    "/materials",
    "/testimonials",
    "/offers",
  ])
    assert.equal(welcomeIsEligible(path), true, path);
  for (const path of [
    "/estimate",
    "/estimate/",
    "/callback",
    "/plan",
    "/reimagine",
    "/project-brief",
    "/partner-with-us",
    "/privacy",
    "/contact",
    "/find-your-style",
    "/my-inspiration",
  ])
    assert.equal(welcomeIsEligible(path), false, path);
});
test("welcome session suppression stores only a seen flag and survives route remounts", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
  const first = createWelcomeTracker(storage);
  assert.equal(first.hasSeen(), false);
  first.markSeen();
  assert.equal(first.hasSeen(), true);
  assert.deepEqual([...values], [[welcomeStorageKey, "seen"]]);
  assert.equal(createWelcomeTracker(storage).hasSeen(), true);
  assert.equal(createWelcomeTracker().hasSeen(), false);
});
test("blocked storage still suppresses repeat invitations in the current page runtime", () => {
  const tracker = createWelcomeTracker({
    getItem() {
      throw Error("blocked");
    },
    setItem() {
      throw Error("blocked");
    },
  });
  assert.equal(tracker.hasSeen(), false);
  tracker.markSeen();
  assert.equal(tracker.hasSeen(), true);
});
