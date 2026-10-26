import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";

type Environment = Record<string, string | undefined>;
type Options = {
  env?: Environment;
  fetch?: typeof fetch;
  now?: () => number;
};
type RequestContext = { environment?: string; runtime?: unknown };

const bodyLimit = 64 * 1024;
const sessionAge = 2 * 60 * 60;
const sessionCookie = "__Secure-luxe_lead_session";
const unavailable = "We could not confirm this request. Try again or contact us on WhatsApp.";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const reference = /^LX-\d{8}-[A-F0-9]{12}$/;
const fields = ["id", "kind", "name", "phone", "city", "message", "consent", "website"];

function origin(value: string | undefined): string | null {
  try {
    const parsed = new URL(value ?? "");
    return parsed.protocol === "https:" && parsed.origin === value ? parsed.origin : null;
  } catch {
    return null;
  }
}

export function hostedLeadConfiguration(env: Environment = process.env) {
  const url = env.SUPABASE_URL ?? "";
  const key = env.SUPABASE_SECRET_KEY ?? "";
  const secret = env.LUXE_LEADS_HMAC_SECRET ?? "";
  const site = origin(env.SITE_URL) ?? origin(env.URL);
  const valid =
    /^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(url) &&
    /^sb_secret_[A-Za-z0-9_-]{16,256}$/.test(key) &&
    /^[a-f0-9]{64}$/i.test(secret) &&
    site !== null;
  return { valid, enabled: env.LUXE_LEADS_ENABLED === "true", url, key, secret, site };
}

function hasControls(value: string, multiline = false): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code === 127 || (code < 32 && (!multiline || ![9, 10, 13].includes(code)));
  });
}

function line(value: unknown, maximum: number): string | null {
  if (typeof value !== "string" || hasControls(value)) return null;
  const text = value.trim().replace(/\s+/g, " ");
  return text && text.length <= maximum ? text : null;
}

function normalise(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (
    Object.keys(input).length !== fields.length ||
    fields.some((field) => !Object.hasOwn(input, field)) ||
    typeof input.id !== "string" ||
    !uuid.test(input.id) ||
    !["quote", "project-brief", "partner"].includes(String(input.kind)) ||
    input.consent !== true ||
    input.website !== ""
  )
    return null;
  const name = line(input.name, 80);
  const city = line(input.city, 100);
  if (!name || !city || typeof input.phone !== "string" || input.phone.length > 30) return null;
  const digits = input.phone.replace(/[\s()-]/g, "");
  if (!/^(?:\+?91)?[6-9]\d{9}$/.test(digits)) return null;
  if (typeof input.message !== "string" || hasControls(input.message, true)) return null;
  const message = input.message.replace(/\r\n?/g, "\n").trim();
  if (!message || message.length > 10000) return null;
  return {
    id: input.id.toLowerCase(),
    kind: String(input.kind),
    name,
    phone: "+91" + digits.slice(-10),
    city,
    message,
  };
}

class IntakeError extends Error {
  readonly status: number;

  constructor(status: number) {
    super("Lead intake could not be completed.");
    this.status = status;
  }
}

async function readBody(request: Request): Promise<unknown> {
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > bodyLimit))
    throw new IntakeError(413);
  if (!request.body) throw new IntakeError(400);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const reading = async () => {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        bytes += part.value.byteLength;
        if (bytes > bodyLimit) throw new IntakeError(413);
        chunks.push(part.value);
      }
      try {
        return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
      } catch {
        throw new IntakeError(400);
      }
    };
    return await Promise.race([
      reading(),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new IntakeError(408)), 5000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    void reader.cancel().catch(() => {});
  }
}

function runtimeIp(runtime: unknown): string | null {
  if (!runtime || typeof runtime !== "object" || !("ip" in runtime)) return null;
  const value = runtime.ip;
  return typeof value === "string" && isIP(value) ? value : null;
}

export function createHostedLeadIntake(options: Options = {}) {
  const config = hostedLeadConfiguration(options.env);
  const requestFetch = options.fetch ?? fetch;
  const now = options.now ?? Date.now;
  const digest = (value: string) => createHmac("sha256", config.secret).update(value).digest("hex");
  const validSession = (request: Request): string | null => {
    const raw = request.headers
      .get("cookie")
      ?.match(/(?:^|;\s*)__Secure-luxe_lead_session=([^;]+)/)?.[1];
    const parts = raw?.match(/^([0-9]{10,13})\.([a-f0-9]{32})\.([a-f0-9]{64})$/);
    if (!parts) return null;
    const issued = Number(parts[1]);
    if (issued > now() + 5000 || now() - issued > sessionAge * 1000) return null;
    const signature = digest("session:" + parts[1] + "." + parts[2]);
    return timingSafeEqual(Buffer.from(parts[3], "hex"), Buffer.from(signature, "hex"))
      ? raw!
      : null;
  };
  const json = (request: Request, status: number, value: unknown, headers?: HeadersInit) =>
    new Response(request.method === "HEAD" ? null : JSON.stringify(value), {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
        ...headers,
      },
    });

  return {
    async handle(request: Request, context: RequestContext = {}): Promise<Response | null> {
      const url = new URL(request.url);
      const statusPath = url.pathname === "/api/enquiry-delivery/status";
      if (!statusPath && url.pathname !== "/api/enquiry-delivery") return null;
      if (
        !config.valid ||
        !config.enabled ||
        context.environment !== "production" ||
        url.origin !== config.site
      )
        return null;
      const address = runtimeIp(context.runtime);
      if (statusPath) {
        if (!["GET", "HEAD"].includes(request.method))
          return json(
            request,
            405,
            { error: "Use GET to check availability." },
            { Allow: "GET, HEAD" },
          );
        const payload = {
          enabled: Boolean(address),
          channel: "database",
          notifications: { email: false, whatsapp: false },
        };
        if (!address || request.method === "HEAD") return json(request, 200, payload);
        const payloadToken = `${now()}.${randomBytes(16).toString("hex")}`;
        const token =
          validSession(request) ?? `${payloadToken}.${digest("session:" + payloadToken)}`;
        return json(request, 200, payload, {
          "Set-Cookie": `${sessionCookie}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/api/enquiry-delivery; Max-Age=${sessionAge}`,
        });
      }
      if (request.method !== "POST")
        return json(request, 405, { error: "Use POST to submit a request." }, { Allow: "POST" });
      const requestOrigin = request.headers.get("origin");
      const site = request.headers.get("sec-fetch-site");
      if (requestOrigin !== config.site || (site && site !== "same-origin"))
        return json(request, 403, { error: "Please submit from the LuxeInfra website." });
      if (!address) return json(request, 503, { error: unavailable });
      if (!validSession(request))
        return json(request, 403, { error: "Please refresh the page before submitting." });
      if (
        !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(
          request.headers.get("content-type") ?? "",
        )
      )
        return json(request, 415, { error: "Please submit a valid JSON request." });
      try {
        const payload = normalise(await readBody(request));
        if (!payload)
          return json(request, 400, { error: "Please check your contact details and consent." });
        const result = await requestFetch(config.url + "/rest/v1/rpc/luxe_submit_enquiry", {
          method: "POST",
          headers: {
            apikey: config.key,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            p_id: payload.id,
            p_fingerprint: digest("payload:" + JSON.stringify({ ...payload, origin: url.origin })),
            p_kind: payload.kind,
            p_name: payload.name,
            p_phone: payload.phone,
            p_city: payload.city,
            p_message: payload.message,
            p_origin: url.origin,
            p_ip_hash: digest("ip:" + address),
            p_phone_hash: digest("phone:" + payload.phone),
          }),
          redirect: "error",
          signal: AbortSignal.timeout(12_000),
        });
        if (!result.ok) {
          const code = [409, 429].includes(result.status) ? result.status : 503;
          return json(
            request,
            code,
            { error: unavailable },
            code === 429 ? { "Retry-After": "600" } : undefined,
          );
        }
        const declared = result.headers.get("content-length");
        if (declared && Number(declared) > 4096) throw new IntakeError(503);
        const text = await result.text();
        if (text.length > 4096) throw new IntakeError(503);
        const receipt: unknown = JSON.parse(text);
        if (
          !receipt ||
          typeof receipt !== "object" ||
          !("reference" in receipt) ||
          typeof receipt.reference !== "string" ||
          !reference.test(receipt.reference) ||
          !("created_at" in receipt) ||
          typeof receipt.created_at !== "string" ||
          !Number.isFinite(Date.parse(receipt.created_at)) ||
          !("duplicate" in receipt) ||
          typeof receipt.duplicate !== "boolean"
        )
          throw new IntakeError(503);
        return json(request, 202, { reference: receipt.reference, state: "accepted" });
      } catch (error) {
        return json(request, error instanceof IntakeError ? error.status : 503, {
          error: unavailable,
        });
      }
    },
  };
}
