type Environment = Record<string, string | undefined>;

function origin(value: string | undefined): string | null {
  try {
    const parsed = new URL(value ?? "");
    return parsed.protocol === "https:" && parsed.origin === value ? parsed.origin : null;
  } catch {
    return null;
  }
}

/** Shared server-only account configuration, without reading or exporting browser settings. */
export function hostedLeadConfiguration(env: Environment = process.env) {
  const url = env.SUPABASE_URL ?? "";
  const key = env.SUPABASE_SECRET_KEY ?? "";
  const secret = env.LUXE_LEADS_HMAC_SECRET ?? "";
  const site = origin(env.SITE_URL) ?? origin(env.URL);
  const valid =
    /^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(url) &&
    /^sb_secret_[A-Za-z0-9_-]{16,256}$/.test(key) &&
    /^[a-f0-9]{64}$/i.test(secret) &&
    site !== null;
  return { valid, enabled: env.LUXE_LEADS_ENABLED === "true", url, key, secret, site };
}
