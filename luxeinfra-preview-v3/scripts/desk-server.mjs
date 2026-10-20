import http from "node:http";
import { readFile, readdir, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { randomBytes, timingSafeEqual, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
export const statuses = [
  "New",
  "Contacted",
  "Consultation planned",
  "Estimate sent",
  "Won",
  "Not proceeding",
];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function json(res, status, data) {
  res.writeHead(status, {
    "content-type": "application/json",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  res.end(JSON.stringify(data));
}
export function createDeskServer({ directory = path.resolve(".private/enquiries"), key } = {}) {
  if (typeof key !== "string" || key.length < 24)
    throw new Error("A strong session access code is required.");
  const locks = new Map();
  const server = http.createServer(async (req, res) => {
    try {
      const port = server.address().port;
      const hosts = [`127.0.0.1:${port}`, `localhost:${port}`];
      if (!hosts.includes(req.headers.host)) return json(res, 403, { error: "Local access only." });
      if (req.headers.origin && !hosts.map((h) => "http://" + h).includes(req.headers.origin))
        return json(res, 403, { error: "This request did not come from the local desk." });
      const url = new URL(req.url, "http://" + req.headers.host);
      if (url.pathname === "/" && req.method === "GET") {
        res.writeHead(200, {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
          "content-security-policy":
            "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' blob:; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
        });
        return res.end(await readFile(new URL("./desk.html", import.meta.url)));
      }
      if (["/desk.js", "/desk.css"].includes(url.pathname) && req.method === "GET") {
        res.writeHead(200, {
          "content-type": url.pathname.endsWith(".js") ? "text/javascript" : "text/css",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        });
        return res.end(await readFile(new URL("." + url.pathname, import.meta.url)));
      }
      const supplied = Buffer.from(String(req.headers.authorization || "").replace(/^Bearer /, ""));
      const expected = Buffer.from(key);
      if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected))
        return json(res, 401, {
          error: "Enter the access code shown in the enquiry desk terminal.",
        });
      if (url.pathname === "/api/enquiries" && req.method === "GET") {
        let dirs;
        try {
          dirs = await readdir(directory, { withFileTypes: true });
        } catch (e) {
          if (e.code !== "ENOENT") throw e;
          dirs = [];
        }
        const records = [];
        let unreadable = 0;
        for (const dir of dirs.filter((d) => d.isDirectory() && uuid.test(d.name))) {
          try {
            const brief = JSON.parse(
              await readFile(path.join(directory, dir.name, "brief.json"), "utf8"),
            );
            let workflow = { status: "New", note: "", history: [] };
            try {
              workflow = JSON.parse(
                await readFile(path.join(directory, dir.name, "workflow.json"), "utf8"),
              );
            } catch (e) {
              if (e.code !== "ENOENT") throw e;
            }
            const { fingerprint, website, ...safe } = brief;
            records.push({ ...safe, id: dir.name, workflow });
          } catch {
            unreadable++;
          }
        }
        records.sort((a, b) => String(b.receivedAt).localeCompare(String(a.receivedAt)));
        return json(res, 200, { records, unreadable, statuses });
      }
      const match = url.pathname.match(
        /^\/api\/enquiries\/([0-9a-f-]+)\/(workflow|files\/([1-3]\.(?:pdf|png|jpe?g)))$/i,
      );
      if (!match || !uuid.test(match[1])) return json(res, 404, { error: "Not found." });
      const folder = path.join(directory, match[1]);
      const brief = JSON.parse(await readFile(path.join(folder, "brief.json"), "utf8"));
      if (match[2].startsWith("files/") && req.method === "GET") {
        const file = (brief.files || []).find((f) => f.filename === match[3]);
        if (!file) return json(res, 404, { error: "Attachment not found." });
        const bytes = await readFile(path.join(folder, file.filename));
        res.writeHead(200, {
          "content-type": "application/octet-stream",
          "content-disposition": `attachment; filename="${file.filename}"`,
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        });
        return res.end(bytes);
      }
      if (match[2] !== "workflow" || req.method !== "PUT")
        return json(res, 405, { error: "Method not allowed." });
      if (
        !req.headers.origin ||
        !String(req.headers["content-type"]).startsWith("application/json")
      )
        return json(res, 403, { error: "Use the local desk to update an enquiry." });
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 12000) return json(res, 413, { error: "Update too large." });
      }
      let update;
      try {
        update = JSON.parse(body);
      } catch {
        return json(res, 400, { error: "Invalid update." });
      }
      if (
        !statuses.includes(update.status) ||
        typeof update.note !== "string" ||
        update.note.length > 2000 ||
        !Number.isInteger(update.version) ||
        update.version < 0
      )
        return json(res, 400, {
          error: "Choose a valid stage and keep notes within 2,000 characters.",
        });
      const persist = async () => {
        let previous = { status: "New", note: "", history: [], version: 0 };
        try {
          previous = JSON.parse(await readFile(path.join(folder, "workflow.json"), "utf8"));
        } catch (e) {
          if (e.code !== "ENOENT") throw e;
        }
        if ((previous.version || 0) !== update.version)
          throw Object.assign(
            new Error("This enquiry changed in another window. Refresh before saving."),
            { status: 409 },
          );
        const at = new Date().toISOString();
        const workflow = {
          status: update.status,
          note: update.note.trim(),
          updatedAt: at,
          version: update.version + 1,
          history: [
            ...(previous.history || []),
            { at, from: previous.status, to: update.status },
          ].slice(-100),
        };
        const temp = path.join(folder, `.workflow-${randomUUID()}.json`);
        await writeFile(temp, JSON.stringify(workflow, null, 2), { flag: "wx" });
        await rename(temp, path.join(folder, "workflow.json"));
        return workflow;
      };
      const previous = locks.get(match[1]) || Promise.resolve();
      const job = previous.catch(() => {}).then(persist);
      locks.set(match[1], job);
      try {
        return json(res, 200, await job);
      } finally {
        if (locks.get(match[1]) === job) locks.delete(match[1]);
      }
    } catch (e) {
      json(res, e.status || (e.code === "ENOENT" ? 404 : 500), {
        error: e.status
          ? e.message
          : e.code === "ENOENT"
            ? "Enquiry not found."
            : "Could not complete this action. Your changes have not been confirmed.",
      });
    }
  });
  return server;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const key = randomBytes(24).toString("base64url");
  const server = createDeskServer({ key });
  server.on("error", () => {
    console.error("The enquiry desk could not start. Check whether another desk is already open.");
    process.exitCode = 1;
  });
  server.listen(8789, "127.0.0.1", () => {
    console.log(
      "\nLuxeInfra local enquiry desk: http://127.0.0.1:8789\nSession access code: " +
        key +
        "\n\nEnter this code in the desk. It expires when this process stops. Keep it private.\nNo emails or messages are sent from this desk. Ctrl+C stops it.",
    );
  });
}
