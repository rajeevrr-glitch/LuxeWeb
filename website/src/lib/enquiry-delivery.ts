export type EnquiryDeliveryInput = {
  kind: "quote" | "project-brief" | "partner";
  name: string;
  phone: string;
  city: string;
  message: string;
  consent: true;
  website?: string;
};

export type EnquiryDeliveryRequest = Omit<EnquiryDeliveryInput, "website"> & {
  id: string;
  website: string;
};

export type EnquiryDeliveryResult = {
  reference: string;
  state: "accepted";
};

type DeliveryFetchOptions = {
  fetch?: typeof fetch;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export const enquiryDeliveryError =
  "We could not confirm this request. Try again or contact us on WhatsApp.";

const publicReference = /^LX-\d{8}-[A-F0-9]{12}$/;

export class EnquiryDeliveryError extends Error {
  readonly reference: string;

  constructor(reference = "") {
    super(enquiryDeliveryError);
    this.name = "EnquiryDeliveryError";
    this.reference = publicReference.test(reference) ? reference : "";
  }
}

function safeReference(value: unknown): string {
  if (
    typeof value === "object" &&
    value !== null &&
    "reference" in value &&
    typeof value.reference === "string" &&
    publicReference.test(value.reference)
  )
    return value.reference;
  return "";
}

function deliveryPayload(input: EnquiryDeliveryInput) {
  return {
    kind: input.kind,
    name: input.name,
    phone: input.phone,
    city: input.city,
    message: input.message,
    consent: input.consent,
    website: input.website ?? "",
  };
}

// Retain this request in memory for retries after an uncertain response.
// Personal details and request identities must never be put in browser storage.
export function createEnquiryDeliveryRequest(
  input: EnquiryDeliveryInput,
  previous?: EnquiryDeliveryRequest | null,
  createId: () => string = () => crypto.randomUUID(),
): EnquiryDeliveryRequest {
  const payload = deliveryPayload(input);
  if (previous && JSON.stringify(deliveryPayload(previous)) === JSON.stringify(payload)) {
    return previous;
  }
  return { id: createId(), ...payload };
}

async function fetchDeliveryJson(
  path: string,
  init: RequestInit,
  options: DeliveryFetchOptions,
): Promise<{ status: number; value: unknown }> {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  else options.signal?.addEventListener("abort", onAbort, { once: true });
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 20_000);
  try {
    const response = await (options.fetch ?? fetch)(path, {
      ...init,
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    });
    const value: unknown = await response.json();
    if (controller.signal.aborted) throw new Error(enquiryDeliveryError);
    return { status: response.status, value };
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onAbort);
  }
}

export async function checkEnquiryDelivery(options: DeliveryFetchOptions = {}): Promise<boolean> {
  try {
    const { status, value } = await fetchDeliveryJson(
      "/api/enquiry-delivery/status",
      { method: "GET", headers: { Accept: "application/json" } },
      { timeoutMs: 8000, ...options },
    );
    return (
      status === 200 &&
      typeof value === "object" &&
      value !== null &&
      "enabled" in value &&
      value.enabled === true
    );
  } catch {
    return false;
  }
}

export async function submitEnquiryDelivery(
  request: EnquiryDeliveryRequest,
  options: DeliveryFetchOptions = {},
): Promise<EnquiryDeliveryResult> {
  try {
    const { status, value } = await fetchDeliveryJson(
      "/api/enquiry-delivery",
      {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(request),
      },
      options,
    );
    if (
      status !== 202 ||
      typeof value !== "object" ||
      value === null ||
      !("state" in value) ||
      value.state !== "accepted" ||
      !safeReference(value)
    ) {
      // An uncertain persisted request has a public lookup reference. Carry only
      // that validated value to a manual fallback; never forward server error text.
      throw new EnquiryDeliveryError(status === 503 || status === 409 ? safeReference(value) : "");
    }
    return { reference: safeReference(value), state: "accepted" };
  } catch (error) {
    // A timeout may follow provider acceptance. The caller retries the same UUID.
    if (error instanceof EnquiryDeliveryError) throw error;
    throw new EnquiryDeliveryError();
  }
}
