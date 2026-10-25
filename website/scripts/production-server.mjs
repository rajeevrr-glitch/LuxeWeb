import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Readable } from "node:stream";
import { createReadStream } from "node:fs";
import { createEnquiryDelivery } from "./enquiry-delivery.mjs";
import { createWhatsAppNotifier } from "./whatsapp-notification.mjs";
import { createLuxeChat } from "./luxe-chat.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const client = path.join(root, "dist/client");
const mime = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};
const publicPaths = [
  "/",
  "/about",
  "/services",
  "/contact",
  "/privacy",
  "/how-it-works",
  "/design-ideas",
  "/projects",
  "/find-your-style",
  "/materials",
  "/guides",
  "/guides/first-design-conversation",
  "/guides/compare-interior-quotes",
  "/guides/plan-your-kitchen",
  "/guides/renovation-priorities",
  "/plan",
  "/partner-with-us",
];
const galleryPaths = [
  "kitchen",
  "living",
  "bedroom",
  "wardrobe",
  "dining",
  "bathroom",
  "kids",
  "office",
  "pooja",
  "foyer",
  "full-home",
].map((slug) => "/design-ideas/" + slug);

export function deliveryForEnvironment(env = process.env) {
  const directory = env.LUXE_ENQUIRY_DATA_DIR;
  const relative =
    typeof directory === "string" && path.isAbsolute(directory)
      ? path.relative(root, directory)
      : "";
  // Keep enquiry records out of source handovers and anything a host could serve.
  const privateDirectory =
    relative &&
    (relative.startsWith(".." + path.sep) ||
      path.isAbsolute(relative) ||
      relative === ".private" ||
      relative.startsWith(".private" + path.sep))
      ? directory
      : undefined;
  return createEnquiryDelivery({
    enabled: env.LUXE_ENQUIRY_DELIVERY_ENABLED === "true",
    directory: privateDirectory,
    origins: [new URL(env.SITE_URL || "https://luxeinfra.in").origin],
    notify: createWhatsAppNotifier(env),
  });
}

export function createProductionServer({
  handler,
  siteUrl = "https://luxeinfra.in",
  indexable = false,
  delivery = createEnquiryDelivery(),
  chat = createLuxeChat({ origins: [new URL(siteUrl).origin] }),
  clientDirectory = client,
} = {}) {
  const origin = new URL(siteUrl).origin;
  const staticRoot = path.resolve(clientDirectory);
  return http.createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
    );
    if (!indexable) res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.setHeader("Cache-Control", "no-store");
    const send = (status, body, type = "text/plain; charset=utf-8") => {
      res.writeHead(status, { "Content-Type": type });
      res.end(req.method === "HEAD" ? undefined : body);
    };
    try {
      const url = new URL(req.url, origin);
      let pathname;
      try {
        pathname = decodeURIComponent(url.pathname);
      } catch {
        return send(400, "Invalid URL");
      }
      if (pathname.includes("\\") || pathname.split("/").some((part) => part.startsWith(".")))
        return send(404, "Not found");
      if (await chat.handle(req, res)) return;
      if (pathname === "/api/enquiry-delivery/status" && ["GET", "HEAD"].includes(req.method))
        return send(200, JSON.stringify(delivery.status()), "application/json");
      if (pathname === "/api/enquiry-delivery") return await delivery.handle(req, res);
      if (!["GET", "HEAD"].includes(req.method)) {
        res.setHeader("Allow", "GET, HEAD");
        return send(405, "Use WhatsApp or email to send your project brief.");
      }
      if (pathname === "/healthz") return send(200, "ok");
      if (pathname === "/api/visualiser/status")
        return send(
          200,
          JSON.stringify({
            enabled: false,
            provider: "openai",
            providerLabel: "OpenAI",
            remaining: 0,
            message: "Plan your room with the studio. AI image generation is coming later.",
          }),
          "application/json",
        );
      if (pathname.startsWith("/api/")) return send(404, "Not found");
      if (pathname === "/robots.txt")
        return send(
          200,
          indexable
            ? `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${origin}/sitemap.xml\n`
            : "User-agent: *\nDisallow: /\n",
        );
      if (pathname === "/sitemap.xml")
        return send(
          200,
          `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...publicPaths, ...galleryPaths].map((p) => `<url><loc>${origin}${p}</loc></url>`).join("")}</urlset>`,
          "application/xml",
        );
      // Serve only the built public tree; never source files, keys, uploads or the local desk.
      const file = path.resolve(staticRoot, "." + pathname);
      if (!file.startsWith(staticRoot + path.sep)) {
        if (pathname !== "/") return send(404, "Not found");
      } else {
        try {
          const fileStat = await stat(file);
          if (fileStat.isFile()) {
            const extension = path.extname(file);
            if (!mime[extension]) return send(404, "Not found");
            res.setHeader(
              "Cache-Control",
              pathname.startsWith("/assets/")
                ? "public, max-age=31536000, immutable"
                : "public, max-age=3600",
            );
            if (extension === ".mp4") {
              res.setHeader("Accept-Ranges", "bytes");
              let start = 0;
              let end = fileStat.size - 1;
              let status = 200;
              // A request carrying If-Range falls back to a complete response because
              // this server does not advertise a strong media validator.
              if (req.headers.range && !req.headers["if-range"]) {
                const match = /^bytes=(\d*)-(\d*)$/i.exec(req.headers.range);
                const first = match?.[1] ? Number(match[1]) : null;
                const last = match?.[2] ? Number(match[2]) : null;
                let valid = Boolean(match && (first !== null || last !== null));
                valid &&= first === null || Number.isSafeInteger(first);
                valid &&= last === null || Number.isSafeInteger(last);
                if (valid && first === null) {
                  valid = last > 0;
                  start = Math.max(0, fileStat.size - last);
                } else if (valid) {
                  start = first;
                  end = last === null ? end : Math.min(last, end);
                }
                valid &&= start >= 0 && start < fileStat.size && end >= start;
                if (!valid) {
                  res.setHeader("Content-Range", `bytes */${fileStat.size}`);
                  res.setHeader("Content-Length", "0");
                  res.writeHead(416);
                  return res.end();
                }
                status = 206;
                res.setHeader("Content-Range", `bytes ${start}-${end}/${fileStat.size}`);
              }
              res.setHeader("Content-Length", String(end - start + 1));
              res.writeHead(status, { "Content-Type": mime[extension] });
              if (req.method === "HEAD") return res.end();
              const mediaStream = createReadStream(file, { start, end });
              mediaStream.on("error", () => res.destroy());
              res.on("close", () => mediaStream.destroy());
              mediaStream.pipe(res);
              return;
            }
            return send(200, await readFile(file), mime[extension]);
          }
        } catch (e) {
          if (e.code !== "ENOENT" && e.code !== "ENOTDIR") throw e;
        }
      }
      if (pathname.startsWith("/assets/")) return send(404, "Not found");
      const response = await handler.fetch(
        new Request(new URL(req.url, origin), {
          method: req.method,
          headers: { accept: req.headers.accept || "text/html" },
        }),
      );
      res.statusCode = response.status;
      for (const [key, value] of response.headers) res.setHeader(key, value);
      if (response.status >= 400) res.setHeader("X-Robots-Tag", "noindex, nofollow");
      if (req.method === "HEAD" || !response.body) return res.end();
      const stream = Readable.fromWeb(response.body);
      stream.on("error", () => res.destroy());
      res.on("close", () => stream.destroy());
      stream.pipe(res);
    } catch {
      if (!res.headersSent)
        send(500, "This page could not load. Please try again or contact sales@luxeinfra.in.");
      else res.destroy();
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const handler = (await import(pathToFileURL(path.join(root, "dist/server/server.js")).href))
    .default;
  const server = createProductionServer({
    handler,
    siteUrl: process.env.SITE_URL,
    indexable: process.env.INDEXABLE === "true",
    delivery: deliveryForEnvironment(),
  });
  server.listen(Number(process.env.PORT || 3000), process.env.HOST || "0.0.0.0", () =>
    console.log("LuxeInfra production server ready"),
  );
  for (const signal of ["SIGTERM", "SIGINT"])
    process.on(signal, () => {
      server.close();
      setTimeout(() => process.exit(0), 8000).unref();
    });
}
