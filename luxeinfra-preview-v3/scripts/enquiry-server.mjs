import http from "node:http";
import { mkdir, writeFile, readFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const text = (max = 160) => z.string().trim().max(max);
const schema = z
  .object({
    id: z.string().uuid(),
    region: z.enum(["Uttar Pradesh", "Delhi NCR", "Bengaluru", "Other / please confirm"]),
    city: text().min(2),
    property: z.enum(["Apartment", "Independent home", "Other"]),
    area: text(12).refine(
      (v) => !v || (/^\d+(\.\d+)?$/.test(v) && Number(v) > 0 && Number(v) <= 1000000),
    ),
    condition: z.enum(["New home", "Renovation"]),
    configuration: z
      .enum(["Not sure", "Studio", "1 BHK", "2 BHK", "3 BHK", "4+ BHK", "Other"])
      .default("Not sure"),
    readiness: z
      .enum([
        "To discuss",
        "Keys received / ready",
        "Awaiting possession",
        "Currently occupied",
        "Work already underway",
      ])
      .default("To discuss"),
    scope: z.enum(["Whole home", "Selected rooms", "Help me decide"]),
    rooms: z
      .array(
        z.enum([
          "Kitchen",
          "Living & dining",
          "Master bedroom",
          "Other bedrooms",
          "Bathrooms",
          "Home office",
          "Pooja space",
          "Other space",
        ]),
      )
      .min(1)
      .max(8),
    work: z.record(
      z.string(),
      z
        .array(
          z.enum([
            "Design & layout",
            "Modular kitchen",
            "Wardrobes & storage",
            "TV unit & cabinetry",
            "False ceiling",
            "Lighting",
            "Painting",
            "Flooring & tiling",
            "Electrical",
            "Plumbing",
            "Furniture & decor",
          ]),
        )
        .max(12),
    ),
    style: z.enum(["Warm minimal", "Modern classic", "Natural & relaxed", "Help me choose"]),
    priorities: z.array(text(80)).max(5),
    budget: z.enum(["Need guidance", "Under ₹5 lakh", "₹5–10 lakh", "₹10–20 lakh", "₹20 lakh+"]),
    timing: z.enum(["Exploring ideas", "Within 1 month", "1–3 months", "3–6 months", "Later"]),
    name: text(100).min(2),
    phone: text(25).refine((v) => /^(?:\+?91[ -]?)?[6-9]\d{9}$/.test(v.replace(/\s/g, ""))),
    email: z.union([z.literal(""), z.string().email().max(254)]),
    method: z.enum(["Phone", "WhatsApp", "Email"]),
    time: text(80),
    notes: text(2000),
    consent: z.literal(true),
    website: z.literal(""),
    inspirations: z.array(z.object({ id: text(100), title: text(160) })).max(12),
  })
  .superRefine((v, ctx) => {
    if (v.method === "Email" && !v.email)
      ctx.addIssue({ code: "custom", message: "Email address is required for email contact." });
    if (v.scope !== "Help me decide" && v.rooms.some((r) => !v.work[r]?.length))
      ctx.addIssue({
        code: "custom",
        message: "Select work for each room, or choose help deciding.",
      });
  });
const MAX_BODY = 31 * 1024 * 1024;
function reply(res, code, value) {
  res.writeHead(code, {
    "content-type": "application/json",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  res.end(JSON.stringify(value));
}
export function createEnquiryServer({
  directory = path.resolve(".private/enquiries"),
  origins = ["http://localhost:5173", "http://127.0.0.1:5173"],
} = {}) {
  const locks = new Map();
  const attempts = new Map();
  return http.createServer(async (req, res) => {
    try {
      if (req.url === "/api/status" && req.method === "GET")
        return reply(res, 200, { mode: "local-preview", notifications: false });
      if (req.url !== "/api/enquiries" || req.method !== "POST")
        return reply(res, 404, { error: "Not found" });
      if (!origins.includes(req.headers.origin))
        return reply(res, 403, { error: "Request origin is not allowed." });
      if (!String(req.headers["content-type"]).startsWith("multipart/form-data;"))
        return reply(res, 415, { error: "Use the project form to submit your brief." });
      const ip = req.socket.remoteAddress;
      const now = Date.now();
      for (const [key, value] of attempts) if (now - value.start > 600000) attempts.delete(key);
      const rate = attempts.get(ip) || { start: now, count: 0 };
      rate.count++;
      attempts.set(ip, rate);
      if (rate.count > 20)
        return reply(res, 429, { error: "Too many attempts. Please try again in ten minutes." });
      if (Number(req.headers["content-length"]) > MAX_BODY)
        return reply(res, 413, { error: "Please keep all files below 30 MB in total." });
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > MAX_BODY) {
          reply(res, 413, { error: "Upload too large." });
          req.destroy();
          return;
        }
        chunks.push(chunk);
      }
      const request = new Request("http://localhost/api/enquiries", {
        method: "POST",
        headers: { "content-type": req.headers["content-type"] },
        body: Buffer.concat(chunks),
      });
      let form, brief;
      try {
        form = await request.formData();
        brief = schema.parse(JSON.parse(String(form.get("brief"))));
      } catch {
        return reply(res, 400, { error: "Please check your project and contact details." });
      }
      const files = form.getAll("files");
      if (files.length > 3) return reply(res, 400, { error: "Attach up to three files." });
      const verified = [];
      for (const file of files) {
        if (typeof file === "string" || !file.size || file.size > 10 * 1024 * 1024)
          return reply(res, 400, { error: "Each file must be between 1 byte and 10 MB." });
        const bytes = Buffer.from(await file.arrayBuffer());
        const ext = path.extname(file.name).toLowerCase();
        const valid =
          (ext === ".pdf" &&
            file.type === "application/pdf" &&
            bytes.subarray(0, 5).toString() === "%PDF-") ||
          ([".jpg", ".jpeg"].includes(ext) &&
            file.type === "image/jpeg" &&
            bytes[0] === 255 &&
            bytes[1] === 216 &&
            bytes[2] === 255) ||
          (ext === ".png" &&
            file.type === "image/png" &&
            bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])));
        if (!valid)
          return reply(res, 400, { error: "Only valid PDF, JPG, and PNG files are accepted." });
        verified.push({
          bytes,
          filename: `${verified.length + 1}${ext}`,
          originalName: path.basename(file.name).slice(0, 180),
          type: file.type,
          size: file.size,
        });
      }
      const digest = createHash("sha256").update(JSON.stringify(brief));
      for (const file of verified) digest.update(file.bytes);
      const fingerprint = digest.digest("hex");
      const target = path.join(directory, brief.id);
      const persist = async () => {
        try {
          const existing = JSON.parse(await readFile(path.join(target, "brief.json"), "utf8"));
          if (existing.fingerprint !== fingerprint)
            throw Object.assign(new Error("This submission has changed. Start a new brief."), {
              status: 409,
            });
          return existing.receipt;
        } catch (e) {
          if (e.code !== "ENOENT") throw e;
        }
        await mkdir(directory, { recursive: true });
        const temporary = path.join(directory, `.pending-${randomUUID()}`);
        await mkdir(temporary);
        const receipt = {
          reference: `LX-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${brief.id.slice(0, 8).toUpperCase()}`,
          mode: "local-preview",
          notification: "not-configured",
        };
        try {
          for (const file of verified)
            await writeFile(path.join(temporary, file.filename), file.bytes, { flag: "wx" });
          await writeFile(
            path.join(temporary, "brief.json"),
            JSON.stringify(
              {
                ...brief,
                fingerprint,
                receipt,
                receivedAt: new Date().toISOString(),
                status: "New",
                files: verified.map(({ bytes, ...file }) => file),
                notification: { status: "not-configured", recipient: "infoluxeinfra@gmail.com" },
              },
              null,
              2,
            ),
            { flag: "wx" },
          );
          await rename(temporary, target);
          return receipt;
        } catch (e) {
          await rm(temporary, { recursive: true, force: true });
          throw e;
        }
      };
      const previous = locks.get(brief.id) || Promise.resolve();
      const job = previous.catch(() => {}).then(persist);
      locks.set(brief.id, job);
      try {
        return reply(res, 201, await job);
      } finally {
        if (locks.get(brief.id) === job) locks.delete(brief.id);
      }
    } catch (e) {
      reply(res, e.status || 500, {
        error: e.status
          ? e.message
          : "Your brief could not be saved. Your form is still here; please try again.",
      });
    }
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createEnquiryServer().listen(8788, "127.0.0.1", () =>
    console.log("Private enquiry storage: http://127.0.0.1:8788"),
  );
}
