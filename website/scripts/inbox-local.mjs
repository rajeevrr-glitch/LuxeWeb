import { Readable } from "node:stream";
import { createHostedInbox } from "../src/lib/hosted-inbox.server.ts";

/** Bridge the same authenticated API into loopback-only local review. */
export function createLocalInbox({ env = process.env, origin } = {}) {
  const inbox = createHostedInbox({ env });
  return async (req, res) => {
    const pathname = req.url?.split("?")[0] ?? "";
    if (pathname !== "/api/admin" && !pathname.startsWith("/api/admin/")) return false;
    const requestOrigin =
      origin ??
      (req.headers.host === "localhost:3000" ? "http://localhost:3000" : "http://127.0.0.1:3000");
    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) value.forEach((entry) => headers.append(name, entry));
      else if (value !== undefined) headers.set(name, value);
    }
    const controller = new AbortController();
    const abort = () => controller.abort();
    req.once("aborted", abort);
    try {
      const request = new Request(new URL(req.url, requestOrigin), {
        method: req.method,
        headers,
        signal: controller.signal,
        ...(!["GET", "HEAD"].includes(req.method)
          ? { body: Readable.toWeb(req), duplex: "half" }
          : {}),
      });
      const response = await inbox.handle(request, {
        environment: "local",
        runtime: { ip: req.socket.remoteAddress },
      });
      if (!response) return false;
      res.statusCode = response.status;
      for (const [name, value] of response.headers) {
        if (name !== "set-cookie") res.setHeader(name, value);
      }
      const cookies = response.headers.getSetCookie();
      if (cookies.length) res.setHeader("Set-Cookie", cookies);
      if (req.method === "HEAD" || !response.body) res.end();
      else res.end(Buffer.from(await response.arrayBuffer()));
      return true;
    } finally {
      req.off("aborted", abort);
    }
  };
}
