import { hostedLeadConfiguration } from "../src/lib/hosted-leads.server.ts";

const config = hostedLeadConfiguration();
const report = {
  urlConfigured: /^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(config.url),
  serverSecretConfigured: /^sb_secret_[A-Za-z0-9_-]{16,256}$/.test(config.key),
  privateSigningSecretConfigured: /^[a-f0-9]{64}$/i.test(config.secret),
  httpsSiteOriginConfigured: config.site !== null,
  enabled: config.enabled,
  databaseChecked: false,
  databaseReady: false,
  databaseHttpStatus: null,
};

if (process.argv.includes("--connect") && config.valid) {
  report.databaseChecked = true;
  try {
    // Read-only capability check. This does not create a lead or send a notification.
    const response = await fetch(config.url + "/rest/v1/rpc/luxe_lead_readiness", {
      method: "POST",
      headers: { apikey: config.key, "Content-Type": "application/json" },
      body: "{}",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    report.databaseHttpStatus = response.status;
    if (response.ok) {
      const value = await response.json();
      report.databaseReady = value?.schemaVersion === "1";
    }
  } catch {
    // Never print provider errors, database content, credentials or their prefixes.
    report.databaseReady = false;
  }
}

console.log(JSON.stringify(report, null, 2));
if (!config.valid || (report.databaseChecked && !report.databaseReady)) process.exitCode = 1;
