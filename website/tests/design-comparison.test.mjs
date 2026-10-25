import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sanitiseDesignComparison,
  describeDesignComparison,
  readDesignComparison,
} from "../src/lib/design-comparison.ts";

const catalogue = [1, 2, 3, 4].map((i) => ({
  id: `bedroom-${i}`,
  title: `Bedroom reference ${i}`,
}));
const ids = catalogue.map((item) => item.id);

test("a deliberately empty comparison survives reload instead of reselecting defaults", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  let stored = null;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: () => stored },
  });
  try {
    assert.deepEqual(readDesignComparison(ids, ids.slice(0, 3)).ids, ids.slice(0, 3));
    stored = JSON.stringify({ ids: [], preferences: {} });
    assert.deepEqual(readDesignComparison(ids, ids.slice(0, 3)).ids, []);
    stored = "not valid JSON";
    assert.deepEqual(readDesignComparison(ids), { ids: [], preferences: {} });
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else delete globalThis.localStorage;
  }
});

test("comparison accepts at most three known unique catalogue IDs and fixed tags only", () => {
  assert.deepEqual(
    sanitiseDesignComparison(
      {
        ids: ["unknown", ids[0], ids[0], ids[1], ids[2], ids[3]],
        preferences: {
          [ids[0]]: ["Lighting", "Invented marble", "Lighting", "Layout"],
          unknown: ["Layout"],
          [ids[1]]: "Storage approach",
        },
        note: "Free text must never be stored",
      },
      ids,
    ),
    {
      ids: ids.slice(0, 3),
      preferences: { [ids[0]]: ["Layout", "Lighting"] },
    },
  );
  assert.deepEqual(sanitiseDesignComparison(null, ids), { ids: [], preferences: {} });
  assert.deepEqual(sanitiseDesignComparison({ ids: "bedroom-1", preferences: [] }, ids), {
    ids: [],
    preferences: {},
  });
});

test("comparison description uses current titles, selected IDs and explicit optional notes", () => {
  const comparison = {
    ids: [ids[0], "unknown"],
    preferences: { [ids[0]]: ["Colour palette"], [ids[1]]: ["Layout"] },
  };
  assert.equal(
    describeDesignComparison(comparison, catalogue),
    "Bedroom reference 1 (ref: bedroom-1)\nWhat I like: Colour palette",
  );
  const description = describeDesignComparison(comparison, catalogue, {
    [ids[0]]: "x".repeat(200),
    [ids[1]]: "Not compared",
  });
  assert.equal(description.split("My note: ")[1].length, 180);
  assert.equal(description.includes("Not compared"), false);
});
