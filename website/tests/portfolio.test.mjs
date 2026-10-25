import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { portfolioMedia, portfolioHighlights, portfolioClientFilms } from "../src/lib/portfolio.ts";

const publicRoot = path.resolve("public");
test("portfolio contains the unique owner media without inventing photo-to-client mappings", () => {
  assert.equal(portfolioMedia.filter((item) => item.kind === "photo").length, 11);
  assert.equal(portfolioMedia.filter((item) => item.kind === "video").length, 2);
  assert.equal(new Set(portfolioMedia.map((item) => item.id)).size, portfolioMedia.length);
  assert.ok(
    portfolioMedia
      .filter((item) => item.kind === "photo")
      .every((item) => !item.clientId && !item.location),
  );
  assert.deepEqual(
    portfolioClientFilms.map((item) => item.clientId),
    ["harsh-pal", "dharmendra-singh"],
  );
  assert.ok(portfolioHighlights.every((id) => portfolioMedia.some((item) => item.id === id)));
});

test("every portfolio photo has web-sized metadata-free copies and correct intrinsic dimensions", async () => {
  for (const item of portfolioMedia.filter((entry) => entry.kind === "photo")) {
    const full = await sharp(path.join(publicRoot, item.src)).metadata();
    const thumb = await sharp(path.join(publicRoot, item.thumbnail)).metadata();
    assert.equal(full.format, "webp");
    assert.equal(full.width, item.width);
    assert.equal(full.height, item.height);
    assert.equal(thumb.width, 640);
    assert.equal(full.exif, undefined);
    assert.equal(full.xmp, undefined);
    assert.equal(thumb.exif, undefined);
    assert.equal(thumb.xmp, undefined);
    assert.equal(
      Math.round((thumb.height / thumb.width) * 100),
      Math.round((item.height / item.width) * 100),
    );
  }
});

test("owner film links are real MP4 files and remain small enough for deliberate playback", async () => {
  for (const item of portfolioClientFilms) {
    const bytes = await fs.readFile(path.join(publicRoot, item.src));
    assert.equal(bytes.toString("ascii", 4, 8), "ftyp");
    assert.ok(bytes.length < 3_000_000);
    assert.ok(item.width > 0 && item.height > 0);
  }
});
