import { test } from "node:test";
import assert from "node:assert/strict";
import { convertDimension, approximateArea } from "../src/lib/room-dimensions.ts";
test("dimension switches convert the same room, preserve blanks, and handle decimal inputs", () => {
  assert.equal(convertDimension("12", "feet", "metres"), "3.658");
  assert.ok(Math.abs(Number(convertDimension("3.658", "metres", "feet")) - 12) < 0.002);
  assert.equal(convertDimension("", "feet", "metres"), "");
  assert.equal(convertDimension("invalid", "feet", "metres"), "invalid");
  assert.equal(convertDimension("100", "feet", "metres"), "30.48");
  assert.equal(convertDimension("30", "feet", "metres"), "9.144");
  assert.equal(approximateArea("12", "10"), "120");
  assert.equal(approximateArea("", "10"), null);
  assert.equal(approximateArea("-1", "10"), null);
});
