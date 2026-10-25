type HostedRuntimeOptions = {
  environment?: string;
  productionOrigin?: string;
};

const ownedOrigin = "https://luxeinfra.in";
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
const privateDirectories = new Set([
  ".netlify",
  ".vercel",
  "netlify",
  "src",
  "scripts",
  "tests",
  "docs",
  "node_modules",
  "dist",
  "dist-ssr",
  "outputs",
  "archive",
]);
const privateFiles = new Set([
  "agents.md",
  "readme.md",
  "workdone.md",
  "package.json",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lock",
  "bun.lockb",
  "tsconfig.json",
  "vite.config.ts",
  "eslint.config.js",
  "netlify.toml",
  "vercel.json",
  "nitro.config.ts",
  "start-website.cmd",
]);

function indexable(request: Request, options: HostedRuntimeOptions): boolean {
  // Do not let an unrecognised host, forwarded header or deployment URL become
  // the canonical site. A malformed configuration also fails closed.
  return (
    options.environment === "production" &&
    (options.productionOrigin ?? ownedOrigin) === ownedOrigin &&
    new URL(request.url).origin === ownedOrigin
  );
}

function decodedPath(request: Request): string | null {
  let pathname = new URL(request.url).pathname;
  try {
    // Reject nested escaping and path separators before SSR sees a different
    // interpretation of a hidden/source path.
    for (let depth = 0; depth < 3; depth++) {
      if (/%(?:2f|5c)/i.test(pathname)) return null;
      const decoded = decodeURIComponent(pathname);
      if (decoded === pathname) break;
      pathname = decoded;
    }
  } catch {
    return null;
  }
  if (
    /%[a-f0-9]{2}/i.test(pathname) ||
    pathname.includes("\\") ||
    [...pathname].some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127;
    })
  )
    return null;
  const segments = pathname.split("/").filter(Boolean);
  if (segments.some((segment) => segment.startsWith("."))) return null;
  const root = segments[0]?.toLowerCase() ?? "";
  if (privateDirectories.has(root) || privateFiles.has(root)) return null;
  if (/\.(?:env|pem|crt|key|log|map|cmd|ps1|bat)$/i.test(pathname)) return null;
  return pathname;
}

export function protectHostedResponse(
  request: Request,
  response: Response,
  options: HostedRuntimeOptions = {},
): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
  );
  headers.set("Cache-Control", "no-store");
  const pathname = new URL(request.url).pathname;
  if (
    !indexable(request, options) ||
    response.status >= 400 ||
    pathname === "/healthz" ||
    pathname === "/api" ||
    pathname.startsWith("/api/")
  )
    headers.set("X-Robots-Tag", "noindex, nofollow");
  return new Response(request.method === "HEAD" ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Shared hosted-runtime guards; null continues SSR on the selected host.
 * Local services stay unavailable until they have durable storage, quotas and delivery.
 */
export function handleHostedRequest(
  request: Request,
  options: HostedRuntimeOptions = {},
): Response | null {
  const respond = (
    status: number,
    body: string,
    contentType = "text/plain; charset=utf-8",
    allow?: string,
  ) => {
    const headers = new Headers({ "Content-Type": contentType });
    if (allow) headers.set("Allow", allow);
    return protectHostedResponse(
      request,
      new Response(request.method === "HEAD" ? null : body, { status, headers }),
      options,
    );
  };
  const json = (status: number, value: unknown, allow?: string) =>
    respond(status, JSON.stringify(value), "application/json; charset=utf-8", allow);
  const methodNotAllowed = (allow: string) =>
    json(405, { error: "This request method is not available." }, allow);
  const pathname = decodedPath(request);
  if (pathname === null) return respond(404, "Not found");

  if (pathname === "/api" || pathname.startsWith("/api/")) {
    const statuses: Record<string, object> = {
      "/api/luxe-chat/status": {
        enabled: false,
        provider: "gemini",
        mode: "website-guide",
      },
      "/api/enquiry-delivery/status": { enabled: false, channel: "whatsapp" },
      "/api/visualiser/status": {
        enabled: false,
        provider: "gemini",
        providerLabel: "Gemini",
        remaining: 0,
        captureAvailable: false,
        message: "Plan your room with the studio. Online AI image generation is not connected.",
      },
    };
    if (Object.hasOwn(statuses, pathname)) {
      if (!["GET", "HEAD"].includes(request.method)) return methodNotAllowed("GET, HEAD");
      return json(200, statuses[pathname]);
    }
    const actions = new Set([
      "/api/luxe-chat",
      "/api/enquiry-delivery",
      "/api/visualiser/leads",
      "/api/visualiser/jobs",
    ]);
    if (request.method === "POST")
      return json(503, {
        error: "This online service is not connected. Please contact the studio on WhatsApp.",
      });
    if (actions.has(pathname)) return methodNotAllowed("POST");
    if (!["GET", "HEAD"].includes(request.method)) return methodNotAllowed("GET, HEAD, POST");
    return json(404, { error: "Not found." });
  }

  if (!["GET", "HEAD"].includes(request.method)) return methodNotAllowed("GET, HEAD");
  if (pathname === "/healthz") return respond(200, "ok");
  if (pathname === "/robots.txt")
    return respond(
      200,
      indexable(request, options)
        ? `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${ownedOrigin}/sitemap.xml\n`
        : "User-agent: *\nDisallow: /\n",
    );
  if (pathname === "/sitemap.xml")
    return respond(
      200,
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...publicPaths, ...galleryPaths].map((pathname) => `<url><loc>${ownedOrigin}${pathname}</loc></url>`).join("")}</urlset>`,
      "application/xml; charset=utf-8",
    );
  return null;
}
