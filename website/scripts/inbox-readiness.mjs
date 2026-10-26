import { hostedLeadConfiguration } from "../src/lib/hosted-leads.server.ts";

const config = hostedLeadConfiguration();
const report = {
  serverConfigurationReady: config.valid,
  enabled: process.env.LUXE_INBOX_ENABLED === "true",
  localAccessEnabled: process.env.LUXE_INBOX_LOCAL === "true",
  databaseChecked: false,
  databaseReady: false,
  ownerConfigured: false,
  databaseHttpStatus: null,
};

if (process.argv.includes("--connect") && config.valid) {
  report.databaseChecked = true;
  try {
    const response = await fetch(config.url + "/rest/v1/rpc/luxe_inbox_readiness", {
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
      report.ownerConfigured = value?.ownerConfigured === true;
    }
  } catch {
    // Credentials, provider errors and private records are never printed.
  }
}

console.log(JSON.stringify(report, null, 2));
if (!config.valid || (report.databaseChecked && (!report.databaseReady || !report.ownerConfigured)))
  process.exitCode = 1;
