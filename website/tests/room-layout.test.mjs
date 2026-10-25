import { test } from "node:test";
import assert from "node:assert/strict";
import {
  analyseLayout,
  displayMeasure,
  frontZone,
  itemRect,
  layoutNotes,
  overlaps,
  sampleLayout,
  toMetres,
} from "../src/lib/room-layout.ts";
const item = (values = {}) => ({
  id: "bed",
  kind: "bed",
  label: "Bed",
  x: 0.5,
  y: 0.5,
  width: 1.5,
  depth: 2,
  rotation: 0,
  ...values,
});
const room = (values = {}) => ({
  width: 4,
  depth: 4,
  clearance: 0.6,
  items: [],
  openings: [],
  ...values,
});
test("the illustrative layout has no modeled conflicts and remains unverified in the handoff", () => {
  const plan = sampleLayout();
  const original = structuredClone(plan);
  assert.deepEqual(analyseLayout(plan), []);
  const note = layoutNotes(plan, "feet", false);
  assert.match(note, /illustrative or unconfirmed/);
  assert.match(note, /not exact swing arcs/);
  assert.match(note, /not a construction or fit certification/);
  assert.deepEqual(plan, original);
});
test("untouched sample layouts use furniture appropriate to the chosen room", () => {
  assert.equal(
    sampleLayout("Home office").items.some((i) => i.kind === "bed"),
    false,
  );
  assert.equal(
    sampleLayout("Living & dining").items.some((i) => i.kind === "sofa"),
    true,
  );
  assert.equal(sampleLayout("Other space").items.length, 0);
  assert.deepEqual(analyseLayout(sampleLayout("Home office")), []);
  assert.deepEqual(analyseLayout(sampleLayout("Living & dining")), []);
});
test("furniture rotation changes its footprint and moves its front clearance", () => {
  const bed = item({ rotation: 90 });
  assert.deepEqual(itemRect(bed), { x: 0.5, y: 0.5, width: 2, depth: 1.5 });
  assert.deepEqual(frontZone(bed, 0.4), { x: 0.09999999999999998, y: 0.5, width: 0.4, depth: 1.5 });
  assert.equal(
    analyseLayout(room({ items: [bed] })).some((i) => i.code === "front_at_wall"),
    true,
  );
});
test("touching furniture edges are allowed while actual overlaps and boundary breaches are flagged", () => {
  assert.equal(
    overlaps({ x: 0, y: 0, width: 1, depth: 1 }, { x: 1, y: 0, width: 1, depth: 1 }),
    false,
  );
  let issues = analyseLayout(
    room({ items: [item(), item({ id: "desk", kind: "desk", label: "Desk", x: 1, y: 1 })] }),
  );
  assert.equal(issues.filter((i) => i.code === "furniture_overlap").length, 1);
  issues = analyseLayout(room({ items: [item({ x: 3 })] }));
  assert.equal(
    issues.some((i) => i.code === "outside_room"),
    true,
  );
});
test("door access conflicts are warnings; nearby windows require a height check rather than a false fit result", () => {
  const plan = room({
    items: [item({ x: 0, y: 0 })],
    openings: [
      { id: "door", kind: "door", wall: "north", offset: 0.1, width: 0.8 },
      { id: "window", kind: "window", wall: "west", offset: 0.5, width: 1 },
    ],
  });
  const issues = analyseLayout(plan);
  assert.equal(
    issues.some((i) => i.code === "door_obstructed" && i.severity === "warning"),
    true,
  );
  assert.equal(
    issues.some((i) => i.code === "window_check" && i.severity === "note"),
    true,
  );
  assert.equal(
    analyseLayout(
      room({ openings: [{ id: "door", kind: "door", wall: "east", offset: 3.5, width: 1 }] }),
    )[0].code,
    "opening_outside",
  );
});
test("invalid geometry cannot become an all-clear and a chosen front gap detects an obstruction", () => {
  assert.equal(analyseLayout(room({ width: NaN }))[0].code, "room_dimensions");
  assert.equal(analyseLayout(room({ items: [item({ width: 0 })] }))[0].code, "item_dimensions");
  assert.equal(
    analyseLayout(
      room({
        items: [
          item(),
          item({
            id: "table",
            kind: "table",
            label: "Table",
            x: 0.5,
            y: 2.6,
            width: 1,
            depth: 0.5,
          }),
        ],
      }),
    ).some((i) => i.code === "front_obstructed"),
    true,
  );
});
test("changing display units preserves physical room size and supplied measurements never imply site verification", () => {
  assert.ok(Math.abs(toMetres(12, "feet") - 3.6576) < 1e-9);
  assert.equal(displayMeasure(3.6576, "feet"), 12);
  assert.equal(displayMeasure(3.6576, "metres"), 3.66);
  assert.match(layoutNotes(sampleLayout(), "metres", true), /not site-verified/);
});
