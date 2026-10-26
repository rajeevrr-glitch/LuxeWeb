import { randomUUID } from "node:crypto";
import { hostedLeadConfiguration } from "./hosted-config.server.ts";

type Environment = Record<string, string | undefined>;
type Payload = { from: string; to: string[]; subject: string; text: string; html: string };
type Job = {
  id: string;
  leadId: string;
  reference: string;
  createdAt: string;
  attempts: number;
  firstSendAt: string | null;
  idempotencyKey: string;
  lead: { name: string; phone: string; city: string; kind: string; message: string };
};
type Options = {
  env?: Environment;
  fetch?: typeof fetch;
  now?: () => number;
  environment?: string;
};
type Outcome = "accepted" | "retry" | "failed" | "needs_review";
type Result = { enabled: boolean; processed: number; state: string };

const recipients = ["sales@luxeinfra.in", "infoluxeinfra@gmail.com"];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const reference = /^LX-\d{8}-[A-F0-9]{12}$/;
const sender = /^LuxeInfra <[a-z0-9][a-z0-9._+-]{0,62}@alerts\.luxeinfra\.in>$/;
const types: Record<string, string> = {
  quote: "Quote request",
  "project-brief": "Project brief",
  partner: "Partnership enquiry",
};
const retryWindow = 23 * 60 * 60 * 1000;

export function emailAlertConfiguration(env: Environment = process.env) {
  const lead = hostedLeadConfiguration(env);
  const apiKey = env.RESEND_API_KEY ?? "";
  const from = env.LUXE_EMAIL_FROM ?? "";
  const rawLimit = env.LUXE_EMAIL_DAILY_LIMIT ?? "80";
  const dailyLimit = /^\d{1,3}$/.test(rawLimit) ? Number(rawLimit) : 0;
  return {
    valid:
      lead.valid &&
      /^re_[A-Za-z0-9_-]{16,256}$/.test(apiKey) &&
      sender.test(from) &&
      dailyLimit >= 1 &&
      dailyLimit <= 100,
    enabled: env.LUXE_EMAIL_ALERTS_ENABLED === "true",
    apiKey,
    from,
    dailyLimit,
    lead,
  };
}

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function clean(value: unknown, maximum: number, multiline = false): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= maximum &&
    ![...value].some((character) => {
      const code = character.charCodeAt(0);
      return code === 127 || (code < 32 && (!multiline || ![9, 10, 13].includes(code)));
    })
  );
}

function date(value: unknown, now: number): value is string {
  return (
    typeof value === "string" &&
    value.length <= 40 &&
    /^\d{4}-\d{2}-\d{2}T/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    Date.parse(value) <= now + 300_000
  );
}

function parseJob(value: unknown, now: number): Job | null {
  const input = object(value);
  const lead = object(input?.lead);
  if (
    !input ||
    !lead ||
    typeof input.id !== "string" ||
    !uuid.test(input.id) ||
    typeof input.leadId !== "string" ||
    !uuid.test(input.leadId) ||
    typeof input.reference !== "string" ||
    !reference.test(input.reference) ||
    !date(input.createdAt, now) ||
    !Number.isInteger(input.attempts) ||
    Number(input.attempts) < 1 ||
    Number(input.attempts) > 5 ||
    (input.firstSendAt !== null && !date(input.firstSendAt, now)) ||
    input.idempotencyKey !== "new-lead-email-v1/" + input.leadId ||
    !clean(lead.name, 80) ||
    !clean(lead.city, 100) ||
    typeof lead.phone !== "string" ||
    !/^\+91[6-9]\d{9}$/.test(lead.phone) ||
    typeof lead.kind !== "string" ||
    !Object.hasOwn(types, lead.kind) ||
    !clean(lead.message, 10000, true)
  )
    return null;
  return input as unknown as Job;
}

function escape(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]!;
  });
}

function makePayload(job: Job, from: string, site: string): Payload {
  const summary = job.lead.message.trim().replace(/\s+/g, " ").slice(0, 400);
  const admin = site + "/admin";
  const type = types[job.lead.kind];
  const subject = `New LuxeInfra ${type.toLowerCase()} · ${job.reference}`;
  const text = [
    "New LuxeInfra enquiry",
    `Reference: ${job.reference}`,
    `Type: ${type}`,
    `Name: ${job.lead.name}`,
    `Phone: ${job.lead.phone}`,
    `City: ${job.lead.city}`,
    `Received: ${job.createdAt}`,
    "",
    "Brief",
    summary,
    "",
    `Open private lead inbox: ${admin}`,
    "",
    "Internal alert. Follow up from the private inbox.",
  ].join("\n");
  const details = [
    ["Reference", job.reference],
    ["Type", type],
    ["Name", job.lead.name],
    ["Phone", job.lead.phone],
    ["City", job.lead.city],
    ["Received", job.createdAt],
  ]
    .map(
      ([label, value]) =>
        `<tr><th align="left" style="padding:8px 18px 8px 0;color:#697483;font-weight:400">${label}</th><td style="padding:8px 0;color:#1c3656">${escape(value)}</td></tr>`,
    )
    .join("");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>New LuxeInfra enquiry</title></head><body style="margin:0;background:#f5f2ea;font-family:Arial,Helvetica,sans-serif;color:#233346"><main style="max-width:600px;margin:32px auto;background:#ffffff;border:1px solid #e3dfd4"><header style="background:#173e72;padding:28px 32px;color:#ffffff"><p style="margin:0;font-size:22px;letter-spacing:2px">LUXEINFRA</p><p style="margin:12px 0 0;font-size:13px">A new conversation for your studio</p></header><section style="padding:32px"><h1 style="margin:0 0 22px;font-size:25px;color:#173e72">${escape(type)}</h1><table style="border-collapse:collapse;font-size:14px;width:100%">${details}</table><h2 style="font-size:16px;margin:26px 0 10px">Their brief</h2><p style="font-size:15px;line-height:1.7;overflow-wrap:anywhere">${escape(summary)}</p><p style="margin:28px 0"><a href="${escape(admin)}" style="display:inline-block;background:#173e72;color:#ffffff;text-decoration:none;padding:14px 20px;border-radius:5px">Open private lead inbox</a></p><p style="font-size:12px;line-height:1.6;color:#697483">Internal alert. Follow up from the private inbox.</p></section></main></body></html>`;
  return { from, to: [...recipients], subject, text, html };
}

function frozenPayload(value: unknown, job: Job, site: string): Payload | null {
  const input = object(value);
  if (
    !input ||
    Object.keys(input).sort().join(",") !== "from,html,subject,text,to" ||
    typeof input.from !== "string" ||
    !sender.test(input.from) ||
    !Array.isArray(input.to) ||
    input.to.length !== 2 ||
    input.to.some((recipient, index) => recipient !== recipients[index]) ||
    !clean(input.subject, 180) ||
    input.subject !== `New LuxeInfra ${types[job.lead.kind].toLowerCase()} · ${job.reference}` ||
    !clean(input.text, 3000, true) ||
    !clean(input.html, 14000, true) ||
    !input.text.startsWith("New LuxeInfra enquiry\nReference: " + job.reference + "\n") ||
    !input.text.endsWith(
      `Open private lead inbox: ${site}/admin\n\nInternal alert. Follow up from the private inbox.`,
    ) ||
    !input.html.startsWith('<!doctype html><html lang="en">') ||
    !input.html.endsWith("</section></main></body></html>") ||
    !input.html.includes(`href="${escape(site + "/admin")}"`) ||
    /<(?:script|iframe|img|link|style|object|embed|video|audio|form)\b|<[^>]*\b(?:on[a-z]+|src)\s*=/i.test(
      input.html,
    ) ||
    [...input.html.matchAll(/\bhref="([^"]*)"/g)].some(
      (match) => match[1] !== escape(site + "/admin"),
    )
  )
    return null;
  return input as Payload;
}

async function boundedJson(
  response: Response,
  limit: number,
  signal: AbortSignal,
): Promise<unknown> {
  const length = response.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > limit)) {
    await response.body?.cancel();
    throw new Error("response_limit");
  }
  if (!response.body) throw new Error("empty_response");
  const reader = response.body.getReader();
  const cancel = () => void reader.cancel().catch(() => {});
  signal.addEventListener("abort", cancel, { once: true });
  if (signal.aborted) cancel();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > limit) throw new Error("response_limit");
      chunks.push(part.value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } finally {
    signal.removeEventListener("abort", cancel);
    void reader.cancel().catch(() => {});
  }
}

export async function runLeadEmailWorker(options: Options = {}): Promise<Result> {
  const config = emailAlertConfiguration(options.env);
  if (
    !config.valid ||
    !config.enabled ||
    !config.lead.enabled ||
    options.environment !== "production"
  )
    return { enabled: false, processed: 0, state: "disabled" };
  const requestFetch = options.fetch ?? fetch;
  const now = options.now ?? Date.now;
  const deadline = new AbortController();
  const deadlineTimer = setTimeout(() => deadline.abort(), 25_000);
  const leaseToken = randomUUID();
  let job: Job | null = null;

  async function request(url: string, init: RequestInit, milliseconds: number, limit: number) {
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, deadline.signal]);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let response: Response | undefined;
    try {
      return await Promise.race([
        (async () => {
          response = await requestFetch(url, { ...init, redirect: "error", signal });
          try {
            const json = await boundedJson(response, limit, signal);
            return { response, json, validBody: true };
          } catch {
            return { response, json: null, validBody: false };
          }
        })(),
        new Promise<never>((_resolve, reject) => {
          const abort = () => reject(new Error("request_timeout"));
          signal.addEventListener("abort", abort, { once: true });
          if (signal.aborted) abort();
          timer = setTimeout(() => controller.abort(), milliseconds);
        }),
      ]);
    } finally {
      clearTimeout(timer);
      controller.abort();
      if (response) void response.body?.cancel().catch(() => {});
    }
  }

  async function rpc(name: string, body: Record<string, unknown>) {
    const result = await request(
      config.lead.url + "/rest/v1/rpc/" + name,
      {
        method: "POST",
        headers: {
          apikey: config.lead.key,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
      5000,
      256 * 1024,
    );
    if (!result.response.ok || !result.validBody) throw new Error("database_unavailable");
    return result.json;
  }

  async function settle(
    outcome: Outcome,
    errorCode: string | null,
    providerId: string | null = null,
    retryAfter = 60,
  ) {
    try {
      const settled = object(
        await rpc("luxe_email_settle", {
          p_id: job!.id,
          p_lease_token: leaseToken,
          p_outcome: outcome,
          p_provider_id: providerId,
          p_error_code: errorCode,
          p_retry_after: retryAfter,
        }),
      );
      if (
        !settled ||
        !["accepted", "retry", "failed", "needs_review"].includes(String(settled.state))
      )
        throw new Error("invalid_settlement");
      return { enabled: true, processed: 1, state: String(settled.state) };
    } catch {
      return { enabled: true, processed: 1, state: "settle_pending" };
    }
  }

  try {
    const claimed = await rpc("luxe_email_claim", { p_lease_token: leaseToken });
    if (claimed === null) return { enabled: true, processed: 0, state: "idle" };
    job = parseJob(claimed, now());
    if (!job) return { enabled: true, processed: 0, state: "invalid_job" };
    if (job.firstSendAt && now() - Date.parse(job.firstSendAt) >= retryWindow)
      return await settle("needs_review", "idempotency_window_expired");
    const prepared = object(
      await rpc("luxe_email_prepare", {
        p_id: job.id,
        p_lease_token: leaseToken,
        p_payload: makePayload(job, config.from, config.lead.site!),
        p_daily_limit: config.dailyLimit,
      }),
    );
    if (prepared?.blocked === true || prepared?.deferred === true)
      return { enabled: true, processed: 1, state: prepared.blocked ? "blocked" : "deferred" };
    const payload = frozenPayload(prepared?.payload, job, config.lead.site!);
    if (
      !prepared ||
      prepared.id !== job.id ||
      prepared.idempotencyKey !== job.idempotencyKey ||
      !date(prepared.firstSendAt, now()) ||
      !payload
    )
      return await settle("needs_review", "invalid_frozen_payload");
    if (now() - Date.parse(prepared.firstSendAt) >= retryWindow)
      return await settle("needs_review", "idempotency_window_expired");

    let result;
    try {
      result = await request(
        "https://api.resend.com/emails",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + config.apiKey,
            "Content-Type": "application/json",
            Accept: "application/json",
            "Idempotency-Key": String(prepared.idempotencyKey),
          },
          body: JSON.stringify(payload),
        },
        8000,
        8192,
      );
    } catch {
      return await settle("retry", "provider_outcome_uncertain");
    }
    const body = object(result.json);
    if (result.response.ok) {
      if (result.validBody && typeof body?.id === "string" && uuid.test(body.id))
        return await settle("accepted", null, body.id);
      return await settle("retry", "provider_outcome_uncertain");
    }
    if (result.response.status === 429) {
      const raw = result.response.headers.get("retry-after") ?? "";
      const seconds = /^\d{1,8}$/.test(raw)
        ? Number(raw)
        : Math.ceil((Date.parse(raw) - now()) / 1000);
      const retryAfter = Number.isFinite(seconds) ? Math.min(86400, Math.max(60, seconds)) : 60;
      return await settle("retry", "provider_rate_limited", null, retryAfter);
    }
    if (result.response.status >= 500 || result.response.status === 408)
      return await settle("retry", "provider_unavailable");
    if (result.response.status === 409 && body?.name === "concurrent_idempotent_requests")
      return await settle("retry", "provider_request_in_progress");
    if ([401, 403].includes(result.response.status))
      return await settle("failed", "provider_configuration");
    if ([400, 409, 422].includes(result.response.status))
      return await settle("failed", "provider_validation");
    return await settle("failed", "provider_rejected");
  } catch {
    return { enabled: true, processed: job ? 1 : 0, state: "database_unavailable" };
  } finally {
    clearTimeout(deadlineTimer);
    deadline.abort();
  }
}
