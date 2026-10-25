import { business } from "./business.ts";

export function whatsappRequestUrl(message: string) {
  return `${business.whatsapp}?text=${encodeURIComponent(message)}`;
}

// Call only from a validated, explicit visitor action, never from a render/effect.
// Click-to-chat prepares a draft; it cannot confirm that the visitor sent it.
export function openWhatsAppRequest(
  message: string,
  open: (url: string, target: string, features: string) => unknown = (url, target, features) =>
    window.open(url, target, features),
) {
  try {
    open(whatsappRequestUrl(message), "_blank", "noopener,noreferrer");
  } catch {
    // Keep the on-page link available when an embedded browser blocks new tabs.
  }
}
