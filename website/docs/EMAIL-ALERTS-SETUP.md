# Internal lead email alerts

New enquiries remain saved in Supabase even if email is unavailable. Alerts go only to `sales@luxeinfra.in` and `infoluxeinfra@gmail.com`; there is no customer email or historical backfill.

## Connect Resend

1. In Resend, add `alerts.luxeinfra.in`. Use the exact DNS records shown for this account and region. Add only the required verification/sending records in GoDaddy. Preserve existing website, mailbox, root SPF and DMARC records. Do not enable receiving.
2. Wait until Resend shows the domain verified. Disable open/click tracking for these internal alerts if available.
3. Create a Sending access API key scoped to this sending domain. Save it privately as `RESEND_API_KEY` in ignored `.env.local` and in Netlify Production environment variables. Never add it to Git, browser code or chat.
4. Set `LUXE_EMAIL_FROM` to `LuxeInfra <leads@alerts.luxeinfra.in>` and `LUXE_EMAIL_DAILY_LIMIT` to `80`. Keep `LUXE_EMAIL_ALERTS_ENABLED=false` until the checks and requested test are complete.

## Database and deployment

Run `supabase/migrations/202610260003_lead_notifications.sql` in Supabase SQL Editor after migrations 001 and 002. It adds restricted private tables/functions and a new-lead trigger; it preserves existing leads and does not queue them retrospectively. It is safe to rerun the setup.

Run `npm run email:check -- --connect`. It prints only configuration/readiness flags and status, never keys or customer data. A sending-only key cannot list domains; verify domain status in the Resend dashboard. The readiness check does not authenticate the key with Resend or send mail.

Deploy the code using the existing Netlify base directory `website`. The `lead-email` scheduled function runs every five minutes on the published production deployment, handling one alert per run. Preview deployments never send; there is no public send endpoint. Keep the enabling variable in Production only. A verified domain, valid key, enabled lead saving and `LUXE_EMAIL_ALERTS_ENABLED=true` are all required for a send.

After approval for one clearly labelled internal test, enable in Production and submit one test enquiry. Check its reference in the private inbox, the Email alerts status and both destination inboxes. Provider acceptance does not prove inbox delivery. Do not send a separate test through Resend onboarding as well.

## Operation and limits

The durable outbox freezes the email and idempotency key before contacting Resend. The same payload/key is reused after uncertain failures. Atomic leases prevent concurrent workers; retries stop before Resend’s 24-hour deduplication window expires. Jobs needing review are not automatically resent. Inspect Resend’s email record before considering a manual follow-up.

The default budget is 80 recipient emails per UTC day: at two recipients per alert, at most 40 newly reserved alerts. Retries reuse the existing reservation. This is a conservative application limit, not a billing cap, and other use of the Resend account also counts toward its allowance. Check current provider limits in the account. There is no backfill, file upload, automatic WhatsApp alert or follow-up reminder.

Before changing `SITE_URL` to the custom domain, drain queued/frozen alerts. Old frozen inbox links otherwise cause manual review, preserving the original payload rather than resending changed content under an existing key.

To pause sending, set `LUXE_EMAIL_ALERTS_ENABLED=false` in Netlify and redeploy. Leads continue to save. Queued alerts older than 24 hours expire; uncertain prepared sends older than 23 hours require review. No automatic retry button is provided.

Official references: [domain verification](https://resend.com/docs/dashboard/domains/introduction), [idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys), [scheduled Netlify functions](https://docs.netlify.com/build/functions/scheduled-functions/).
