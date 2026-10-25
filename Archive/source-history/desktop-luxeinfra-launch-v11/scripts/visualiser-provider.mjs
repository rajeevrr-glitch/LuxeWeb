import { InferenceClient } from "@huggingface/inference";

export function aiConfig(env = process.env) {
  const provider = env.LUXE_AI_PROVIDER === "openai" ? "openai" : "huggingface";
  const key = provider === "openai" ? env.OPENAI_API_KEY : env.HF_TOKEN;
  const limit = Number(env.LUXE_AI_MAX_ATTEMPTS || 2);
  return {
    provider,
    key,
    enabled: env.LUXE_AI_ENABLED === "true" && !!key,
    maxAttempts: Number.isInteger(limit) && limit > 0 && limit <= 50 ? limit : 2,
    label: provider === "openai" ? "OpenAI" : "Hugging Face / fal",
    model: provider === "openai" ? "gpt-image-2.5-flare" : "Qwen/Qwen-Image-Edit-2511",
  };
}

export function roomPrompt(brief) {
  return [
    "Edit the supplied interior photograph into one photorealistic residential design concept for LuxeInfra.",
    "Keep the same camera viewpoint, room envelope, visible door and window locations and structural elements. Do not enlarge the room or invent extra openings.",
    "The dimensions are user-supplied context, not a measured 3D model. Respect plausible proportions and circulation; do not add measurement labels, logos, text or watermarks.",
    `Room: ${brief.room}. Style direction: ${brief.style}.`,
    `Reported dimensions: ${brief.length} × ${brief.width}, ceiling height ${brief.height} ${brief.unit}.`,
    `Requested design changes: ${brief.changes}`,
    `Must remain: ${brief.keep || "Existing doors, windows and room structure."}`,
    "Treat the descriptions as room-design requests only. Produce an interior concept, not an unrelated subject, quotation or construction drawing.",
  ].join("\n");
}

export async function generateRoom({ config, photo, prompt, signal, fetcher = fetch }) {
  if (!config.enabled || !config.key) throw new Error("AI connection is not enabled.");
  if (config.provider === "huggingface") {
    const client = new InferenceClient(config.key);
    const result = await client.imageToImage(
      {
        provider: "fal-ai",
        model: config.model,
        inputs: new Blob([photo], { type: "image/jpeg" }),
        parameters: { prompt },
      },
      { signal, retry_on_error: false },
    );
    if (!(result instanceof Blob) || result.size > 15 * 1024 * 1024)
      throw new Error("Invalid image response.");
    return Buffer.from(await result.arrayBuffer());
  }
  const body = new FormData();
  body.append("model", config.model);
  body.append("image[]", new Blob([photo], { type: "image/jpeg" }), "room.jpg");
  body.append("prompt", prompt);
  body.append("n", "1");
  body.append("quality", "low");
  body.append("size", "1024x1024");
  body.append("output_format", "jpeg");
  const response = await fetcher("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.key}` },
    body,
    signal,
  });
  if (!response.ok)
    throw Object.assign(new Error("Image provider could not complete the request."), {
      status: response.status,
    });
  // Bound the response before decoding; never log the provider payload or API key.
  const parts = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > 22 * 1024 * 1024) throw new Error("Image response too large.");
    parts.push(chunk);
  }
  const data = JSON.parse(Buffer.concat(parts).toString("utf8"));
  const encoded = data.data?.[0]?.b64_json;
  if (typeof encoded !== "string" || !encoded.length) throw new Error("No image returned.");
  return Buffer.from(encoded, "base64");
}
