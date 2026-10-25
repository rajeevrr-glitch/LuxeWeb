import { createHash, randomBytes } from "node:crypto";
import { link, lstat, mkdir, open, readFile, rename, unlink } from "node:fs/promises";
import path from "node:path";

const BODY_LIMIT = 64 * 1024;
const MAX_RATE_KEYS = 5000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATES = new Set(["accepted", "provider_pending", "failed", "uncertain"]);
const FIELDS = ["id", "kind", "name", "phone", "city", "message", "consent", "website"];
const UNAVAILABLE =
  "We couldn’t send your request automatically. Please contact the studio on WhatsApp.";

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function cleanLine(value, maximum) {
  if (typeof value !== "string" || hasControlCharacters(value)) return null;
  const cleaned = value.trim().replace(/\s+/g, " ");
  return cleaned && cleaned.length <= maximum ? cleaned : null;
}

function hasControlCharacters(value, multiline = false) {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code === 127 || (code < 32 && (!multiline || ![9, 10, 13].includes(code)));
  });
}

function normalise(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).length !== FIELDS.length ||
    FIELDS.some((field) => !Object.hasOwn(value, field)) ||
    typeof value.id !== "string" ||
    !UUID.test(value.id) ||
    !["quote", "project-brief", "partner"].includes(value.kind) ||
    value.consent !== true ||
    value.website !== ""
  )
    return null;
  const name = cleanLine(value.name, 80);
  const city = cleanLine(value.city, 100);
  if (!name || !city || typeof value.phone !== "string" || value.phone.length > 30) return null;
  const digits = value.phone.replace(/[\s()-]/g, "");
  if (!/^(?:\+?91)?[6-9]\d{9}$/.test(digits)) return null;
  const phone = "+91" + digits.slice(-10);
  if (typeof value.message !== "string" || hasControlCharacters(value.message, true)) return null;
  const message = value.message.replace(/\r\n?/g, "\n").trim();
  if (!message || message.length > 10000) return null;
  return { id: value.id.toLowerCase(), kind: value.kind, name, phone, city, message };
}

function readJson(req) {
  const length = req.headers["content-length"];
  if (length && (!/^\d+$/.test(length) || Number(length) > BODY_LIMIT)) {
    req.resume();
    return Promise.reject(new RequestError(413, "This request is too large."));
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;
    const cleanup = () => {
      clearTimeout(timer);
      req.off("data", data);
      req.off("end", end);
      req.off("error", error);
      req.off("aborted", aborted);
    };
    const fail = (reason) => {
      cleanup();
      req.once("error", () => {});
      req.resume();
      reject(reason);
    };
    const data = (chunk) => {
      bytes += chunk.length;
      if (bytes > BODY_LIMIT) return fail(new RequestError(413, "This request is too large."));
      chunks.push(chunk);
    };
    const end = () => {
      cleanup();
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new RequestError(400, "Please check the request details and try again."));
      }
    };
    const error = () => fail(new RequestError(400, "The request could not be read."));
    const aborted = () => fail(new RequestError(400, "The request was interrupted."));
    const timer = setTimeout(
      () => fail(new RequestError(408, "The request took too long. Please try again.")),
      10000,
    );
    timer.unref();
    req.on("data", data);
    req.once("end", end);
    req.once("error", error);
    req.once("aborted", aborted);
  });
}

async function temporaryRecord(directory, record) {
  const temporary = path.join(directory, `.${record.id}-${randomBytes(8).toString("hex")}.tmp`);
  const file = await open(temporary, "wx", 0o600);
  try {
    await file.writeFile(JSON.stringify(record) + "\n", "utf8");
    await file.sync();
  } catch (error) {
    await file.close();
    await unlink(temporary).catch(() => {});
    throw error;
  }
  await file.close();
  return temporary;
}

async function syncDirectory(directory) {
  // Node cannot open a directory handle for flushing on Windows. Production
  // storage must provide a durable filesystem; POSIX also flushes directory entries.
  if (process.platform === "win32") return;
  const handle = await open(directory, "r");
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function readRecord(filename, id) {
  const info = await lstat(filename);
  if (!info.isFile() || info.isSymbolicLink() || info.size > 64 * 1024)
    throw new Error("Invalid delivery record");
  const record = JSON.parse(await readFile(filename, "utf8"));
  if (
    record.id !== id ||
    !STATES.has(record.state) ||
    !/^[a-f0-9]{64}$/.test(record.fingerprint) ||
    !/^LX-\d{8}-[A-F0-9]{12}$/.test(record.reference)
  )
    throw new Error("Invalid delivery record");
  return record;
}

async function claim(directory, record) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const directoryInfo = await lstat(directory);
  if (
    !directoryInfo.isDirectory() ||
    directoryInfo.isSymbolicLink() ||
    (process.platform !== "win32" && (directoryInfo.mode & 0o077) !== 0)
  )
    throw new Error("Invalid delivery directory");
  const filename = path.join(directory, record.id + ".json");
  const temporary = await temporaryRecord(directory, record);
  try {
    // Linking a complete, synced file claims this ID without exposing a partial record
    // or replacing another server process's existing claim.
    await link(temporary, filename);
    await syncDirectory(directory);
    return { owned: true, record };
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    return { owned: false, record: await readRecord(filename, record.id) };
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

async function replace(directory, record) {
  const temporary = await temporaryRecord(directory, record);
  try {
    await rename(temporary, path.join(directory, record.id + ".json"));
    await syncDirectory(directory);
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

/**
 * Private, single-attempt delivery. A provider's acceptance is not a WhatsApp
 * delivery receipt. Interrupted or ambiguous attempts require operator review.
 */
export function createEnquiryDelivery({
  enabled = false,
  origins = [],
  directory,
  notify,
  clock = Date.now,
  maxConcurrent = 4,
  rateLimit = 12,
  rateWindowMs = 10 * 60 * 1000,
  deliveryTimeoutMs = 15000,
} = {}) {
  const configured =
    enabled === true &&
    typeof notify === "function" &&
    typeof directory === "string" &&
    path.isAbsolute(directory) &&
    Array.isArray(origins) &&
    origins.length > 0 &&
    origins.every((origin) => {
      try {
        return typeof origin === "string" && new URL(origin).origin === origin;
      } catch {
        return false;
      }
    });
  const allowed = new Set(origins);
  const inflight = new Map();
  const limits = new Map();
  const concurrentLimit = Math.max(1, Math.min(16, Math.floor(maxConcurrent) || 4));
  const perWindowLimit = Math.max(1, Math.min(100, Math.floor(rateLimit) || 12));
  const windowMs = Math.max(1000, Math.min(3600000, rateWindowMs || 600000));
  const timeoutMs = Math.max(10, Math.min(60000, deliveryTimeoutMs || 15000));
  let activeRequests = 0;
  let activeSends = 0;

  const status = () => ({ enabled: configured, channel: "whatsapp" });

  const deliverRequest = async (payload, fingerprint) => {
    try {
      const previous = await readRecord(path.join(directory, payload.id + ".json"), payload.id);
      if (previous.fingerprint !== fingerprint)
        throw new RequestError(409, "This request changed. Please review it and submit again.");
      return previous;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    // Reserve a provider slot before the first asynchronous storage operation.
    // Overload is retryable because it has not claimed or attempted this ID.
    if (activeSends >= concurrentLimit) throw new RequestError(503, UNAVAILABLE);
    activeSends++;
    let providerStarted = false;
    try {
      const now = new Date(clock()).toISOString();
      const pending = {
        version: 1,
        id: payload.id,
        reference: `LX-${now.slice(0, 10).replaceAll("-", "")}-${randomBytes(6).toString("hex").toUpperCase()}`,
        state: "provider_pending",
        fingerprint,
        createdAt: now,
        updatedAt: now,
        consent: { accepted: true, recordedAt: now },
        request: payload,
      };
      const claimed = await claim(directory, pending);
      if (claimed.record.fingerprint !== fingerprint)
        throw new RequestError(409, "This request changed. Please review it and submit again.");
      if (!claimed.owned) return claimed.record;
      let record = pending;
      let timer;
      try {
        providerStarted = true;
        const attempt = Promise.resolve()
          .then(() =>
            notify({
              reference: record.reference,
              kind: payload.kind,
              name: payload.name,
              phone: payload.phone,
              city: payload.city,
              message: payload.message,
            }),
          )
          .finally(() => activeSends--);
        const receipt = await Promise.race([
          attempt,
          new Promise((_, reject) => {
            timer = setTimeout(
              () => reject(new Error("Provider acceptance unconfirmed")),
              timeoutMs,
            );
            timer.unref();
          }),
        ]);
        if (
          !receipt ||
          typeof receipt.providerMessageId !== "string" ||
          !receipt.providerMessageId.trim() ||
          receipt.providerMessageId.length > 512 ||
          hasControlCharacters(receipt.providerMessageId)
        )
          throw new Error("Provider acceptance unconfirmed");
        record = {
          ...pending,
          state: "accepted",
          providerMessageId: receipt.providerMessageId,
          updatedAt: new Date(clock()).toISOString(),
        };
      } catch (error) {
        record = {
          ...pending,
          state: error?.deliveryState === "failed" ? "failed" : "uncertain",
          updatedAt: new Date(clock()).toISOString(),
        };
      } finally {
        clearTimeout(timer);
      }
      await replace(directory, record);
      return record;
    } finally {
      if (!providerStarted) activeSends--;
    }
  };

  const handle = async (req, res) => {
    const send = (code, body) => {
      if (res.destroyed || res.writableEnded) return;
      res.writeHead(code, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(req.method === "HEAD" ? undefined : JSON.stringify(body));
    };
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return send(405, { error: "Use POST to submit a request." });
    }
    if (!configured) return send(503, { error: UNAVAILABLE });
    if (typeof req.headers.origin !== "string" || !allowed.has(req.headers.origin))
      return send(403, { error: "This request is not allowed." });
    if (
      typeof req.headers["content-type"] !== "string" ||
      !/^application\/json(?:\s*;\s*charset\s*=\s*utf-8)?\s*$/i.test(req.headers["content-type"]) ||
      (req.headers["content-encoding"] && req.headers["content-encoding"] !== "identity")
    )
      return send(415, { error: "Send request details as JSON." });
    const now = clock();
    for (const [key, limit] of limits) if (limit.expires <= now) limits.delete(key);
    // Use only the socket address: forwarded IP headers are not trusted here.
    const key = req.socket.remoteAddress || "unknown";
    const limit = limits.get(key);
    if ((!limit && limits.size >= MAX_RATE_KEYS) || (limit && limit.count >= perWindowLimit)) {
      res.setHeader(
        "Retry-After",
        String(Math.ceil(((limit?.expires || now + windowMs) - now) / 1000)),
      );
      return send(429, { error: "Please wait a moment before trying again." });
    }
    limits.set(key, { count: (limit?.count || 0) + 1, expires: limit?.expires || now + windowMs });
    if (activeRequests >= concurrentLimit * 4) {
      res.setHeader("Retry-After", "30");
      return send(503, { error: UNAVAILABLE });
    }
    activeRequests++;
    try {
      const payload = normalise(await readJson(req));
      if (!payload) throw new RequestError(400, "Please check the request details and try again.");
      const fingerprint = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
      const existing = inflight.get(payload.id);
      if (existing && existing.fingerprint !== fingerprint)
        throw new RequestError(409, "This request changed. Please review it and submit again.");
      let operation = existing?.operation;
      if (!operation) {
        operation = deliverRequest(payload, fingerprint);
        inflight.set(payload.id, { fingerprint, operation });
        operation
          .finally(() => {
            if (inflight.get(payload.id)?.operation === operation) inflight.delete(payload.id);
          })
          .catch(() => {});
      }
      const record = await operation;
      if (record.state === "accepted")
        return send(202, { reference: record.reference, state: "accepted" });
      return send(503, { reference: record.reference, state: record.state, error: UNAVAILABLE });
    } catch (error) {
      if (error instanceof RequestError) return send(error.status, { error: error.message });
      return send(503, { error: UNAVAILABLE });
    } finally {
      activeRequests--;
    }
  };

  return { status, handle };
}
