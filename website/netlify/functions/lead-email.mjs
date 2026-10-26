import { runLeadEmailWorker } from "../../src/lib/lead-email-worker.server.ts";

// Netlify provides this deployment context; client headers cannot enable delivery.
export function createScheduledEmailHandler(run = runLeadEmailWorker) {
  return async (_request, context) => {
    const production =
      context?.deploy?.context === "production" && context.deploy.published === true;
    const result = production
      ? await run({ environment: "production" })
      : { enabled: false, processed: 0, state: "disabled" };
    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  };
}

export default createScheduledEmailHandler();
// Scheduled functions have no public HTTP route. One queued alert per invocation.
export const config = { schedule: "*/5 * * * *" };
