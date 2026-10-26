import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { isIP } from "node:net";
import { hostedLeadConfiguration } from "./hosted-config.server.ts";

type Options = {
  env?: Record<string, string | undefined>;
  fetch?: typeof fetch;
  now?: () => number;
};
type Context = { environment?: string; runtime?: unknown };
type ObjectValue = Record<string, unknown>;
type RecoverySession = {
  v: 1;
  issued: number;
  expires: number;
  access: string;
  csrf: string;
  id: string;
};

const ownerEmail = "sales@luxeinfra.in";
const prefix = "/api/admin/recovery/";
const maximumAge = 15 * 60 * 1000;
const aad = Buffer.from("luxe-owner-password-recovery:v1");
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const jwt = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const genericError = "This password reset could not be completed. Please request a new link.";

class RecoveryError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(genericError);
    this.status = status;
  }
}

function object(value: unknown): value is ObjectValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
function exact(value: unknown, fields: string[]): value is ObjectValue {
  return (
    object(value) &&
    Object.keys(value).length === fields.length &&
    fields.every((field) => Object.hasOwn(value, field))
  );
}
function hasControl(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });
}
function email(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 254 &&
    !hasControl(value) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}
function accessToken(value: unknown): value is string {
  return typeof value === "string" && value.length >= 64 && value.length <= 2800 && jwt.test(value);
}
function loopback(value: string) {
  return ["127.0.0.1", "::1", "[::1]"].includes(value);
}
function trustedAddress(runtime: unknown): string | null {
  return object(runtime) && typeof runtime.ip === "string" && isIP(runtime.ip) ? runtime.ip : null;
}
function equal(first: string, second: string) {
  const a = Buffer.from(first);
  const b = Buffer.from(second);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function boundedJson(source: Request | Response, limit: number): Promise<unknown> {
  const client = source instanceof Request;
  const length = source.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > limit))
    throw new RecoveryError(client ? 413 : 503);
  if (!source.body) throw new RecoveryError(client ? 400 : 503);
  const reader = source.body.getReader();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    return await Promise.race([
      (async () => {
        for (;;) {
          const part = await reader.read();
          if (part.done) break;
          size += part.value.byteLength;
          if (size > limit) throw new RecoveryError(client ? 413 : 503);
          parts.push(part.value);
        }
        try {
          return JSON.parse(Buffer.concat(parts).toString("utf8")) as unknown;
        } catch {
          throw new RecoveryError(client ? 400 : 503);
        }
      })(),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new RecoveryError(client ? 408 : 503)), 5000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    void reader.cancel().catch(() => {});
  }
}

/** Owner recovery uses the actual Auth user token, never an administrative password override. */
export function createHostedRecovery(options: Options = {}) {
  const environment = options.env ?? process.env;
  const config = hostedLeadConfiguration(environment);
  const requestFetch = options.fetch ?? fetch;
  const now = options.now ?? Date.now;
  const digest = (value: string) => createHmac("sha256", config.secret).update(value).digest("hex");
  const cipherKey = createHmac("sha256", config.secret)
    .update("luxe-owner-password-recovery-cookie-key:v1")
    .digest();
  const cookieName = (local: boolean) =>
    local ? "luxe_recovery_local_session" : "__Secure-luxe_recovery_session";
  const cookie = (value: string, local: boolean, age = 0) =>
    `${cookieName(local)}=${value}; HttpOnly;${local ? "" : " Secure;"} SameSite=Strict; Path=/api/admin/recovery; Max-Age=${age}`;
  const json = (status: number, value: unknown, headers?: HeadersInit) => {
    const responseHeaders = new Headers(headers);
    for (const [key, content] of Object.entries({
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, private",
      Pragma: "no-cache",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer",
      "Cross-Origin-Resource-Policy": "same-origin",
    }))
      responseHeaders.set(key, content);
    return new Response(JSON.stringify(value), { status, headers: responseHeaders });
  };
  const seal = (session: RecoverySession) => {
    const nonce = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", cipherKey, nonce);
    cipher.setAAD(aad);
    const body = Buffer.concat([cipher.update(JSON.stringify(session), "utf8"), cipher.final()]);
    const value = `v1.${nonce.toString("base64url")}.${body.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}`;
    if (value.length > 3800) throw new RecoveryError(503);
    return value;
  };
  const open = (request: Request, local: boolean): RecoverySession | null => {
    try {
      const values = (request.headers.get("cookie") ?? "")
        .split(";")
        .map((part) => part.trim())
        .filter((part) => part.startsWith(cookieName(local) + "="));
      if (values.length !== 1) return null;
      const value = values[0].slice(cookieName(local).length + 1);
      if (
        value.length > 3800 ||
        !/^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{22}$/.test(value)
      )
        return null;
      const [, nonce, body, tag] = value.split(".");
      const decipher = createDecipheriv("aes-256-gcm", cipherKey, Buffer.from(nonce, "base64url"));
      decipher.setAAD(aad);
      decipher.setAuthTag(Buffer.from(tag, "base64url"));
      const session: unknown = JSON.parse(
        Buffer.concat([decipher.update(Buffer.from(body, "base64url")), decipher.final()]).toString(
          "utf8",
        ),
      );
      if (
        !exact(session, ["v", "issued", "expires", "access", "csrf", "id"]) ||
        session.v !== 1 ||
        !Number.isSafeInteger(session.issued) ||
        !Number.isSafeInteger(session.expires) ||
        Number(session.issued) > now() + 5000 ||
        Number(session.expires) <= now() ||
        Number(session.expires) > Number(session.issued) + maximumAge ||
        !accessToken(session.access) ||
        typeof session.csrf !== "string" ||
        !/^[a-f0-9]{64}$/.test(session.csrf) ||
        typeof session.id !== "string" ||
        !uuid.test(session.id)
      )
        return null;
      return session as RecoverySession;
    } catch {
      return null;
    }
  };
  const provider = async (path: string, init: RequestInit) => {
    const response = await requestFetch(config.url + path, {
      ...init,
      redirect: "error",
      signal: AbortSignal.timeout(5000),
      headers: {
        apikey: config.key,
        Accept: "application/json",
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
    if (!response.ok) {
      void response.body?.cancel().catch(() => {});
      throw new RecoveryError(
        [400, 401, 403, 422, 429].includes(response.status) ? response.status : 503,
      );
    }
    return boundedJson(response, 64 * 1024);
  };
  const claim = (value: string) =>
    provider("/rest/v1/rpc/luxe_inbox_login_attempt", {
      method: "POST",
      body: JSON.stringify({ p_ip_hash: digest(value) }),
    });
  const authenticate = async (token: string) => {
    const user = await provider("/auth/v1/user", {
      method: "GET",
      headers: { Authorization: "Bearer " + token },
    });
    if (
      !object(user) ||
      typeof user.id !== "string" ||
      !uuid.test(user.id) ||
      typeof user.email !== "string" ||
      user.email.toLowerCase() !== ownerEmail ||
      ![user.email_confirmed_at, user.confirmed_at].some(
        (value) => typeof value === "string" && Number.isFinite(Date.parse(value)),
      )
    )
      throw new RecoveryError(401);
    const actor = await provider("/rest/v1/rpc/luxe_inbox_actor", {
      method: "POST",
      body: JSON.stringify({ p_actor: user.id }),
    });
    if (
      !object(actor) ||
      actor.id !== user.id ||
      actor.role !== "owner" ||
      typeof actor.email !== "string" ||
      actor.email.toLowerCase() !== ownerEmail
    )
      throw new RecoveryError(403);
    // Claims only cap cookie lifetime after Auth has verified the actual token.
    let claims: unknown;
    try {
      claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    } catch {
      throw new RecoveryError(401);
    }
    if (
      !object(claims) ||
      claims.sub !== user.id ||
      !Number.isSafeInteger(claims.exp) ||
      Number(claims.exp) * 1000 <= now()
    )
      throw new RecoveryError(401);
    return { id: user.id, tokenExpires: Number(claims.exp) * 1000 };
  };

  return {
    async handle(request: Request, context: Context = {}): Promise<Response | null> {
      const url = new URL(request.url);
      if (!url.pathname.startsWith(prefix)) return null;
      const path = url.pathname.slice(prefix.length);
      const sessionPath = path === "session";
      const ip = trustedAddress(context.runtime);
      const local =
        environment.LUXE_INBOX_LOCAL === "true" &&
        context.environment === "local" &&
        url.protocol === "http:" &&
        loopback(url.hostname) &&
        Boolean(ip && loopback(ip));
      const enabled =
        environment.LUXE_INBOX_ENABLED === "true" &&
        config.valid &&
        Boolean(ip) &&
        (local || (context.environment === "production" && url.origin === config.site));
      if (!enabled)
        return json(
          sessionPath && request.method === "GET" ? 200 : 503,
          sessionPath && request.method === "GET"
            ? { enabled: false, authenticated: false }
            : {
                error: "Password recovery is not available here. Open the live LuxeInfra website.",
              },
        );
      if (!["request", "session", "establish", "complete"].includes(path))
        return json(404, { error: genericError });
      const method = sessionPath ? "GET" : "POST";
      if (request.method !== method) return json(405, { error: genericError }, { Allow: method });
      const origin = local ? url.origin : config.site;
      const fetchSite = request.headers.get("sec-fetch-site");
      if (
        (fetchSite && fetchSite !== "same-origin") ||
        (method === "POST" && request.headers.get("origin") !== origin)
      )
        return json(403, { error: "Open password recovery on the LuxeInfra website." });
      const clear = { "Set-Cookie": cookie("", local) };
      try {
        if (
          method === "POST" &&
          !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(
            request.headers.get("content-type") ?? "",
          )
        )
          throw new RecoveryError(415);
        if (path === "request") {
          const input = await boundedJson(request, 1024);
          if (!exact(input, ["email"]) || !email(input.email)) throw new RecoveryError(400);
          const address = input.email.toLowerCase();
          // Account existence, provider errors and throttling share the same acknowledgement.
          try {
            const allowedIp = await claim("owner-recovery-request-ip:v1:" + ip);
            const allowedEmail = await claim("owner-recovery-request-email:v1:" + address);
            if (allowedIp === true && allowedEmail === true && address === ownerEmail)
              await provider(
                "/auth/v1/recover?redirect_to=" +
                  encodeURIComponent(config.site + "/reset-password"),
                { method: "POST", body: JSON.stringify({ email: ownerEmail }) },
              );
          } catch {
            // Never reveal whether this address exists or whether a reset message was sent.
          }
          return json(200, { accepted: true });
        }
        if (path === "establish") {
          const input = await boundedJson(request, 4096);
          if (!exact(input, ["accessToken"]) || !accessToken(input.accessToken))
            throw new RecoveryError(400);
          if ((await claim("owner-recovery-establish-ip:v1:" + ip)) !== true)
            throw new RecoveryError(429);
          const user = await authenticate(input.accessToken);
          const issued = now();
          const session: RecoverySession = {
            v: 1,
            issued,
            expires: Math.min(issued + maximumAge, user.tokenExpires),
            access: input.accessToken,
            csrf: randomBytes(32).toString("hex"),
            id: user.id,
          };
          return json(
            200,
            { enabled: true, authenticated: true, csrfToken: session.csrf },
            {
              "Set-Cookie": cookie(
                seal(session),
                local,
                Math.floor((session.expires - now()) / 1000),
              ),
            },
          );
        }
        const session = open(request, local);
        if (!session)
          return json(
            sessionPath ? 200 : 401,
            sessionPath ? { enabled: true, authenticated: false } : { error: genericError },
            clear,
          );
        const user = await authenticate(session.access);
        if (user.id !== session.id) throw new RecoveryError(401);
        if (sessionPath)
          return json(200, { enabled: true, authenticated: true, csrfToken: session.csrf });
        if (!equal(request.headers.get("x-luxe-csrf") ?? "", session.csrf))
          throw new RecoveryError(403);
        const input = await boundedJson(request, 2048);
        if (
          !exact(input, ["password"]) ||
          typeof input.password !== "string" ||
          input.password.length < 12 ||
          input.password.length > 128 ||
          hasControl(input.password)
        )
          return json(400, {
            error: "Use a password with 12–128 characters and no control characters.",
          });
        const updated = await provider("/auth/v1/user", {
          method: "PUT",
          headers: { Authorization: "Bearer " + session.access },
          body: JSON.stringify({ password: input.password }),
        });
        if (
          !object(updated) ||
          updated.id !== user.id ||
          typeof updated.email !== "string" ||
          updated.email.toLowerCase() !== ownerEmail
        )
          throw new RecoveryError(503);
        const headers = new Headers();
        headers.append("Set-Cookie", cookie("", local));
        headers.append(
          "Set-Cookie",
          "__Secure-luxe_inbox_session=; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=0",
        );
        if (local)
          headers.append(
            "Set-Cookie",
            "luxe_inbox_local_session=; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=0",
          );
        return json(200, { complete: true }, headers);
      } catch (error) {
        const status = error instanceof RecoveryError ? error.status : 503;
        if (sessionPath && [401, 403].includes(status))
          return json(200, { enabled: true, authenticated: false }, clear);
        return json(
          status,
          {
            error: status === 429 ? "Please wait a few minutes before trying again." : genericError,
          },
          [401, 403].includes(status) ? clear : undefined,
        );
      }
    },
  };
}
