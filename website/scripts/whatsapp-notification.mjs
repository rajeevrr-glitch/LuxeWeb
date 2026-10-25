// Server-only adapter. Import from the production server, never from browser code.
// The approved template must have six positional BODY text variables, in order:
// reference, request kind, customer name, customer phone, city, request summary.
// Save the complete request privately before calling this summary notification.
const REQUEST_TIMEOUT_MS = 15_000;
const SUMMARY_SUFFIX = " Summary only; full request saved under reference.";

function configuration(env) {
  const read = (name) => (typeof env[name] === "string" ? env[name].trim() : "");
  const token = read("LUXE_WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = read("LUXE_WHATSAPP_PHONE_NUMBER_ID");
  const recipient = read("LUXE_WHATSAPP_RECIPIENT").replace(/^\+/, "");
  const template = read("LUXE_WHATSAPP_TEMPLATE");
  const language = read("LUXE_WHATSAPP_LANGUAGE");
  const version = read("LUXE_WHATSAPP_GRAPH_VERSION");
  if (
    !/^[\x21-\x7e]{16,4096}$/.test(token) ||
    !/^\d{5,30}$/.test(phoneNumberId) ||
    !/^[1-9]\d{7,14}$/.test(recipient) ||
    !/^[a-z0-9_]{1,512}$/.test(template) ||
    !/^[a-z]{2,3}(?:_[A-Z]{2})?$/.test(language) ||
    !/^v[1-9]\d{0,2}\.\d{1,2}$/.test(version)
  )
    return null;
  return { token, phoneNumberId, recipient, template, language, version };
}

// Readiness exposes no tokens, account identifiers, or recipient details.
export function whatsappConfigurationReady(env = process.env) {
  return configuration(env) !== null;
}

function notificationError(uncertain) {
  const error = new Error(
    uncertain
      ? "WhatsApp notification status could not be confirmed."
      : "WhatsApp notification could not be submitted.",
  );
  error.deliveryState = uncertain ? "uncertain" : "failed";
  error.uncertain = uncertain;
  return error;
}

function singleLine(value, fallback = "Not provided") {
  if (typeof value !== "string") return fallback;
  return value.replace(/[\s\p{Cc}]+/gu, " ").trim() || fallback;
}

function bounded(value, maximum, fallback) {
  const line = singleLine(value, fallback);
  if (line.length <= maximum) return line;
  // Bound UTF-16 units conservatively without cutting an emoji/surrogate pair.
  let clipped = "";
  for (const character of line) {
    if (clipped.length + character.length > maximum - 1) break;
    clipped += character;
  }
  return `${clipped}…`;
}

function bodyParameters({ reference, kind, name, phone, city, message }) {
  // Do not shorten a lookup reference: it must match the privately saved request.
  if (
    typeof reference !== "string" ||
    !/^[A-Za-z0-9_-]{1,64}$/.test(reference) ||
    typeof message !== "string" ||
    !message.trim()
  )
    throw notificationError(false);
  const summary = bounded(message, 400 - SUMMARY_SUFFIX.length, "No summary") + SUMMARY_SUFFIX;
  return [
    reference,
    bounded(kind, 40, "Website request"),
    bounded(name, 80),
    bounded(phone, 32),
    bounded(city, 100),
    summary,
  ].map((text) => ({ type: "text", text }));
}

/**
 * Returns null until every server-only setting is supplied and valid.
 * Success means Meta accepted a message, not that WhatsApp delivered/read it.
 * There are no automatic retries: a network failure can follow acceptance.
 */
export function createWhatsAppNotifier(env = process.env, { fetchImpl = fetch } = {}) {
  const config = configuration(env);
  if (!config) return null;
  if (typeof fetchImpl !== "function") throw notificationError(false);
  const endpoint = `https://graph.facebook.com/${config.version}/${config.phoneNumberId}/messages`;

  return async function notify(request) {
    const parameters = bodyParameters(request ?? {});
    const controller = new AbortController();
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(notificationError(true));
      }, REQUEST_TIMEOUT_MS);
    });

    try {
      return await Promise.race([
        timeout,
        (async () => {
          let response;
          try {
            response = await fetchImpl(endpoint, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${config.token}`,
                "Content-Type": "application/json",
              },
              redirect: "error",
              signal: controller.signal,
              body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: config.recipient,
                type: "template",
                template: {
                  name: config.template,
                  language: { code: config.language },
                  components: [{ type: "body", parameters }],
                },
              }),
            });
          } catch {
            // Never forward provider text or a fetch error that could contain secrets.
            throw notificationError(true);
          }

          if (!response || !Number.isInteger(response.status)) throw notificationError(true);
          if (response.status < 200 || response.status >= 300)
            throw notificationError(!(response.status >= 400 && response.status < 500));

          let result;
          try {
            result = await response.json();
          } catch {
            throw notificationError(true);
          }
          const providerMessageId = result?.messages?.[0]?.id;
          if (
            result?.messaging_product !== "whatsapp" ||
            typeof providerMessageId !== "string" ||
            !/^wamid\.[A-Za-z0-9._=+/-]{1,500}$/.test(providerMessageId)
          )
            throw notificationError(true);
          return { providerMessageId };
        })(),
      ]);
    } finally {
      clearTimeout(timer);
    }
  };
}
