import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chatRequestsOverride, looksSensitiveChatInput } from "../src/lib/luxe-chat.ts";
import { buildLuxeChatKnowledge } from "../src/lib/luxe-knowledge.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultCounter = path.join(root, ".private", "luxe-chat-quota.json");
const sessionAge = 30 * 60 * 1000;

function readQuestionBody(req, deadline) {
  return new Promise((resolve, reject) => {
    let bytes = 0;
    const chunks = [];
    const cleanup = () => {
      clearTimeout(timer);
      req.off("data", onData);
      req.off("end", onEnd);
      req.off("error", onError);
      req.off("aborted", onAbort);
    };
    const fail = (status) => {
      cleanup();
      const error = new Error("Question body unavailable.");
      error.status = status;
      reject(error);
      req.resume();
    };
    const onData = (chunk) => {
      bytes += chunk.length;
      if (bytes > 4096) return fail(413);
      chunks.push(chunk);
    };
    const onEnd = () => {
      cleanup();
      resolve(Buffer.concat(chunks).toString("utf8"));
    };
    const onError = () => fail(400);
    const onAbort = () => fail(400);
    const timer = setTimeout(() => fail(408), deadline);
    req.on("data", onData);
    req.once("end", onEnd);
    req.once("error", onError);
    req.once("aborted", onAbort);
  });
}

export function chatConfig(env = process.env) {
  const key = env.LUXE_CHAT_API_KEY?.trim() || "";
  const model = env.LUXE_CHAT_MODEL?.trim() || "gemini-3.5-flash-lite";
  const requested = Number(env.LUXE_CHAT_DAILY_LIMIT || 20);
  const dailyLimit =
    Number.isInteger(requested) && requested >= 1 && requested <= 100 ? requested : 20;
  // The image API key, image allowance and image enable flag never enable text chat.
  const enabled =
    env.LUXE_CHAT_ENABLED === "true" &&
    /^(?:AIza[A-Za-z0-9_-]{20,}|AQ\.[A-Za-z0-9._-]{20,})$/.test(key) &&
    /^[a-z0-9.-]{3,80}$/.test(model) &&
    !/image|banana|omni|veo|lyria/.test(model);
  return { enabled, key, model, dailyLimit };
}

export async function geminiChat(question, config, fetcher = fetch) {
  const response = await fetcher("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": config.key },
    redirect: "error",
    signal: AbortSignal.timeout(20000),
    body: JSON.stringify({
      model: config.model,
      input: question,
      system_instruction: buildLuxeChatKnowledge(),
      store: false,
      generation_config: { max_output_tokens: 350, temperature: 0.3, thinking_level: "minimal" },
    }),
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error("Chat is unavailable. Use website guidance or contact the studio.");
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of response.body || []) {
    size += chunk.length;
    if (size > 64 * 1024) throw new Error("Chat response was too large.");
    chunks.push(chunk);
  }
  const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  const reply = data.steps
    ?.filter((step) => step.type === "model_output")
    .flatMap((step) => step.content || [])
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n")
    .trim();
  if (
    data.status !== "completed" ||
    !reply ||
    reply.length > 2000 ||
    /https?:|www\.|<\/?[a-z]|₹|\b\d+\s*(?:%|lakh|crore|rupees|years? warranty|days? guarantee)/i.test(
      reply.replace(/\b15\s*%/g, "the approved Diwali discount"),
    )
  )
    throw new Error("The studio needs to confirm that advice. Use website guidance instead.");
  return reply;
}

export function createLuxeChat({
  env = process.env,
  origins = ["https://luxeinfra.in"],
  counterFile = defaultCounter,
  fetcher = fetch,
  now = () => Date.now(),
  bodyReadMs = 5000,
} = {}) {
  const config = chatConfig(env);
  const allowedOrigins = new Set(origins);
  const sessions = new Map();
  let busy = false;
  const send = (res, code, data, head = false) => {
    res.writeHead(code, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(head ? undefined : JSON.stringify(data));
  };
  const day = () => new Date(now()).toISOString().slice(0, 10);
  async function quota() {
    try {
      const value = JSON.parse(await readFile(counterFile, "utf8"));
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value.day) || !Number.isInteger(value.used) || value.used < 0)
        throw new Error("Invalid counter");
      return value.day === day() ? value.used : 0;
    } catch (error) {
      if (error.code === "ENOENT") return 0;
      throw new Error("Chat allowance unavailable.");
    }
  }
  async function reserve() {
    const used = await quota();
    if (used >= config.dailyLimit) return false;
    await mkdir(path.dirname(counterFile), { recursive: true });
    const temp = counterFile + ".pending";
    await writeFile(temp, JSON.stringify({ day: day(), used: used + 1 }), { mode: 0o600 });
    await rename(temp, counterFile);
    return true;
  }
  function purge() {
    for (const [id, session] of sessions) if (session.expires <= now()) sessions.delete(id);
  }
  function sessionFor(req) {
    const id = /(?:^|;\s*)luxe_chat_session=([a-f0-9]{48})(?:;|$)/.exec(
      req.headers.cookie || "",
    )?.[1];
    const session = sessions.get(id);
    return session?.expires > now() ? session : null;
  }
  return {
    async handle(req, res) {
      const pathname = (req.url || "").split("?")[0];
      if (pathname !== "/api/luxe-chat" && pathname !== "/api/luxe-chat/status") return false;
      purge();
      if (pathname.endsWith("/status")) {
        if (!["GET", "HEAD"].includes(req.method)) {
          res.setHeader("Allow", "GET, HEAD");
          send(res, 405, { error: "Use GET." });
          return true;
        }
        let available = config.enabled;
        if (available) {
          try {
            available = (await quota()) < config.dailyLimit;
          } catch {
            available = false;
          }
        }
        if (available && !sessionFor(req)) {
          if (sessions.size >= 1000) available = false;
          else {
            const id = randomBytes(24).toString("hex");
            sessions.set(id, { expires: now() + sessionAge, used: 0 });
            const secure = origins.every((value) => value.startsWith("https:")) ? "; Secure" : "";
            res.setHeader(
              "Set-Cookie",
              `luxe_chat_session=${id}; HttpOnly; SameSite=Strict; Path=/api/luxe-chat; Max-Age=1800${secure}`,
            );
          }
        }
        send(
          res,
          200,
          {
            enabled: available,
            provider: "gemini",
            mode: available ? "optional-ai" : "website-guide",
          },
          req.method === "HEAD",
        );
        return true;
      }
      if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        send(res, 405, { error: "Use POST." });
        return true;
      }
      if (!config.enabled) {
        send(res, 503, { error: "AI chat is not connected. Website guidance is available." });
        return true;
      }
      if (
        !allowedOrigins.has(req.headers.origin) ||
        req.headers["sec-fetch-site"] === "cross-site"
      ) {
        send(res, 403, { error: "Open chat from the LuxeInfra website." });
        return true;
      }
      const session = sessionFor(req);
      if (!session) {
        send(res, 403, { error: "Reopen Luxe chat before sending a question." });
        return true;
      }
      if (session.used >= 8) {
        send(res, 429, { error: "Chat allowance reached. Please contact the studio." });
        return true;
      }
      if (busy) {
        send(res, 429, { error: "Luxe is busy. Website guidance is available." });
        return true;
      }
      if (!/^application\/json(?:\s*;|$)/i.test(req.headers["content-type"] || "")) {
        send(res, 415, { error: "Send a short text question." });
        return true;
      }
      busy = true;
      try {
        const rawBody = await readQuestionBody(req, bodyReadMs);
        let body;
        try {
          body = JSON.parse(rawBody);
        } catch {
          send(res, 400, { error: "Send a short text question." });
          return true;
        }
        if (
          !body ||
          body.consent !== true ||
          typeof body.question !== "string" ||
          !body.question.trim() ||
          body.question.length > 500 ||
          Object.keys(body).some((key) => !["question", "consent"].includes(key))
        ) {
          send(res, 400, { error: "Choose AI guidance and send a question under 500 characters." });
          return true;
        }
        if (looksSensitiveChatInput(body.question)) {
          send(res, 400, { error: "Do not send secrets or credentials." });
          return true;
        }
        if (chatRequestsOverride(body.question)) {
          send(res, 400, { error: "Ask Luxe about our services or planning tools." });
          return true;
        }
        if (!(await reserve())) {
          send(res, 429, { error: "AI chat allowance reached. Website guidance is available." });
          return true;
        }
        session.used++;
        const reply = await geminiChat(body.question.trim(), config, fetcher);
        send(res, 200, { reply });
      } catch (error) {
        // Provider bodies, keys and visitor questions are never returned or logged.
        if ([408, 413].includes(error.status)) {
          res.setHeader("Connection", "close");
          send(res, error.status, { error: "Send a complete question under 500 characters." });
        } else if (!res.destroyed)
          send(res, 503, {
            error: "AI guidance is unavailable. Website guidance is available instead.",
          });
      } finally {
        busy = false;
      }
      return true;
    },
  };
}
