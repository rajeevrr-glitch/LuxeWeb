import { spawn } from "node:child_process";
const children = [
  spawn(process.execPath, ["--use-system-ca", "scripts/visualiser-server.mjs"], {
    stdio: "inherit",
  }),
  spawn(
    process.execPath,
    ["--use-system-ca", "node_modules/vite/bin/vite.js", "--mode", "review"],
    {
      stdio: "inherit",
    },
  ),
];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  children.forEach((child) => child.kill());
  process.exitCode = code;
}
children.forEach((child) => child.on("exit", (code) => stop(code || 0)));
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
