import { hostedLeadConfiguration } from "../src/lib/hosted-config.server.ts";

const config = hostedLeadConfiguration();
const report = {
  serverConfigurationReady: config.valid,
  workflowEnabled: process.env.LUXE_WORKFLOW_ENABLED === "true",
  databaseChecked: false,
  databaseReady: false,
  databaseHttpStatus: null,
};
if (process.argv.includes("--connect") && config.valid) {
  report.databaseChecked = true;
  try {
    const response = await fetch(config.url + "/rest/v1/rpc/luxe_inbox_workflow_readiness", {
      method: "POST",
      headers: { apikey: config.key, "Content-Type": "application/json" },
      body: "{}",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    report.databaseHttpStatus = response.status;
    if (response.ok) report.databaseReady = (await response.json())?.schemaVersion === "1";
  } catch {
    // Never print private credentials, raw provider errors or customer records.
  }
}
console.log(JSON.stringify(report, null, 2));
if (!config.valid || (report.databaseChecked && !report.databaseReady)) process.exitCode = 1;
