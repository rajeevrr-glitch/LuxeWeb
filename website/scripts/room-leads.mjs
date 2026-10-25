import { randomBytes, createHash } from "node:crypto";
import { mkdir, open, lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const line = (maximum) =>
  z
    .string()
    .trim()
    .min(2)
    .max(maximum)
    .refine((value) =>
      [...value].every(
        (character) => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127,
      ),
    );
const leadSchema = z
  .object({
    id: z.string().uuid(),
    name: line(80),
    phone: z
      .string()
      .max(30)
      .transform((value) => value.replace(/[\s()-]/g, ""))
      .refine((value) => /^(?:\+?91)?[6-9]\d{9}$/.test(value))
      .transform((value) => "+91" + value.slice(-10)),
    city: line(100),
    room: line(40),
    style: line(40),
    consent: z.literal(true),
    website: z.literal(""),
  })
  .strict();

export function normaliseRoomLead(value) {
  return leadSchema.safeParse(value);
}

// These records are for the studio's private follow-up, never static website assets.
// Photo bytes, filenames and AI prompts do not belong in the contact record.
async function persistRoomLead(directory, payload) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const info = await lstat(directory);
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error("Invalid private storage.");
  const fingerprint = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  const filename = path.join(directory, payload.id + ".json");
  const entries = await readdir(directory);
  if (
    entries.filter((entry) => entry.endsWith(".json")).length >= 1000 &&
    !entries.includes(payload.id + ".json")
  )
    throw new Error("Private lead storage needs studio review.");
  const record = {
    version: 1,
    id: payload.id,
    reference: "LR-" + randomBytes(8).toString("hex").toUpperCase(),
    createdAt: new Date().toISOString(),
    state: "saved_locally",
    kind: "room-concept",
    contact: { name: payload.name, phone: payload.phone, city: payload.city },
    room: payload.room,
    style: payload.style,
    consent: { accepted: true, purpose: "room-design-follow-up", version: 1 },
    fingerprint,
  };
  let file;
  try {
    file = await open(filename, "wx", 0o600);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const previousInfo = await lstat(filename);
    if (!previousInfo.isFile() || previousInfo.isSymbolicLink() || previousInfo.size > 8000)
      throw new Error("Invalid private record.");
    const previous = JSON.parse(await readFile(filename, "utf8"));
    if (previous.id !== payload.id || previous.fingerprint !== fingerprint) {
      const conflict = new Error("This request changed. Review your details and save again.");
      conflict.code = "CONFLICT";
      throw conflict;
    }
    return { reference: previous.reference, state: "saved_locally" };
  }
  try {
    await file.writeFile(JSON.stringify(record) + "\n", "utf8");
    await file.sync();
  } finally {
    await file.close();
  }
  return { reference: record.reference, state: "saved_locally" };
}

let pending = Promise.resolve();
export function saveRoomLead(directory, payload) {
  const next = pending.catch(() => {}).then(() => persistRoomLead(directory, payload));
  pending = next;
  return next;
}
