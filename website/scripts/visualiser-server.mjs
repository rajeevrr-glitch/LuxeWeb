import http from "node:http";
import path from "node:path";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { randomBytes, createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { z } from "zod";
import { normaliseRoomLead, saveRoomLead } from "./room-leads.mjs";
import {
  aiConfig,
  generateRoom,
  generationFailure,
  photoAspectRatio,
  roomPrompt,
} from "./visualiser-provider.mjs";

const MAX_UPLOAD = 8 * 1024 * 1024;
const TTL = 30 * 60 * 1000;
const schema = z
  .object({
    id: z.string().uuid(),
    room: z.enum([
      "Kitchen",
      "Living & dining",
      "Master bedroom",
      "Other bedrooms",
      "Bathrooms",
      "Home office",
      "Pooja space",
      "Other space",
    ]),
    style: z.enum(["Warm minimal", "Modern classic", "Natural & relaxed", "Help me choose"]),
    length: z.number().positive().max(100).optional(),
    width: z.number().positive().max(100).optional(),
    height: z.number().positive().max(30).optional(),
    unit: z.enum(["feet", "metres"]),
    changes: z.string().trim().min(10).max(1200),
    keep: z.string().trim().max(600),
    consent: z.literal(true),
    provider: z.enum(["gemini", "openai", "huggingface"]),
    requestedChanges: z
      .array(z.enum(["furniture", "walls", "lighting", "flooring", "decor"]))
      .max(5)
      .default([]),
    preserve: z
      .array(z.enum(["flooring", "furniture"]))
      .max(2)
      .default([]),
    editArea: z
      .object({
        x: z.number().min(0).max(1),
        y: z.number().min(0).max(1),
        width: z.number().positive().max(1),
        height: z.number().positive().max(1),
      })
      .refine((a) => a.x + a.width <= 1.001 && a.y + a.height <= 1.001)
      .optional(),
  })
  .refine((b) => (b.length === undefined) === (b.width === undefined))
  .refine((b) =>
    [b.length, b.width, b.height].every(
      (v, i) =>
        v === undefined ||
        (b.unit === "metres"
          ? v >= 0.3048 && v <= (i === 2 ? 9.144 : 30.48)
          : v >= 1 && v <= (i === 2 ? 30 : 100)),
    ),
  )
  .refine(
    (b) =>
      !(b.requestedChanges.includes("flooring") && b.preserve.includes("flooring")) &&
      !(b.requestedChanges.includes("furniture") && b.preserve.includes("furniture")),
  );
function reply(res, code, data) {
  res.writeHead(code, {
    "content-type": "application/json",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  res.end(JSON.stringify(data));
}
async function normalisePhoto(file) {
  if (
    !file ||
    typeof file === "string" ||
    !file.size ||
    file.size > MAX_UPLOAD ||
    !["image/jpeg", "image/png", "image/webp"].includes(file.type)
  )
    throw new Error("Choose a JPG, PNG or WebP photo up to 8 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const image = sharp(bytes, { limitInputPixels: 40_000_000, failOn: "error", animated: false });
  const meta = await image.metadata();
  const formats = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" };
  if (
    meta.format !== formats[file.type] ||
    (meta.pages || 1) > 1 ||
    meta.width < 256 ||
    meta.height < 256
  )
    throw new Error("Use a single room photo at least 256 pixels on each side.");
  // Decoding and re-encoding removes location/EXIF metadata before any provider transfer.
  return image
    .rotate()
    .resize(1536, 1536, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
}

export function createVisualiserServer({
  config = aiConfig(),
  generate = generateRoom,
  onFailure = (details) => console.error("Room concept failed:", JSON.stringify(details)),
  usageFile = path.resolve(".private/ai-pilot-usage.json"),
  leadDirectory = path.join(path.dirname(usageFile), "room-enquiries"),
  ttl = TTL,
  origins = [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://localhost:5173",
  ],
} = {}) {
  const sessions = new Map();
  const jobs = new Map();
  let busy = false;
  let reservation = Promise.resolve();
  const clean = () => {
    const now = Date.now();
    for (const [id, job] of jobs)
      if (now > job.expiresAt) {
        job.controller.abort();
        jobs.delete(id);
      }
    for (const [id, session] of sessions) if (now > session.expiresAt) sessions.delete(id);
  };
  const timer = setInterval(clean, 60_000);
  timer.unref();
  async function readUsage() {
    try {
      const value = JSON.parse(await readFile(usageFile, "utf8"));
      if (!Number.isInteger(value.attempts) || value.attempts < 0)
        throw new Error("Invalid usage counter.");
      return value.attempts;
    } catch (e) {
      if (e.code === "ENOENT") return 0;
      throw e;
    }
  }
  function reserve() {
    const action = reservation
      .catch(() => {})
      .then(async () => {
        const attempts = await readUsage();
        if (attempts >= config.maxAttempts) return false;
        await mkdir(path.dirname(usageFile), { recursive: true });
        const temp = usageFile + ".pending";
        await writeFile(temp, JSON.stringify({ attempts: attempts + 1 }), { flag: "w" });
        await rename(temp, usageFile);
        return true;
      });
    reservation = action;
    return action;
  }
  const describe = (job) => ({
    id: job.id,
    state: job.state,
    error: job.error || null,
    errorCode: job.errorCode || null,
    expiresAt: job.expiresAt,
    provider: config.label,
    ...(job.state === "completed"
      ? {
          original: `/api/visualiser/jobs/${job.id}/original`,
          concept: `/api/visualiser/jobs/${job.id}/concept`,
        }
      : {}),
  });
  const server = http.createServer(async (req, res) => {
    try {
      clean();
      const hosts = [
        ...origins.map((o) => new URL(o).host),
        `127.0.0.1:${server.address().port}`,
        `localhost:${server.address().port}`,
      ];
      if (
        !hosts.includes(req.headers.host) ||
        (req.headers.origin && !origins.includes(req.headers.origin))
      )
        return reply(res, 403, { error: "Use the local LuxeInfra website." });
      const url = new URL(req.url, "http://" + req.headers.host);
      const cookie = String(req.headers.cookie || "").match(
        /(?:^|;\s*)luxe_visualiser=([a-f0-9]{48})(?:;|$)/,
      )?.[1];
      let session = cookie && sessions.get(cookie);
      if (url.pathname === "/api/visualiser/status" && req.method === "GET") {
        if (!session) {
          if (sessions.size >= 128) return reply(res, 429, { error: "Please try again later." });
          const token = randomBytes(24).toString("hex");
          session = { token, expiresAt: Date.now() + ttl, count: 0 };
          sessions.set(token, session);
          res.setHeader(
            "Set-Cookie",
            `luxe_visualiser=${token}; HttpOnly; SameSite=Strict; Path=/api/visualiser; Max-Age=${Math.floor(ttl / 1000)}`,
          );
        }
        const used = await readUsage();
        return reply(res, 200, {
          enabled: config.enabled,
          provider: config.provider,
          providerLabel: config.label,
          reason: config.blockedReason || null,
          remaining: Math.max(0, config.maxAttempts - used),
          captureAvailable: true,
          message:
            config.blockedReason === "billing_required"
              ? "AI concepts are paused: the connected Google account needs paid image-generation access. You can still prepare a room brief for our designer."
              : !config.enabled
                ? "Image generation is not connected in this preview. You can prepare your room brief below."
                : used >= config.maxAttempts
                  ? "The pilot generation allowance has been used. Contact the studio for the next step."
                  : "Ready for a limited image-generation trial.",
        });
      }
      if (!session)
        return reply(res, 401, {
          error: "Your private preview session expired. Reload this page to begin again.",
        });
      if (url.pathname === "/api/visualiser/leads" && req.method === "POST") {
        if (!origins.includes(req.headers.origin))
          return reply(res, 403, { error: "Use the room design form." });
        if (!String(req.headers["content-type"]).startsWith("application/json"))
          return reply(res, 415, { error: "Use the room design form." });
        if (session.leadSaving)
          return reply(res, 429, { error: "Please contact the studio to update your details." });
        session.leadSaving = true;
        try {
          let bytes = 0;
          const chunks = [];
          for await (const chunk of req) {
            bytes += chunk.length;
            if (bytes > 4000) return reply(res, 413, { error: "Keep your contact details short." });
            chunks.push(chunk);
          }
          let parsed;
          try {
            parsed = normaliseRoomLead(JSON.parse(Buffer.concat(chunks).toString("utf8")));
          } catch {
            return reply(res, 400, { error: "Check your name, mobile number, city and consent." });
          }
          if (!parsed.success)
            return reply(res, 400, { error: "Check your name, mobile number, city and consent." });
          if ((session.leadCount || 0) >= 3 && session.leadId !== parsed.data.id)
            return reply(res, 429, { error: "Please contact the studio to update your details." });
          try {
            const saved = await saveRoomLead(leadDirectory, parsed.data);
            if (session.leadId !== parsed.data.id) session.leadCount = (session.leadCount || 0) + 1;
            session.leadId = parsed.data.id;
            session.leadReference = saved.reference;
            return reply(res, 201, saved);
          } catch (error) {
            if (error.code === "CONFLICT") return reply(res, 409, { error: error.message });
            return reply(res, 503, {
              error: "We could not save your details. No concept was started.",
            });
          }
        } finally {
          session.leadSaving = false;
        }
      }
      const match = url.pathname.match(
        /^\/api\/visualiser\/jobs\/([0-9a-f-]{36})(?:\/(original|concept))?$/i,
      );
      if (match) {
        const job = jobs.get(match[1]);
        if (!job || job.owner !== session.token)
          return reply(res, 404, {
            error: "This concept expired or is unavailable in this browser session.",
          });
        if (req.method === "GET" && !match[2]) return reply(res, 200, describe(job));
        if (req.method === "GET" && match[2] && job.state === "completed") {
          res.writeHead(200, {
            "content-type": "image/jpeg",
            "cache-control": "no-store",
            "x-content-type-options": "nosniff",
            "content-disposition": "inline",
          });
          return res.end(job[match[2]]);
        }
        if (req.method === "DELETE" && !match[2] && origins.includes(req.headers.origin)) {
          job.controller.abort();
          jobs.delete(job.id);
          return reply(res, 200, { deleted: true });
        }
        return reply(res, 405, { error: "Action unavailable." });
      }
      if (url.pathname !== "/api/visualiser/jobs" || req.method !== "POST")
        return reply(res, 404, { error: "Not found." });
      if (!origins.includes(req.headers.origin))
        return reply(res, 403, { error: "Use the room design form." });
      if (!config.enabled)
        return reply(res, 503, {
          error: "Image generation is not connected. No photo was sent to an AI provider.",
        });
      if (!session.leadId)
        return reply(res, 403, {
          error: "Add your name, mobile number and city before creating your room concept.",
          code: "contact_required",
        });
      if (!String(req.headers["content-type"]).startsWith("multipart/form-data;"))
        return reply(res, 415, { error: "Use the room design form." });
      let bytes = 0;
      const chunks = [];
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > MAX_UPLOAD + 16000)
          return reply(res, 413, { error: "Choose a photo up to 8 MB." });
        chunks.push(chunk);
      }
      let brief, photo;
      try {
        const form = await new Request("http://localhost", {
          method: "POST",
          headers: { "content-type": req.headers["content-type"] },
          body: Buffer.concat(chunks),
        }).formData();
        brief = schema.parse(JSON.parse(String(form.get("brief"))));
        if (brief.provider !== config.provider || form.getAll("photo").length !== 1)
          throw new Error("Recheck provider and photo.");
        photo = await normalisePhoto(form.get("photo"));
      } catch {
        return reply(res, 400, {
          error:
            "Check your photo, dimensions, description and consent. Use a single JPG, PNG or WebP, 256px or larger, up to 8 MB.",
        });
      }
      const fingerprint = createHash("sha256")
        .update(JSON.stringify(brief))
        .update(photo)
        .digest("hex");
      const existing = jobs.get(brief.id);
      if (existing) {
        if (existing.owner !== session.token || existing.fingerprint !== fingerprint)
          return reply(res, 409, { error: "This request has changed. Start a new concept." });
        return reply(res, 202, describe(existing));
      }
      if (busy || jobs.size >= 12 || session.count >= 3)
        return reply(res, 429, {
          error: "The pilot is busy or your session limit is reached. Please try later.",
        });
      busy = true;
      try {
        if (!(await reserve())) {
          busy = false;
          return reply(res, 429, {
            error: "The pilot allowance is used. No new generation was started.",
          });
        }
      } catch (e) {
        busy = false;
        throw e;
      }
      session.count++;
      const controller = new AbortController();
      const job = {
        id: brief.id,
        owner: session.token,
        state: "generating",
        fingerprint,
        leadReference: session.leadReference,
        controller,
        original: photo,
        expiresAt: Date.now() + ttl,
      };
      jobs.set(job.id, job);
      reply(res, 202, describe(job));
      const timeout = setTimeout(() => controller.abort(), 180000);
      (async () => {
        try {
          const meta = await sharp(photo).metadata();
          const result = await generate({
            config,
            photo,
            prompt: roomPrompt(brief),
            signal: controller.signal,
            aspectRatio: photoAspectRatio(meta.width, meta.height),
          });
          if (controller.signal.aborted) throw new Error("Generation stopped.");
          if (!result?.length || result.length > 15 * 1024 * 1024)
            throw new Error("Invalid output.");
          job.concept = await sharp(result, { limitInputPixels: 40_000_000, failOn: "error" })
            .rotate()
            .resize(1536, 1536, { fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 90 })
            .toBuffer();
          job.state = "completed";
        } catch (error) {
          job.state = "failed";
          const failure = generationFailure(error, controller.signal.aborted);
          job.error = failure.message;
          job.errorCode = failure.code;
          try {
            onFailure({ provider: config.provider, code: failure.code, status: failure.status });
          } catch {
            // Diagnostics must never prevent the request from finishing safely.
          }
        } finally {
          clearTimeout(timeout);
          busy = false;
        }
      })();
    } catch {
      if (!res.headersSent)
        reply(res, 500, {
          error: "The private image service is unavailable. No result has been confirmed.",
        });
    }
  });
  server.on("close", () => {
    clearInterval(timer);
    for (const job of jobs.values()) job.controller.abort();
    jobs.clear();
    sessions.clear();
  });
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.loadEnvFile(".env.local");
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  const server = createVisualiserServer();
  server.on("error", () => {
    console.error(
      "The private room visualiser could not start. Check whether another preview is open.",
    );
    process.exitCode = 1;
  });
  server.listen(8791, "127.0.0.1", () =>
    console.log(
      "Private room visualiser: http://127.0.0.1:8791 — generation requires local configuration.",
    ),
  );
}
