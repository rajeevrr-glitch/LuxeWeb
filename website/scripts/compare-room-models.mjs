// Owner-requested two-image comparison. A durable receipt prevents a repeated run.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { aiConfig } from "./visualiser-provider.mjs";
import { createVisualiserServer } from "./visualiser-server.mjs";

if (!process.argv.includes("--generate-two")) {
  console.log(
    "No images requested. This command requires an explicit --generate-two argument and owner authorisation.",
  );
} else {
  let current;
  const directory = path.resolve(".private/model-comparison");
  const receiptPath = path.join(directory, "state.json");
  const usageFile = path.resolve(".private/ai-pilot-usage.json");
  let receipt;
  const save = () => writeFile(receiptPath, JSON.stringify(receipt, null, 2));
  try {
    process.loadEnvFile(".env.local");
    const config = aiConfig();
    if (!config.enabled || config.provider !== "gemini") throw new Error("Connection unavailable.");
    const used = JSON.parse(await readFile(usageFile, "utf8")).attempts;
    if (!Number.isInteger(used) || used < 0 || used + 2 > 50) throw new Error("Invalid usage.");
    const daily = await fetch("http://127.0.0.1:3000/api/visualiser/status", {
      signal: AbortSignal.timeout(10000),
    }).then((r) => r.json());
    if (daily.remaining !== 0)
      throw new Error("The ordinary pilot must remain exhausted during the comparison.");
    receipt = {
      authorisedAttempts: 2,
      attemptsBefore: used,
      state: "running",
      models: [
        { model: "gemini-nano-banana-2.1", file: "nano-banana-2.1.jpg", state: "not-started" },
        { model: "gemini-3-pro-image", file: "nano-banana-pro.jpg", state: "not-started" },
      ],
    };
    await mkdir(directory, { recursive: true });
    await writeFile(receiptPath, JSON.stringify(receipt, null, 2), { flag: "wx" });
    const photo = await readFile("src/assets/ideas/bedroom/04.jpg");
    for (const candidate of receipt.models) {
      const server = createVisualiserServer({
        config: { ...config, model: candidate.model, maxAttempts: used + 2 },
        usageFile,
      });
      current = server;
      await new Promise((r) => server.listen(0, "127.0.0.1", r));
      const base = `http://127.0.0.1:${server.address().port}`;
      const started = Date.now();
      try {
        const session = await fetch(base + "/api/visualiser/status");
        const cookie = session.headers.get("set-cookie").split(";")[0];
        await session.body.cancel();
        const id = randomUUID();
        const brief = {
          id,
          room: "Master bedroom",
          style: "Warm minimal",
          unit: "feet",
          requestedChanges: ["furniture", "lighting"],
          preserve: ["flooring"],
          changes:
            "Retain the bed footprint and position. Add a simple beige upholstered headboard, a compact light oak wardrobe on the back-right wall and a small study desk on the right-hand wall where space permits. Add discreet warm ceiling lighting. Keep the original framing and room size. Move only plants that directly obstruct the requested furniture.",
          keep: "Preserve all existing left-hand windows, their frames and positions, the radiator, room envelope, wooden floor, camera viewpoint and bed scale.",
          consent: true,
          provider: "gemini",
        };
        const form = new FormData();
        form.append("brief", JSON.stringify(brief));
        form.append("photo", new Blob([photo], { type: "image/jpeg" }), "sample-bedroom.jpg");
        candidate.state = "attempt-started";
        candidate.id = id;
        await save(); // Persist before the one POST, including if its response is lost.
        console.log(
          JSON.stringify({ stage: "starting", model: candidate.model, automaticRetry: false }),
        );
        const accepted = await fetch(base + "/api/visualiser/jobs", {
          method: "POST",
          redirect: "error",
          headers: { Cookie: cookie, Origin: "http://127.0.0.1:3000" },
          body: form,
          signal: AbortSignal.timeout(30000),
        });
        if (!accepted.ok) {
          candidate.state = "not-accepted";
          candidate.httpStatus = accepted.status;
          await accepted.body.cancel();
          continue;
        }
        let job = await accepted.json();
        const deadline = Date.now() + 210000;
        while (job.state === "generating" && Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 2000));
          const response = await fetch(base + "/api/visualiser/jobs/" + id, {
            headers: { Cookie: cookie },
            signal: AbortSignal.timeout(10000),
          });
          if (!response.ok) throw new Error("Status unavailable.");
          job = await response.json();
        }
        if (job.state !== "completed") {
          candidate.state = job.state === "failed" ? "failed" : "uncertain";
          candidate.errorCode = job.errorCode || "unknown";
          continue;
        }
        if (job.concept !== "/api/visualiser/jobs/" + id + "/concept")
          throw new Error("Invalid output route.");
        const result = await fetch(base + job.concept, {
          headers: { Cookie: cookie },
          signal: AbortSignal.timeout(15000),
        });
        if (!result.ok || result.headers.get("content-type") !== "image/jpeg")
          throw new Error("Output unavailable.");
        const bytes = Buffer.from(await result.arrayBuffer());
        const metadata = await sharp(bytes).metadata();
        if (!bytes.length || bytes.length > 15 * 1024 * 1024 || !metadata.width || !metadata.height)
          throw new Error("Invalid image.");
        await writeFile(path.join(directory, candidate.file), bytes, { flag: "wx" });
        Object.assign(candidate, {
          state: "completed",
          width: metadata.width,
          height: metadata.height,
          bytes: bytes.length,
        });
      } catch {
        if (candidate.state === "attempt-started") candidate.state = "uncertain";
      } finally {
        candidate.elapsedSeconds = Math.round((Date.now() - started) / 1000);
        await save();
        console.log(
          JSON.stringify({
            model: candidate.model,
            state: candidate.state,
            errorCode: candidate.errorCode,
            elapsedSeconds: candidate.elapsedSeconds,
          }),
        );
        server.closeAllConnections();
        await new Promise((r) => server.close(r));
        current = undefined;
      }
    }
    receipt.attemptsAfter = JSON.parse(await readFile(usageFile, "utf8")).attempts;
    receipt.state = receipt.models.every((m) => m.state === "completed")
      ? "completed"
      : "needs-review";
    await save();
    console.log(
      JSON.stringify({
        state: receipt.state,
        imagesSaved: receipt.models.filter((m) => m.state === "completed").length,
        attemptsBefore: receipt.attemptsBefore,
        attemptsAfter: receipt.attemptsAfter,
        automaticRetry: false,
      }),
    );
    if (receipt.state !== "completed") process.exitCode = 1;
  } catch {
    console.error(
      "Comparison stopped safely. Check the existing private receipt and configuration; no automatic retry or extra generation was made.",
    );
    process.exitCode = 1;
  } finally {
    if (current) {
      current.closeAllConnections();
      current.close();
    }
  }
}
