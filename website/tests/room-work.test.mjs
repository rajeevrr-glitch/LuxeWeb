import { test } from "node:test";
import assert from "node:assert/strict";
import { getRoomWorkOptions, sanitiseRoomWork } from "../src/lib/room-work.ts";
test("older drafts lose kitchen work in bedrooms and preserve valid choices", () => {
  assert.deepEqual(
    sanitiseRoomWork(["Master bedroom", "Kitchen"], {
      "Master bedroom": [
        "Modular kitchen",
        "Wardrobes & storage",
        "Wardrobes & storage",
        "Plumbing",
      ],
      Kitchen: ["Modular kitchen", "Design & layout"],
      Bathrooms: ["Plumbing"],
    }),
    { "Master bedroom": ["Wardrobes & storage"], Kitchen: ["Modular kitchen", "Design & layout"] },
  );
  assert.deepEqual(sanitiseRoomWork(null, []), {});
  assert.deepEqual(getRoomWorkOptions("__proto__"), []);
});
test("bathrooms offer wet-area work; living rooms and bedrooms do not offer kitchens", () => {
  for (const room of [
    "Living & dining",
    "Master bedroom",
    "Other bedrooms",
    "Home office",
    "Pooja space",
    "Bathrooms",
  ])
    assert.equal(getRoomWorkOptions(room).includes("Modular kitchen"), false);
  assert.ok(getRoomWorkOptions("Bathrooms").includes("Waterproofing"));
  assert.ok(getRoomWorkOptions("Bathrooms").includes("Plumbing"));
  assert.equal(getRoomWorkOptions("Bathrooms").includes("TV unit & cabinetry"), false);
});
