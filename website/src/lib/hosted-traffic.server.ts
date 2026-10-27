import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { hostedLeadConfiguration } from "./hosted-config.server.ts";
import { trafficPages, trafficSources } from "./traffic.ts";

type Options = {
  env?: Record<string, string | undefined>;
  fetch?: typeof fetch;
  now?: () => number;
};
type Context = { environment?: string; runtime?: unknown };
type ObjectValue = Record<string, unknown>;

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const bodyLimit = 1024;
const errorMessage = "Traffic recording is unavailable.";
const istOffset = 330 * 60 * 1000;
const dayLength = 24 * 60 * 60 * 1000;

class TrafficError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(errorMessage);
    this.status = status;
  }
}

function object(value: unknown): value is ObjectValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function trustedAddress(runtime: unknown): string | null {
  return object(runtime) && typeof runtime.ip === "string" && isIP(runtime.ip) ? runtime.ip : null;
}

function boundedAgent(request: Request) {
  return [...(request.headers.get("user-agent") ?? "").slice(0, 256)]
    .map((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127 ? " " : character;
    })
    .join("");
}

function deviceBucket(agent: string): "desktop" | "mobile" | "tablet" | "other" {
  if (/ipad|tablet|kindle|silk|playbook|android(?!.*mobile)/i.test(agent)) return "tablet";
  if (/mobi|iphone|ipod|android|windows phone/i.test(agent)) return "mobile";
  return /windows|macintosh|linux|x11|cros/i.test(agent) ? "desktop" : "other";
}

async function boundedJson(source: Request | Response, maximum: number): Promise<unknown> {
  const client = source instanceof Request;
  const length = source.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > maximum))
    throw new TrafficError(client ? 413 : 503);
  if (!source.body) throw new TrafficError(client ? 400 : 503);
  const reader = source.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      (async () => {
        for (;;) {
          const chunk = await reader.read();
          if (chunk.done) break;
          size += chunk.value.byteLength;
          if (size > maximum) throw new TrafficError(client ? 413 : 503);
          chunks.push(chunk.value);
        }
        try {
          return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
        } catch {
          throw new TrafficError(client ? 400 : 503);
        }
      })(),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new TrafficError(client ? 408 : 503)), 5000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    void reader.cancel().catch(() => {});
  }
}

/** Bounded public page counts. No identity, URL parameters, cookies or raw request metadata is stored. */
export function trafficDailyLimit(
  environment: Record<string, string | undefined> = process.env,
): number | null {
  const setting = environment.LUXE_TRAFFIC_DAILY_LIMIT ?? "10000";
  return /^[1-9]\d{0,4}$/.test(setting) ? Math.min(Number(setting), 10000) : null;
}

export function createHostedTraffic(options: Options = {}) {
  const environment = options.env ?? process.env;
  const config = hostedLeadConfiguration(environment);
  const requestFetch = options.fetch ?? fetch;
  const now = options.now ?? Date.now;
  const dailyLimit = trafficDailyLimit(environment);
  const json = (status: number, value?: unknown, headers?: HeadersInit) =>
    new Response(status === 204 ? null : JSON.stringify(value), {
      status,
      headers: {
        "Cache-Control": "no-store, private",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
        "Referrer-Policy": "no-referrer",
        "Cross-Origin-Resource-Policy": "same-origin",
        ...(status === 204 ? {} : { "Content-Type": "application/json; charset=utf-8" }),
        ...headers,
      },
    });
  return {
    async handle(request: Request, context: Context = {}): Promise<Response | null> {
      const url = new URL(request.url);
      const statusPath = url.pathname === "/api/traffic/status";
      if (!statusPath && url.pathname !== "/api/traffic") return null;
      const method = statusPath ? "GET" : "POST";
      if (request.method !== method) return json(405, { error: errorMessage }, { Allow: method });
      const address = trustedAddress(context.runtime);
      const preference =
        request.headers.get("dnt")?.trim() === "1" ||
        request.headers.get("sec-gpc")?.trim() === "1";
      const fetchSite = request.headers.get("sec-fetch-site");
      const enabled = Boolean(
        environment.LUXE_TRAFFIC_ENABLED === "true" &&
        config.valid &&
        dailyLimit &&
        context.environment === "production" &&
        url.origin === config.site &&
        address &&
        !preference &&
        (!fetchSite || fetchSite === "same-origin"),
      );
      if (statusPath) return json(200, { enabled });
      if (!enabled) return json(204);
      if (request.headers.get("origin") !== config.site) return json(403, { error: errorMessage });
      if (url.search || url.hash) return json(400, { error: errorMessage });
      if (
        !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(
          request.headers.get("content-type") ?? "",
        )
      )
        return json(415, { error: errorMessage });
      try {
        const input = await boundedJson(request, bodyLimit);
        if (
          !object(input) ||
          Object.keys(input).length !== 3 ||
          !["id", "page", "source"].every((field) => Object.hasOwn(input, field)) ||
          typeof input.id !== "string" ||
          !uuid.test(input.id) ||
          typeof input.page !== "string" ||
          !trafficPages.some((page) => page === input.page) ||
          typeof input.source !== "string" ||
          !trafficSources.some((source) => source === input.source)
        )
          return json(400, { error: errorMessage });
        const agent = boundedAgent(request);
        if (
          !agent.trim() ||
          /bot|spider|crawl|slurp|headless|lighthouse|uptime|monitor|preview|facebookexternalhit|curl|wget|python|postman/i.test(
            agent,
          )
        )
          return json(204);
        const date = Math.floor((now() + istOffset) / dayLength);
        const dayKey = createHmac("sha256", config.secret)
          .update("luxe-traffic-daily-key:v1:" + date)
          .digest();
        const visitor = createHmac("sha256", dayKey)
          .update(JSON.stringify(["luxe-traffic-visitor:v1", address, agent]))
          .digest("hex");
        const response = await requestFetch(config.url + "/rest/v1/rpc/luxe_traffic_capture", {
          method: "POST",
          redirect: "error",
          signal: AbortSignal.timeout(5000),
          headers: {
            apikey: config.key,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            p_id: input.id.toLowerCase(),
            p_visitor_hash: visitor,
            p_page: input.page,
            p_source: input.source,
            p_device: deviceBucket(agent),
            p_daily_limit: dailyLimit,
          }),
        });
        if (!response.ok) {
          void response.body?.cancel().catch(() => {});
          return json(response.status === 429 ? 204 : 503, { error: errorMessage });
        }
        const result = await boundedJson(response, 4096);
        if (!object(result) || typeof result.recorded !== "boolean") throw new TrafficError(503);
        return json(204);
      } catch (error) {
        return json(error instanceof TrafficError ? error.status : 503, { error: errorMessage });
      }
    },
  };
}
