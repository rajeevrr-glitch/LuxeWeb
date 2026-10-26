import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { createLuxeChat } from "./scripts/luxe-chat.mjs";
import { createLocalInbox } from "./scripts/inbox-local.mjs";
import netlify from "@netlify/vite-plugin-tanstack-start";

const netlifyBuild = process.env.LUXE_DEPLOY_TARGET === "netlify" || process.env.NETLIFY === "true";

export default defineConfig(({ mode }) => ({
  define: {
    "import.meta.env.LUXE_HOSTED_BUILD": JSON.stringify(netlifyBuild),
    "import.meta.env.LUXE_HOSTED_CONTEXT": JSON.stringify(
      process.env.CONTEXT === "production" ? "production" : "preview",
    ),
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwind(),
    tanstackStart({ server: { entry: "server" } }),
    ...(netlifyBuild ? [netlify()] : []),
    react(),
    {
      name: "luxe-local-api-status",
      configureServer(server) {
        const localEnvironment = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
        const inbox = createLocalInbox({ env: localEnvironment });
        const chat = createLuxeChat({
          env: localEnvironment,
          origins: ["http://127.0.0.1:3000", "http://localhost:3000"],
        });
        server.middlewares.use((req, res, next) => {
          void inbox(req, res)
            .then((handled) => {
              if (!handled) next();
            })
            .catch(next);
        });
        server.middlewares.use((req, res, next) => {
          if (!req.url?.split("?")[0].startsWith("/api/luxe-chat")) return next();
          void chat
            .handle(req, res)
            .then((handled: boolean) => {
              if (!handled) next();
            })
            .catch(next);
        });
        server.middlewares.use((req, res, next) => {
          const pathname = req.url?.split("?")[0] || "";
          if (!pathname.startsWith("/api/") || pathname.startsWith("/api/visualiser/"))
            return next();
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");
          if (pathname === "/api/enquiry-delivery/status" && req.method === "GET") {
            res.statusCode = 200;
            return res.end(JSON.stringify({ enabled: false, channel: "whatsapp" }));
          }
          res.statusCode = pathname === "/api/enquiry-delivery" ? 503 : 404;
          res.end(JSON.stringify({ error: "This service is not connected in local development." }));
        });
      },
    },
  ],
  build: {
    // Keep responsive room sources cacheable and out of the initial JavaScript payload.
    // https://vite.dev/config/build-options.html#build-assetsinlinelimit
    assetsInlineLimit: (filePath) =>
      /[\\/]assets[\\/]thumbnails[\\/]/.test(filePath) ? false : undefined,
  },
  server: {
    host: "127.0.0.1",
    port: 3000,
    strictPort: true,
    fs: { deny: ["**/.private/**", "**/.env", "**/.env.*", "**/*.{crt,pem}", "**/.git/**"] },
    proxy: { "/api/visualiser": "http://127.0.0.1:8791" },
  },
}));
