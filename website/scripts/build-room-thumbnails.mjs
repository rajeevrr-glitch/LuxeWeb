import { mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assets = path.join(root, "src/assets");
const output = path.join(assets, "thumbnails");
const rooms = ["full-home", "kitchen", "wardrobe", "bedroom", "living", "kids", "pooja", "office"];
const widths = [160, 320];

await mkdir(output, { recursive: true });

let originalTotal = 0;
const variantTotals = Object.fromEntries(widths.map((width) => [width, 0]));

for (const room of rooms) {
  const source = await readFile(path.join(assets, `${room}.jpg`));
  originalTotal += source.length;
  const variants = [];

  for (const width of widths) {
    const filename = `${room}-${width}.webp`;
    // Preserve the source composition. Card cropping remains a presentation choice in CSS.
    await sharp(source)
      .autoOrient()
      .resize({ width, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80, effort: 6 })
      .toFile(path.join(output, filename));
    const bytes = (await stat(path.join(output, filename))).size;
    variantTotals[width] += bytes;
    variants.push({ filename, bytes });
  }

  console.log(JSON.stringify({ room, originalBytes: source.length, variants }));
}

console.log(
  JSON.stringify({
    originalTotal,
    variantTotals,
    note: "A responsive browser chooses one variant per room; these totals are not cumulative transfer estimates.",
  }),
);
