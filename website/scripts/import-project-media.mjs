import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const sourceArgument = process.argv[2];
if (!sourceArgument)
  throw new Error("Provide the owner-approved source folder as the only argument.");
const sourceRoot = path.resolve(sourceArgument);
const destination = path.resolve("public/projects");
if (sourceRoot === destination)
  throw new Error("The source must be separate from the published copies.");

const photos = [
  ["WhatsApp Image 2026-10-25 at 11.08.10 AM (1).jpeg", "bedroom-seating"],
  ["WhatsApp Image 2026-10-25 at 11.08.10 AM.jpeg", "curved-headboard"],
  ["WhatsApp Image 2026-10-25 at 11.08.11 AM (1).jpeg", "green-seating"],
  ["WhatsApp Image 2026-10-25 at 11.08.11 AM.jpeg", "blush-kitchen"],
  ["WhatsApp Image 2026-10-25 at 11.08.12 AM (1).jpeg", "warm-bedroom"],
  ["WhatsApp Image 2026-10-25 at 11.08.12 AM (2).jpeg", "kitchen-wide-view"],
  ["WhatsApp Image 2026-10-25 at 11.08.12 AM (3).jpeg", "living-corner"],
  ["WhatsApp Image 2026-10-25 at 11.08.12 AM.jpeg", "living-pendant"],
  ["WhatsApp Image 2026-10-25 at 11.08.13 AM (1).jpeg", "bedroom-lighting"],
  ["WhatsApp Image 2026-10-25 at 11.08.13 AM (2).jpeg", "kitchen-storage-detail"],
  ["WhatsApp Image 2026-10-25 at 11.08.13 AM.jpeg", "kitchen-worktop-detail"],
];
const videos = [
  ["WhatsApp Video 2026-10-25 at 11.08.14 AM.mp4", "harsh-pal-walkthrough"],
  ["WhatsApp Video 2026-10-25 at 11.08.14 AM (1).mp4", "dharmendra-singh-walkthrough"],
];
const digest = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const sourceFiles = (await fs.readdir(sourceRoot)).filter((file) => /\.(jpe?g|mp4)$/i.test(file));
const sourceHashes = new Map();
for (const file of sourceFiles)
  sourceHashes.set(file, digest(await fs.readFile(path.join(sourceRoot, file))));
const manifest = [];
await fs.mkdir(destination, { recursive: true });

for (const [file, id] of photos) {
  const input = await fs.readFile(path.join(sourceRoot, file));
  const entries = [];
  for (const [suffix, width, quality] of [
    ["", 1600, 86],
    ["-small", 640, 80],
  ]) {
    const outputName = `${id}${suffix}.webp`;
    const output = await sharp(input)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
    await fs.writeFile(path.join(destination, outputName), output);
    const metadata = await sharp(output).metadata();
    if (metadata.exif || metadata.xmp || metadata.iptc || metadata.icc)
      throw new Error(`Unexpected metadata in ${outputName}`);
    entries.push({
      file: outputName,
      bytes: output.length,
      width: metadata.width,
      height: metadata.height,
      hash: digest(output),
    });
  }
  manifest.push({ sourceName: file, sourceHash: sourceHashes.get(file), outputs: entries });
}
for (const [file, id] of videos) {
  const input = await fs.readFile(path.join(sourceRoot, file));
  const outputName = `${id}.mp4`;
  await fs.writeFile(path.join(destination, outputName), input);
  manifest.push({
    sourceName: file,
    sourceHash: sourceHashes.get(file),
    outputs: [{ file: outputName, bytes: input.length, hash: digest(input) }],
  });
}
for (const [file, hash] of sourceHashes) {
  if (digest(await fs.readFile(path.join(sourceRoot, file))) !== hash)
    throw new Error("A source file changed during import.");
}
await fs.mkdir(".private", { recursive: true });
await fs.writeFile(
  ".private/portfolio-import.json",
  JSON.stringify(
    {
      importedAt: new Date().toISOString(),
      sourceFiles: sourceFiles.length,
      uniqueSourceFiles: new Set(sourceHashes.values()).size,
      manifest,
    },
    null,
    2,
  ),
);
const outputs = manifest.flatMap((entry) => entry.outputs);
console.log(
  JSON.stringify({
    sourceFiles: sourceFiles.length,
    uniquePhotos: photos.length,
    uniqueVideos: videos.length,
    publishedFiles: outputs.length,
    publishedBytes: outputs.reduce((sum, entry) => sum + entry.bytes, 0),
    originalFilesUnchanged: true,
  }),
);
