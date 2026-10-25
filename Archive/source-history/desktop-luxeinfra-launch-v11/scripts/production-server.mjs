import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Readable } from "node:stream";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const client = path.join(root, "dist/client");
const mime = { ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon", ".woff2": "font/woff2" };
const publicPaths = ["/", "/about", "/services", "/contact", "/privacy", "/how-it-works", "/design-ideas", "/find-your-style"];

export function createProductionServer({ handler, siteUrl = "https://luxeinfra.in", indexable = false } = {}) {
  const origin = new URL(siteUrl).origin;
  return http.createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
    if (!indexable) res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.setHeader("Cache-Control", "no-store");
    const send = (status, body, type = "text/plain; charset=utf-8") => {
      res.writeHead(status, { "Content-Type": type });
      res.end(req.method === "HEAD" ? undefined : body);
    };
    try {
      if (!["GET", "HEAD"].includes(req.method)) {
        res.setHeader("Allow", "GET, HEAD");
        return send(405, "Use WhatsApp or email to send your project brief.");
      }
      const url = new URL(req.url, origin);
      const pathname = decodeURIComponent(url.pathname);
      if (pathname.includes("\\") || pathname.split("/").some((part) => part.startsWith("."))) return send(404, "Not found");
      if (pathname === "/healthz") return send(200, "ok");
      if (pathname === "/api/visualiser/status") return send(200, JSON.stringify({ enabled: false, provider: "openai", providerLabel: "OpenAI", remaining: 0, message: "Plan your room with the studio. AI image generation is coming later." }), "application/json");
      if (pathname.startsWith("/api/")) return send(404, "Not found");
      if (pathname === "/robots.txt") return send(200, indexable ? `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${origin}/sitemap.xml\n` : "User-agent: *\nDisallow: /\n");
      if (pathname === "/sitemap.xml") return send(200, `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${publicPaths.map((p) => `<url><loc>${origin}${p}</loc></url>`).join("")}</urlset>`, "application/xml");
      // Serve only the built public tree; never source files, keys, uploads or the local desk.
      const file = path.resolve(client, "." + pathname);
      if (!file.startsWith(client + path.sep)) {
        if (pathname !== "/") return send(404, "Not found");
      } else {
        try {
          if ((await stat(file)).isFile()) {
            const extension = path.extname(file);
            if (!mime[extension]) return send(404, "Not found");
            res.setHeader("Cache-Control", pathname.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "public, max-age=3600");
            return send(200, await readFile(file), mime[extension]);
          }
        } catch (e) { if (e.code !== "ENOENT" && e.code !== "ENOTDIR") throw e; }
      }
      if (pathname.startsWith("/assets/")) return send(404, "Not found");
      const response = await handler.fetch(new Request(new URL(req.url, origin), { method: req.method, headers: { accept: req.headers.accept || "text/html" } }));
      res.statusCode = response.status;
      for (const [key, value] of response.headers) res.setHeader(key, value);
      if (req.method === "HEAD" || !response.body) return res.end();
      const stream = Readable.fromWeb(response.body);
      stream.on("error", () => res.destroy());
      res.on("close", () => stream.destroy());
      stream.pipe(res);
    } catch {
      if (!res.headersSent) send(500, "This page could not load. Please try again or contact sales@luxeinfra.in.");
      else res.destroy();
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const handler = (await import(pathToFileURL(path.join(root, "dist/server/server.js")).href)).default;
  const server = createProductionServer({ handler, siteUrl: process.env.SITE_URL, indexable: process.env.INDEXABLE === "true" });
  server.listen(Number(process.env.PORT || 3000), process.env.HOST || "0.0.0.0", () => console.log("LuxeInfra production server ready"));
  for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => { server.close(); setTimeout(() => process.exit(0), 8000).unref(); });
}
