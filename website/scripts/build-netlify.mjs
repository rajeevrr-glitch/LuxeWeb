import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

// Use the same source as local review, with the Netlify adapter and public content.
// Do not read or upload .env.local; hosted services need their own durable setup.
const child = spawn(
  process.execPath,
  [
    fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url)),
    "build",
    "--mode",
    "production",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      LUXE_DEPLOY_TARGET: "netlify",
      VITE_CONTENT_PREVIEW: "false",
      VITE_CAMPAIGN_PREVIEW: "false",
    },
  },
);
child.on("error", () => {
  console.error("The Netlify build could not start. Install the project dependencies first.");
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
