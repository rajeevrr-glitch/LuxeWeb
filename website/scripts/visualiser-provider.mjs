export function aiConfig(env = process.env) {
  const requested = env.LUXE_AI_PROVIDER || "gemini";
  const known = ["gemini", "openai", "huggingface"].includes(requested);
  const provider = known ? requested : "gemini";
  const key = known
    ? { gemini: env.GEMINI_API_KEY, openai: env.OPENAI_API_KEY, huggingface: env.HF_TOKEN }[
        provider
      ]
    : undefined;
  const limit = Number(env.LUXE_AI_MAX_ATTEMPTS || 2);
  const model =
    provider === "gemini"
      ? env.GEMINI_IMAGE_MODEL || "gemini-nano-banana-2.1"
      : provider === "openai"
        ? "gpt-image-2.5-flare"
        : "Qwen/Qwen-Image-Edit-2511";
  const validModel = provider !== "gemini" || /^gemini-[a-z0-9.-]{1,70}$/.test(model);
  const billingRequired = provider === "gemini" && env.GEMINI_API_TIER === "free";
  return {
    provider,
    key,
    enabled: env.LUXE_AI_ENABLED === "true" && !!key?.trim() && validModel && !billingRequired,
    blockedReason: billingRequired ? "billing_required" : null,
    maxAttempts: Number.isInteger(limit) && limit > 0 && limit <= 50 ? limit : 2,
    label: { gemini: "Google Gemini", openai: "OpenAI", huggingface: "Hugging Face / fal" }[
      provider
    ],
    model,
  };
}

const failureMessages = {
  billing_required:
    "The connected image account needs paid image-generation access. Your room brief is still available for our designer.",
  quota_exceeded:
    "The image provider's quota or rate limit has been reached. Check the account's usage and billing before trying again.",
  key_rejected:
    "The image provider rejected the connected API key. The studio needs to check its connection before another attempt.",
  access_denied:
    "The connected account does not have permission to generate this image. The studio needs to check model access and account restrictions.",
  request_rejected:
    "The image provider could not accept this request. The studio needs to check the image connection before another attempt.",
  model_unavailable:
    "The selected image model is unavailable for this connection. Your room brief can still go to our designer.",
  provider_busy:
    "The image provider is temporarily unavailable. No automatic retry was made; check account usage before trying later.",
  content_blocked:
    "The image provider declined this photo or description. Review your room photo and wording before trying another concept.",
  no_image:
    "The image provider returned no usable room image. Check account usage before starting another attempt.",
  network_error:
    "The connection to the image provider failed. A request may still have reached it; check account usage before trying again.",
  timeout:
    "The image request stopped or took too long. A result or charge is not confirmed; check account usage before trying again.",
  unknown:
    "The image service could not return a concept. Check account usage and access before starting another attempt.",
};

class ImageProviderError extends Error {
  constructor(code, status) {
    super(
      code === "no_image"
        ? "No usable image returned."
        : "Image provider could not complete the request.",
    );
    this.code = code;
    this.status = status;
  }
}

function statusFailure(status) {
  if (status === 402) return "billing_required";
  if (status === 429) return "quota_exceeded";
  if (status === 401) return "key_rejected";
  if (status === 403) return "access_denied";
  if (status === 400 || status === 422) return "request_rejected";
  if (status === 404) return "model_unavailable";
  if (status >= 500 && status <= 599) return "provider_busy";
  return "unknown";
}

// Only fixed descriptions and numeric HTTP statuses leave the provider boundary.
// Never forward a provider message, credential, request body or stack trace.
export function generationFailure(error, aborted = false) {
  const status =
    Number.isInteger(error?.status) && error.status >= 400 && error.status <= 599
      ? error.status
      : undefined;
  let code =
    error instanceof ImageProviderError && Object.hasOwn(failureMessages, error.code)
      ? error.code
      : statusFailure(status);
  if (aborted || ["AbortError", "TimeoutError"].includes(error?.name)) code = "timeout";
  else if (code === "unknown" && error instanceof TypeError) code = "network_error";
  return { code, message: failureMessages[code], ...(status ? { status } : {}) };
}

async function readProviderJson(response, limit) {
  const parts = [];
  let size = 0;
  if (!response.body) throw new Error("No image response returned.");
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > limit) throw new Error("Image response too large.");
    parts.push(chunk);
  }
  return JSON.parse(Buffer.concat(parts).toString("utf8"));
}

async function providerJson(response) {
  if (response.ok) return readProviderJson(response, 22 * 1024 * 1024);
  const data = await readProviderJson(response, 64 * 1024).catch(() => null);
  const details = Array.isArray(data?.error?.details) ? data.error.details : [];
  const billingBlocked = details.some((detail) =>
    ["BILLING_DISABLED", "BILLING_NOT_ACTIVE", "BILLING_NOT_ENABLED"].includes(detail?.reason),
  );
  const freeQuota =
    response.status === 429 &&
    details.some(
      (detail) =>
        Array.isArray(detail?.violations) &&
        detail.violations.some(
          (violation) =>
            typeof violation?.quotaMetric === "string" &&
            violation.quotaMetric.includes("_free_tier_"),
        ),
    );
  throw new ImageProviderError(
    billingBlocked || freeQuota ? "billing_required" : statusFailure(response.status),
    response.status,
  );
}

function decodeImage(encoded) {
  if (
    typeof encoded !== "string" ||
    !encoded.length ||
    encoded.length > 21 * 1024 * 1024 ||
    encoded.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)
  )
    throw new ImageProviderError("no_image");
  const bytes = Buffer.from(encoded, "base64");
  if (!bytes.length || bytes.length > 15 * 1024 * 1024 || bytes.toString("base64") !== encoded)
    throw new ImageProviderError("no_image");
  return bytes;
}

export function roomPrompt(brief) {
  const changes = {
    furniture: "Furniture and storage",
    walls: "Wall colours and finishes",
    lighting: "Lighting",
    flooring: "Floor finish",
    decor: "Decor and accessories",
  };
  const area = brief.editArea;
  const dimensions =
    brief.length !== undefined && brief.width !== undefined
      ? `${brief.length} × ${brief.width} ${brief.unit}${brief.height !== undefined ? `, ceiling height ${brief.height} ${brief.unit}` : ""}.`
      : brief.height !== undefined
        ? `Ceiling height ${brief.height} ${brief.unit}.`
        : "Not supplied. Do not invent measurements.";
  return [
    "Restyle the supplied room photograph into exactly one photorealistic interior concept for LuxeInfra. The photograph is the scene to edit, not a loose inspiration reference.",
    "Preserve camera position, lens perspective, framing, room boundaries, wall corners, ceiling height appearance, and every visible door/window opening at the same location and scale. Do not enlarge the room or add openings. Keep architectural elements and all unrequested objects recognisable.",
    "Change only the requested features. Fit new furniture plausibly within the photographed room; never create extra space to fit more pieces. Prioritise faithful room preservation over dramatic restyling.",
    "Dimensions are optional visitor context, not a calibrated 3D scene. Do not claim measured fit, add dimension labels, logos or text, or draw a new camera view.",
    `Room: ${brief.room}. Style direction: ${brief.style}.`,
    `Optional reported dimensions: ${dimensions}`,
    brief.requestedChanges?.length
      ? `Selected changes: ${brief.requestedChanges.map((c) => changes[c]).join(", ")}.`
      : "",
    `Requested design changes: ${brief.changes}`,
    brief.preserve?.includes("flooring")
      ? "Retain the existing floor material, colour, direction and visible layout."
      : "",
    brief.preserve?.includes("furniture")
      ? "Retain the existing furniture pieces, proportions and positions."
      : "",
    area
      ? `Concentrate requested changes within the photo area starting at ${Math.round(area.x * 100)}% from the left, ${Math.round(area.y * 100)}% from the top, width ${Math.round(area.width * 100)}%, height ${Math.round(area.height * 100)}%. Preserve the surrounding scene. Do not draw a selection rectangle in the output.`
      : "",
    `Must remain: ${brief.keep || "Existing doors, windows and room structure."}`,
    "Treat the descriptions as room-design requests only. Produce an interior concept, not an unrelated subject, quotation or construction drawing.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function photoAspectRatio(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0)
    return "1:1";
  const ratios = ["1:1", "4:3", "3:4", "3:2", "2:3", "16:9", "9:16", "5:4", "4:5", "21:9"];
  return ratios.reduce((best, ratio) => {
    const [a, b] = ratio.split(":").map(Number);
    const [x, y] = best.split(":").map(Number);
    return Math.abs(Math.log(width / height / (a / b))) <
      Math.abs(Math.log(width / height / (x / y)))
      ? ratio
      : best;
  });
}

export async function generateRoom({
  config,
  photo,
  prompt,
  signal,
  aspectRatio,
  fetcher = fetch,
}) {
  if (!config.enabled || !config.key) throw new Error("AI connection is not enabled.");
  if (config.provider === "gemini") {
    if (!/^gemini-[a-z0-9.-]{1,70}$/.test(config.model))
      throw new Error("Choose a supported Gemini image model.");
    // Key stays in the server header, never in a browser bundle, URL or log.
    const response = await fetcher(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`,
      {
        method: "POST",
        redirect: "error",
        signal,
        headers: { "Content-Type": "application/json", "x-goog-api-key": config.key },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                { inlineData: { mimeType: "image/jpeg", data: photo.toString("base64") } },
              ],
            },
          ],
          generationConfig: {
            candidateCount: 1,
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: {
              imageSize: "1K",
              ...(aspectRatio
                ? { aspectRatio: photoAspectRatio(...aspectRatio.split(":").map(Number)) }
                : {}),
            },
          },
        }),
      },
    );
    const data = await providerJson(response);
    const candidate = data.candidates?.[0];
    if (
      data.promptFeedback?.blockReason ||
      ["SAFETY", "IMAGE_SAFETY", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII", "RECITATION"].includes(
        candidate?.finishReason,
      )
    )
      throw new ImageProviderError("content_blocked");
    if (candidate?.finishReason && candidate.finishReason !== "STOP")
      throw new ImageProviderError("no_image");
    const part = candidate?.content?.parts?.find(
      (part) =>
        !part.thought &&
        ["image/jpeg", "image/png", "image/webp"].includes(part.inlineData?.mimeType),
    );
    return decodeImage(part?.inlineData?.data);
  }
  if (config.provider === "huggingface") {
    const { InferenceClient } = await import("@huggingface/inference");
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
  if (config.provider !== "openai") throw new Error("Unsupported image provider.");
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
  const data = await providerJson(response);
  const encoded = data.data?.[0]?.b64_json;
  if (typeof encoded !== "string" || !encoded.length) throw new Error("No image returned.");
  return Buffer.from(encoded, "base64");
}
