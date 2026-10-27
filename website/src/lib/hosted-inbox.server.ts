import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { isIP } from "node:net";
import { hostedLeadConfiguration } from "./hosted-config.server.ts";
import { emailAlertConfiguration } from "./lead-email-worker.server.ts";
import { createHostedRecovery } from "./hosted-recovery.server.ts";
import { trafficReport } from "./traffic-report.server.ts";
import { trafficDailyLimit } from "./hosted-traffic.server.ts";

type Environment = Record<string, string | undefined>;
type Options = { env?: Environment; fetch?: typeof fetch; now?: () => number };
type Context = { environment?: string; runtime?: unknown };
type Actor = { id: string; email: string; role: "owner" | "staff"; displayName: string };
type Session = { v: 1; issued: number; expires: number; access: string; csrf: string };
type RecordValue = Record<string, unknown>;

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const statuses = ["new", "contacted", "qualified", "closed"];
const kinds = ["quote", "project-brief", "partner"];
const workViews = ["", "today", "overdue", "unscheduled", "unassigned", "mine"];
const maximumAge = 30 * 60 * 1000;
const errorMessage = "The private inbox could not complete this request. Please try again.";
const cookieAad = Buffer.from("luxe-inbox-session:v1");

class InboxError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(errorMessage);
    this.status = status;
  }
}

function record(value: unknown): value is RecordValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
function string(value: unknown, maximum: number): value is string {
  return (
    typeof value === "string" &&
    value.length <= maximum &&
    ![...value].some((character) => {
      const code = character.charCodeAt(0);
      return code === 127 || (code < 32 && ![9, 10, 13].includes(code));
    })
  );
}
function email(value: unknown): value is string {
  return string(value, 320) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
function exact(value: unknown, fields: string[]): value is RecordValue {
  return (
    record(value) &&
    Object.keys(value).length === fields.length &&
    fields.every((field) => Object.hasOwn(value, field))
  );
}
function date(value: unknown): value is string {
  return typeof value === "string" && value.length <= 40 && Number.isFinite(Date.parse(value));
}
function sameSecret(first: string, second: string): boolean {
  const a = Buffer.from(first);
  const b = Buffer.from(second);
  return a.length === b.length && timingSafeEqual(a, b);
}
function address(runtime: unknown): string | null {
  return record(runtime) && typeof runtime.ip === "string" && isIP(runtime.ip) ? runtime.ip : null;
}
function loopback(value: string): boolean {
  return ["127.0.0.1", "::1", "[::1]"].includes(value);
}

async function boundedJson(
  source: Request | Response,
  limit: number,
  timeout = 5000,
): Promise<unknown> {
  const declared = source.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > limit))
    throw new InboxError(source instanceof Request ? 413 : 503);
  if (!source.body) throw new InboxError(source instanceof Request ? 400 : 503);
  const reader = source.body.getReader();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let length = 0;
  const parts: Uint8Array[] = [];
  try {
    return await Promise.race([
      (async () => {
        for (;;) {
          const part = await reader.read();
          if (part.done) break;
          length += part.value.byteLength;
          if (length > limit) throw new InboxError(source instanceof Request ? 413 : 503);
          parts.push(part.value);
        }
        try {
          return JSON.parse(Buffer.concat(parts).toString("utf8")) as unknown;
        } catch {
          throw new InboxError(source instanceof Request ? 400 : 503);
        }
      })(),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new InboxError(source instanceof Request ? 408 : 503)),
          timeout,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
    void reader.cancel().catch(() => {});
  }
}

function actor(value: unknown): Actor {
  if (
    !record(value) ||
    !string(value.id, 36) ||
    !uuid.test(value.id) ||
    !email(value.email) ||
    !["owner", "staff"].includes(String(value.role)) ||
    !string(value.displayName, 120)
  )
    throw new InboxError(403);
  return {
    id: value.id,
    email: value.email,
    role: value.role as Actor["role"],
    displayName: value.displayName,
  };
}
function member(value: unknown) {
  const safe = actor(value);
  if (!record(value) || typeof value.active !== "boolean") throw new InboxError(503);
  return { ...safe, active: value.active };
}
function assignee(value: unknown) {
  if (value === null) return null;
  if (
    !record(value) ||
    !string(value.id, 36) ||
    !uuid.test(value.id) ||
    !string(value.displayName, 80) ||
    !value.displayName.trim() ||
    typeof value.active !== "boolean"
  )
    throw new InboxError(503);
  return { id: value.id, displayName: value.displayName, active: value.active };
}

function workflow(value: unknown, user: Actor) {
  if (
    !record(value) ||
    value.enabled !== true ||
    value.canAssign !== (user.role === "owner") ||
    !Array.isArray(value.assignees) ||
    value.assignees.length > 100 ||
    !record(value.counts) ||
    !date(value.asOf) ||
    value.timeZone !== "Asia/Kolkata"
  )
    throw new InboxError(503);
  const counts: Record<string, number> = {};
  for (const key of ["today", "overdue", "unscheduled", "unassigned", "mine"]) {
    if (!count(value.counts[key]) || value.counts[key] > 10000) throw new InboxError(503);
    counts[key] = value.counts[key] as number;
  }
  const ids = new Set<string>();
  const assignees = value.assignees.map((entry: unknown) => {
    if (
      !record(entry) ||
      !string(entry.id, 36) ||
      !uuid.test(entry.id) ||
      !string(entry.displayName, 80) ||
      !entry.displayName.trim() ||
      !["owner", "staff"].includes(String(entry.role)) ||
      ids.has(entry.id.toLowerCase())
    )
      throw new InboxError(503);
    ids.add(entry.id.toLowerCase());
    return { id: entry.id, displayName: entry.displayName, role: entry.role };
  });
  return {
    enabled: true,
    canAssign: user.role === "owner",
    assignees,
    counts,
    asOf: value.asOf,
    timeZone: "Asia/Kolkata",
  };
}

function lead(value: unknown, workflowEnabled = false) {
  if (
    !record(value) ||
    !string(value.id, 36) ||
    !uuid.test(value.id) ||
    !string(value.reference, 64) ||
    !date(value.createdAt) ||
    !date(value.updatedAt) ||
    !kinds.includes(String(value.kind)) ||
    !statuses.includes(String(value.status)) ||
    !string(value.name, 80) ||
    !string(value.phone, 32) ||
    !string(value.city, 100) ||
    !string(value.message, 10000) ||
    !string(value.notes, 4000) ||
    !(value.followUpAt === null || date(value.followUpAt))
  )
    throw new InboxError(503);
  return {
    id: value.id,
    reference: value.reference,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    kind: value.kind,
    name: value.name,
    phone: value.phone,
    city: value.city,
    message: value.message,
    status: value.status,
    notes: value.notes,
    followUpAt: value.followUpAt,
    ...(workflowEnabled ? { assignedTo: assignee(value.assignedTo) } : {}),
  };
}
function count(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

export function createHostedInbox(options: Options = {}) {
  const recovery = createHostedRecovery(options);
  const environment = options.env ?? process.env;
  const config = hostedLeadConfiguration(environment);
  const workflowEnabled = environment.LUXE_WORKFLOW_ENABLED === "true";
  const requestFetch = options.fetch ?? fetch;
  const now = options.now ?? Date.now;
  const digest = (value: string) => createHmac("sha256", config.secret).update(value).digest("hex");
  const cipherKey = createHmac("sha256", config.secret).update("luxe-inbox-cookie-key:v1").digest();
  const cookieName = (local: boolean) =>
    local ? "luxe_inbox_local_session" : "__Secure-luxe_inbox_session";
  const cookie = (value: string, local: boolean, age = maximumAge / 1000) =>
    `${cookieName(local)}=${value}; HttpOnly;${local ? "" : " Secure;"} SameSite=Strict; Path=/api/admin; Max-Age=${age}`;
  const json = (status: number, value: unknown, extra?: HeadersInit) =>
    new Response(JSON.stringify(value), {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store, private",
        Pragma: "no-cache",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
        "Cross-Origin-Resource-Policy": "same-origin",
        ...extra,
      },
    });
  const seal = (session: Session) => {
    const nonce = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", cipherKey, nonce);
    cipher.setAAD(cookieAad);
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(session), "utf8"),
      cipher.final(),
    ]);
    const result = `v1.${nonce.toString("base64url")}.${encrypted.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}`;
    if (result.length > 3800) throw new InboxError(503);
    return result;
  };
  const open = (request: Request, local: boolean): Session | null => {
    try {
      const values = (request.headers.get("cookie") ?? "")
        .split(";")
        .map((value) => value.trim())
        .filter((value) => value.startsWith(cookieName(local) + "="));
      if (values.length !== 1) return null;
      const raw = values[0].slice(cookieName(local).length + 1);
      if (
        raw.length > 3800 ||
        !/^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{22}$/.test(raw)
      )
        return null;
      const [, nonce, ciphertext, tag] = raw.split(".");
      const decipher = createDecipheriv("aes-256-gcm", cipherKey, Buffer.from(nonce, "base64url"));
      decipher.setAAD(cookieAad);
      decipher.setAuthTag(Buffer.from(tag, "base64url"));
      const result: unknown = JSON.parse(
        Buffer.concat([
          decipher.update(Buffer.from(ciphertext, "base64url")),
          decipher.final(),
        ]).toString("utf8"),
      );
      if (
        !exact(result, ["v", "issued", "expires", "access", "csrf"]) ||
        result.v !== 1 ||
        typeof result.issued !== "number" ||
        typeof result.expires !== "number" ||
        result.issued > now() + 5000 ||
        result.expires <= now() ||
        result.expires > result.issued + maximumAge ||
        !string(result.access, 2800) ||
        !result.access ||
        !string(result.csrf, 64) ||
        !/^[a-f0-9]{64}$/.test(result.csrf)
      )
        return null;
      return result as Session;
    } catch {
      return null;
    }
  };
  const provider = async (path: string, init: RequestInit, limit = 2 * 1024 * 1024) => {
    const response = await requestFetch(config.url + path, {
      ...init,
      redirect: "error",
      signal: AbortSignal.timeout(12_000),
      headers: {
        apikey: config.key,
        Accept: "application/json",
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
    if (!response.ok) {
      void response.body?.cancel().catch(() => {});
      throw new InboxError(
        [400, 401, 403, 404, 409, 429].includes(response.status) ? response.status : 503,
      );
    }
    return boundedJson(response, limit, 12_000);
  };
  const rpc = (name: string, body: unknown) =>
    provider("/rest/v1/rpc/" + name, { method: "POST", body: JSON.stringify(body) });
  const authenticate = async (session: Session) => {
    const user = await provider(
      "/auth/v1/user",
      { method: "GET", headers: { Authorization: "Bearer " + session.access } },
      64 * 1024,
    );
    if (
      !record(user) ||
      !string(user.id, 36) ||
      !uuid.test(user.id) ||
      !email(user.email) ||
      !(date(user.email_confirmed_at) || date(user.confirmed_at))
    )
      throw new InboxError(401);
    const staff = actor(await rpc("luxe_inbox_actor", { p_actor: user.id }));
    if (
      staff.id.toLowerCase() !== user.id.toLowerCase() ||
      staff.email.toLowerCase() !== user.email.toLowerCase()
    )
      throw new InboxError(403);
    return staff;
  };

  return {
    async handle(request: Request, context: Context = {}): Promise<Response | null> {
      const url = new URL(request.url);
      if (url.pathname !== "/api/admin" && !url.pathname.startsWith("/api/admin/")) return null;
      if (url.pathname.startsWith("/api/admin/recovery/")) return recovery.handle(request, context);
      const ip = address(context.runtime);
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
      const sessionPath = url.pathname === "/api/admin/session";
      if (!enabled)
        return json(
          sessionPath && request.method === "GET" ? 200 : 503,
          sessionPath && request.method === "GET"
            ? { enabled: false, authenticated: false }
            : { error: errorMessage },
        );
      const site = local ? url.origin : config.site;
      const mutation = !["GET", "HEAD"].includes(request.method);
      const fetchSite = request.headers.get("sec-fetch-site");
      if (
        (fetchSite && fetchSite !== "same-origin") ||
        (mutation && request.headers.get("origin") !== site)
      )
        return json(403, { error: "Open the inbox on the LuxeInfra website." });
      const clear = { "Set-Cookie": cookie("", local, 0) };
      const loginPath = url.pathname === "/api/admin/login";
      try {
        if (loginPath) {
          if (request.method !== "POST")
            return json(405, { error: "Use POST to sign in." }, { Allow: "POST" });
          if (
            !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(
              request.headers.get("content-type") ?? "",
            )
          )
            throw new InboxError(415);
          const input = await boundedJson(request, 4096);
          if (
            !exact(input, ["email", "password"]) ||
            !email(input.email) ||
            !string(input.password, 256) ||
            !input.password
          )
            throw new InboxError(400);
          const allowed = await rpc("luxe_inbox_login_attempt", {
            p_ip_hash: digest("inbox-login-ip:v1:" + ip),
          });
          if (allowed !== true) throw new InboxError(429);
          let token: unknown;
          try {
            token = await provider(
              "/auth/v1/token?grant_type=password",
              {
                method: "POST",
                body: JSON.stringify({
                  email: input.email.trim().toLowerCase(),
                  password: input.password,
                }),
              },
              64 * 1024,
            );
          } catch (error) {
            if (error instanceof InboxError && [400, 401, 403].includes(error.status))
              throw new InboxError(401);
            throw error;
          }
          if (
            !record(token) ||
            !string(token.access_token, 2800) ||
            !token.access_token ||
            typeof token.expires_in !== "number" ||
            !Number.isFinite(token.expires_in) ||
            token.expires_in < 1
          )
            throw new InboxError(503);
          const session: Session = {
            v: 1,
            issued: now(),
            expires: now() + Math.min(maximumAge, Math.floor(token.expires_in * 1000)),
            access: token.access_token,
            csrf: randomBytes(32).toString("hex"),
          };
          let user: Actor;
          try {
            user = await authenticate(session);
          } catch (error) {
            if (error instanceof InboxError && [401, 403].includes(error.status))
              throw new InboxError(401);
            throw error;
          }
          return json(
            200,
            { enabled: true, authenticated: true, user, csrfToken: session.csrf },
            {
              "Set-Cookie": cookie(
                seal(session),
                local,
                Math.floor((session.expires - now()) / 1000),
              ),
            },
          );
        }
        if (sessionPath && request.method !== "GET")
          return json(405, { error: "Use GET to check the session." }, { Allow: "GET" });
        const session = open(request, local);
        if (!session)
          return json(
            sessionPath && !(request.headers.get("cookie") ?? "").includes(cookieName(local) + "=")
              ? 200
              : 401,
            sessionPath
              ? { enabled: true, authenticated: false }
              : { error: "Please sign in again." },
            clear,
          );
        let user: Actor;
        try {
          user = await authenticate(session);
        } catch (error) {
          if (error instanceof InboxError && [401, 403].includes(error.status))
            return json(
              sessionPath ? 200 : 401,
              sessionPath
                ? { enabled: true, authenticated: false }
                : { error: "Please sign in again." },
              clear,
            );
          throw error;
        }
        if (mutation && !sameSecret(request.headers.get("x-luxe-csrf") ?? "", session.csrf))
          throw new InboxError(403);
        if (sessionPath)
          return json(200, { enabled: true, authenticated: true, user, csrfToken: session.csrf });
        if (url.pathname === "/api/admin/logout") {
          if (request.method !== "POST")
            return json(405, { error: "Use POST to sign out." }, { Allow: "POST" });
          return json(200, { authenticated: false }, clear);
        }
        if (url.pathname === "/api/admin/traffic") {
          if (user.role !== "owner") throw new InboxError(403);
          if (request.method !== "GET")
            return json(405, { error: "Use GET to view traffic." }, { Allow: "GET" });
          if (
            [...url.searchParams.keys()].some((key) => key !== "days") ||
            url.searchParams.getAll("days").length > 1
          )
            throw new InboxError(400);
          const days = url.searchParams.get("days") ?? "7";
          if (!["7", "30", "90"].includes(days)) throw new InboxError(400);
          if (environment.LUXE_TRAFFIC_ENABLED !== "true") return json(200, { enabled: false });
          if (trafficDailyLimit(environment) === null) throw new InboxError(503);
          const result = await rpc("luxe_inbox_traffic", {
            p_actor: user.id,
            p_days: Number(days),
          });
          return json(200, trafficReport(result, Number(days) as 7 | 30 | 90));
        }
        if (url.pathname === "/api/admin/leads") {
          if (request.method !== "GET")
            return json(405, { error: "Use GET to view leads." }, { Allow: "GET" });
          if (
            [...url.searchParams.keys()].some(
              (key) => !["search", "status", "kind", "page", "work"].includes(key),
            ) ||
            [...url.searchParams.keys()].some((key) => url.searchParams.getAll(key).length !== 1)
          )
            throw new InboxError(400);
          const search = url.searchParams.get("search") ?? "";
          const status = url.searchParams.get("status") ?? "";
          const kind = url.searchParams.get("kind") ?? "";
          const page = url.searchParams.get("page") ?? "1";
          const work = url.searchParams.get("work") ?? "";
          if (
            !string(search, 100) ||
            (status && !statuses.includes(status)) ||
            (kind && !kinds.includes(kind)) ||
            !workViews.includes(work) ||
            (!workflowEnabled && work !== "") ||
            !/^[1-9]\d{0,2}$/.test(page) ||
            Number(page) > 400
          )
            throw new InboxError(400);
          const result = await rpc(workflowEnabled ? "luxe_inbox_work_list" : "luxe_inbox_list", {
            p_actor: user.id,
            p_search: search,
            p_status: status,
            p_kind: kind,
            p_page: Number(page),
            ...(workflowEnabled ? { p_work: work } : {}),
          });
          if (
            !record(result) ||
            !Array.isArray(result.items) ||
            result.items.length > 25 ||
            !count(result.total) ||
            result.page !== Number(page) ||
            result.pageSize !== 25 ||
            !record(result.summary)
          )
            throw new InboxError(503);
          const summary: Record<string, number> = {};
          for (const key of ["total", "new", "contacted", "qualified", "closed", "followUpsDue"]) {
            if (!count(result.summary[key])) throw new InboxError(503);
            summary[key] = result.summary[key] as number;
          }
          return json(200, {
            items: result.items.map((item: unknown) => lead(item, workflowEnabled)),
            total: result.total,
            page: result.page,
            pageSize: 25,
            summary,
            ...(workflowEnabled ? { workflow: workflow(result.workflow, user) } : {}),
          });
        }
        const leadMatch = url.pathname.match(/^\/api\/admin\/leads\/([^/]+)$/);
        if (leadMatch) {
          if (!uuid.test(leadMatch[1])) throw new InboxError(400);
          if (request.method === "GET")
            return json(
              200,
              lead(
                await rpc("luxe_inbox_lead", { p_actor: user.id, p_id: leadMatch[1] }),
                workflowEnabled,
              ),
            );
          if (request.method !== "PATCH")
            return json(405, { error: "Use GET or PATCH for a lead." }, { Allow: "GET, PATCH" });
          if (
            !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(
              request.headers.get("content-type") ?? "",
            )
          )
            throw new InboxError(415);
          const input = await boundedJson(request, 12 * 1024);
          const hasAssignment = record(input) && Object.hasOwn(input, "assignedTo");
          if (workflowEnabled && hasAssignment && user.role !== "owner") throw new InboxError(403);
          if (
            !exact(input, [
              "status",
              "notes",
              "followUpAt",
              "expectedUpdatedAt",
              ...(workflowEnabled && hasAssignment ? ["assignedTo"] : []),
            ]) ||
            !statuses.includes(String(input.status)) ||
            !string(input.notes, 4000) ||
            !(input.followUpAt === null || date(input.followUpAt)) ||
            !date(input.expectedUpdatedAt) ||
            (hasAssignment &&
              !(
                input.assignedTo === null ||
                (string(input.assignedTo, 36) && uuid.test(input.assignedTo))
              ))
          )
            throw new InboxError(400);
          return json(
            200,
            lead(
              await rpc(workflowEnabled ? "luxe_inbox_work_update" : "luxe_inbox_update", {
                p_actor: user.id,
                p_id: leadMatch[1],
                p_status: input.status,
                p_notes: input.notes,
                p_follow_up_at: input.followUpAt,
                p_expected_updated_at: input.expectedUpdatedAt,
                ...(workflowEnabled
                  ? {
                      p_change_assignee: hasAssignment,
                      p_assigned_to: hasAssignment ? input.assignedTo : null,
                    }
                  : {}),
              }),
              workflowEnabled,
            ),
          );
        }
        if (url.pathname === "/api/admin/notifications") {
          if (user.role !== "owner") throw new InboxError(403);
          if (request.method !== "GET")
            return json(405, { error: "Use GET to view email alerts." }, { Allow: "GET" });
          const result = await rpc("luxe_inbox_notifications", { p_actor: user.id });
          if (
            !record(result) ||
            !record(result.summary) ||
            !Array.isArray(result.items) ||
            result.items.length > 50
          )
            throw new InboxError(503);
          const summary: Record<string, number> = {};
          for (const key of [
            "pending",
            "retrying",
            "accepted",
            "failed",
            "needsReview",
            "expired",
          ]) {
            if (!count(result.summary[key])) throw new InboxError(503);
            summary[key] = result.summary[key] as number;
          }
          const items = result.items.map((entry: unknown) => {
            if (
              !record(entry) ||
              !string(entry.id, 36) ||
              !uuid.test(entry.id) ||
              !string(entry.reference, 64) ||
              !/^LX-\d{8}-[A-F0-9]{12}$/.test(entry.reference) ||
              ![
                "pending",
                "leased",
                "retry",
                "accepted",
                "failed",
                "needs_review",
                "expired",
              ].includes(String(entry.state)) ||
              !count(entry.attempts) ||
              entry.attempts > 5 ||
              !date(entry.createdAt) ||
              !date(entry.updatedAt) ||
              !(entry.nextAttemptAt === null || date(entry.nextAttemptAt)) ||
              !(
                entry.lastErrorCode === null ||
                (string(entry.lastErrorCode, 64) && /^[a-z_]+$/.test(entry.lastErrorCode))
              ) ||
              !(
                entry.providerId === null ||
                (string(entry.providerId, 36) && uuid.test(entry.providerId))
              )
            )
              throw new InboxError(503);
            return {
              id: entry.id,
              reference: entry.reference,
              state: entry.state,
              attempts: entry.attempts,
              createdAt: entry.createdAt,
              updatedAt: entry.updatedAt,
              nextAttemptAt: entry.nextAttemptAt,
              lastErrorCode: entry.lastErrorCode,
              providerId: entry.providerId,
            };
          });
          const alerts = emailAlertConfiguration(environment);
          return json(200, {
            configuration: {
              enabled: alerts.enabled && config.enabled,
              ready: alerts.valid && config.enabled,
              provider: "resend",
              sender: /^LuxeInfra <[a-z0-9][a-z0-9._+-]{0,62}@alerts\.luxeinfra\.in>$/.test(
                alerts.from,
              )
                ? alerts.from
                : null,
              recipients: ["sales@luxeinfra.in", "infoluxeinfra@gmail.com"],
            },
            summary,
            items,
          });
        }
        if (url.pathname === "/api/admin/team") {
          if (user.role !== "owner") throw new InboxError(403);
          if (request.method === "GET") {
            const result = await rpc("luxe_inbox_team", { p_actor: user.id });
            if (
              !record(result) ||
              !Array.isArray(result.members) ||
              result.members.length > 100 ||
              !Array.isArray(result.audit) ||
              result.audit.length > 100
            )
              throw new InboxError(503);
            const audit = result.audit.map((entry: unknown) => {
              if (
                !record(entry) ||
                !string(entry.id, 64) ||
                !date(entry.createdAt) ||
                !string(entry.actorName, 120) ||
                !string(entry.action, 80) ||
                !(entry.leadReference === null || string(entry.leadReference, 64)) ||
                !(entry.targetEmail === null || email(entry.targetEmail))
              )
                throw new InboxError(503);
              return {
                id: entry.id,
                createdAt: entry.createdAt,
                actorName: entry.actorName,
                action: entry.action,
                leadReference: entry.leadReference,
                targetEmail: entry.targetEmail,
              };
            });
            return json(200, { members: result.members.map(member), audit });
          }
          if (request.method !== "POST")
            return json(405, { error: "Use GET or POST for team access." }, { Allow: "GET, POST" });
          if (
            !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(
              request.headers.get("content-type") ?? "",
            )
          )
            throw new InboxError(415);
          const input = await boundedJson(request, 4096);
          if (
            !exact(input, ["email", "active"]) ||
            !email(input.email) ||
            typeof input.active !== "boolean"
          )
            throw new InboxError(400);
          return json(
            200,
            member(
              await rpc("luxe_inbox_access", {
                p_actor: user.id,
                p_email: input.email.trim().toLowerCase(),
                p_active: input.active,
              }),
            ),
          );
        }
        return json(404, { error: "This inbox endpoint does not exist." });
      } catch (error) {
        const status = error instanceof InboxError ? error.status : 503;
        return json(
          status,
          {
            error:
              loginPath && status === 401
                ? "Sign-in failed. Check your details and approved access."
                : errorMessage,
          },
          {
            ...(status === 429 ? { "Retry-After": "900" } : {}),
            ...(loginPath || status === 401 ? clear : {}),
          },
        );
      }
    },
  };
}
