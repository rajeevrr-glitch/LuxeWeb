import { hostedLeadConfiguration } from "../src/lib/hosted-config.server.ts";
import { trafficDailyLimit } from "../src/lib/hosted-traffic.server.ts";

const config = hostedLeadConfiguration();
const limit = trafficDailyLimit();
const report = {
  serverConfigurationReady: config.valid && limit !== null,
  trafficEnabled: process.env.LUXE_TRAFFIC_ENABLED === "true",
  dailyLimit: limit,
  databaseChecked: false,
  databaseReady: false,
  databaseHttpStatus: null,
};
if (process.argv.includes("--connect") && report.serverConfigurationReady) {
  report.databaseChecked = true;
  try {
    const response = await fetch(config.url + "/rest/v1/rpc/luxe_traffic_readiness", {
      method: "POST",
      headers: { apikey: config.key, "Content-Type": "application/json" },
      body: "{}",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
    report.databaseHttpStatus = response.status;
    if (response.ok) report.databaseReady = (await response.json())?.schemaVersion === "1";
  } catch {
    /* No credentials, raw provider messages or visitor records are logged. */
  }
}
console.log(JSON.stringify(report, null, 2));
if (!report.serverConfigurationReady || (report.databaseChecked && !report.databaseReady))
  process.exitCode = 1;
