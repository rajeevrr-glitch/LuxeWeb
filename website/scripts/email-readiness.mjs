import { emailAlertConfiguration } from "../src/lib/lead-email-worker.server.ts";

const config = emailAlertConfiguration();
const report = {
  serverConfigurationReady: config.valid,
  leadSavingEnabled: config.lead.enabled,
  emailAlertsEnabled: config.enabled,
  databaseChecked: false,
  databaseReady: false,
  databaseHttpStatus: null,
  domainVerification: "Check the Resend dashboard; no email is sent by this check.",
};
if (process.argv.includes("--connect") && config.lead.valid) {
  report.databaseChecked = true;
  try {
    const response = await fetch(config.lead.url + "/rest/v1/rpc/luxe_email_readiness", {
      method: "POST",
      headers: { apikey: config.lead.key, "Content-Type": "application/json" },
      body: "{}",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    report.databaseHttpStatus = response.status;
    if (response.ok) report.databaseReady = (await response.json())?.schemaVersion === "1";
  } catch {
    // Never print credentials, customer data or raw provider responses.
  }
}
console.log(JSON.stringify(report, null, 2));
if (!config.valid || (report.databaseChecked && !report.databaseReady)) process.exitCode = 1;
