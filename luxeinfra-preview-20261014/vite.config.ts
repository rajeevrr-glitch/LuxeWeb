import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), tailwind(), tanstackStart({ server: { entry: "server" } }), react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    fs: { deny: ["**/.private/**", "**/.env", "**/.env.*", "**/*.{crt,pem}", "**/.git/**"] },
    proxy: { "/api/": "http://127.0.0.1:8788" },
  },
});
