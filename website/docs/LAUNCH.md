# Run, review and launch

## Daily local use

Open Start-website.cmd, or run `npm run dev` from the project. Use http://127.0.0.1:3000 in your browser. Keep its terminal open. This runs local review plus the private image/contact service. Client stories are text-only on /testimonials, without editorial notices or unapproved quotations; all project photos and films are on /projects. Proposed review wording is kept only in OWNER-INPUTS.md. The approved Diwali campaign is public content. It does not publish the site.

The root `.env.local` file is private. Gemini setup is in AI-SETUP.md. Automatic account enquiries remain disconnected in local development; forms use the labelled manual WhatsApp fallback. The older private enquiry/desk tools are retained for existing local data and tests but are not automatically started.

## Current hosted status — 27 October 2026

The published site is https://fantastic-liger-68a1da.netlify.app. Supabase intake and the private `/admin` inbox are active. Migration 003 and Resend provide queued new-lead email alerts; receipt has been confirmed at both `sales@luxeinfra.in` and `infoluxeinfra@gmail.com`. A saved enquiry and its notification are separate outcomes, so an alert failure does not remove the enquiry.

Workflow migration 004 passes staged local SQL tests and is installed on the live database; the read-only hosted readiness check returns HTTP200. `LUXE_WORKFLOW_ENABLED=true` is saved for Netlify Production only; local and preview contexts stay off. The owner confirmed the exact `/reset-password` Auth redirect URL is saved. This source includes both features; a real owner password reset and authenticated live-inbox check still need the owner's private interaction after deployment. Automatic WhatsApp, hosted Gemini conversation, hosted room contact capture and image generation remain disconnected. The setup sections below remain useful for maintenance and activation; they do not mean the already-connected intake/inbox/email services need to be recreated.

## Quality checks

Requires Node 24.x and `npm ci` when dependencies are missing.

```text
npm run typecheck
npm run lint
npm test
npm run format:check
npm run build
node scripts/verify-redesign.mjs
```

For a public-mode local check, stop development, then run `npm start` after a normal build, or use scripts/windows/Start-release.cmd. The public Node server disables the local image and enquiry pilots. It does not automatically load .env.local; production secrets belong in the selected hosting environment.

## Before publishing

- Complete OWNER-INPUTS.md: real rates/specifications, permissioned content/images, terms and approved promotions. Never publish labelled sample reviews or proposed offers as real business facts.
- Check all ten brand options against the selected specification. Confirm genuine review wording and publication consent; project photos remain unassigned rather than paired with reviewers. Keep detailed Lifetime warranty\* coverage/exclusions and Diwali gift/calculation terms available before booking.
- Luxe website guidance works without an AI account. Optional AI text chat needs its own private chat settings and account/quota checks; follow AI-SETUP.md. Never reuse an image enable flag as chat authorisation. Keep one server instance for the file-based counter, or provide a shared atomic allowance store before scaling out.
- Choose a Node-capable host, review the normal build privately, configure secure server secrets and durable private storage, and verify message receipt and failure recovery with the business team.
- Confirm privacy/retention, ingress/spend limits, backups/restore, monitoring and rollback. Follow AUTOMATIC-DELIVERY-SETUP.md before enabling WhatsApp account delivery.
- Verify physical desktop/mobile browsers, keyboard/assistive technology, links/downloads, actual email/WhatsApp receipt, HTTPS and domain/SEO behavior.
- Verify MP4 playback, seeking/range requests and mobile controls on the chosen host. Room contact capture needs a private hosted service; local records are not automatically delivered and do not expire with the image session. Arrange retention/deletion and storage monitoring before activation.
- Only after explicit launch authorization, connect the new host to luxeinfra.in. GoDaddy currently manages the domain; domain registration is separate from website hosting.

There is one working source directory and one workdone.md. Future changes update them in place. Versioned preview folders, ZIPs and handover reports are created only when requested.

## Git to Netlify import

The owner selected Netlify and the site is now published at the URL above. The repository import steps below describe how to maintain or recreate that connection. Keep domain renewals, hosting usage and external provider costs under the owner's account controls.

1. Open Desktop/LuxeWeb/website in your Git client. Push this website folder only; its package.json and netlify.toml should be at the repository root. Do not push the parent LuxeWeb folder or its Archive. Prefer a private repository for the business source.
2. Include package.json, package-lock.json, netlify.toml, vite.config.ts, tsconfig.json, src/, public/ and scripts/, with the repository's .gitignore. Git ignores local keys, .private, dependency/build outputs, Netlify state, workdone.md and internal owner/planning notes. Do not upload those private files manually through a browser.
3. In Netlify, choose Add new project → Import an existing project. Select your Git provider and the repository you just pushed. Choose the intended production branch.
4. Leave Base directory blank when the website is at the repository root. If you deliberately pushed an outer repository containing a website subfolder, set Base directory to that website folder instead. The directory must contain package.json and netlify.toml.
5. Build command: npm run build:netlify. Publish directory: dist/client. Node version: 24. These are already set in netlify.toml; the official adapter creates the server function automatically. Do not use a static Vite preset with a fallback to index.html, and do not set the functions folder to scripts/.
6. No API key or account token is needed in the repository to deploy the current public site. Keep secrets unprefixed in Netlify environment settings only when their corresponding hosted service is ready. Never copy .env.local or use VITE\_ for a secret. Do not enable VITE_CONTENT_PREVIEW or VITE_CAMPAIGN_PREVIEW.
7. Deploy first to the generated netlify.app URL. Review home, /projects, /testimonials, /callback, /estimate, /reimagine, both project films, navigation and manual WhatsApp/email links. Preview/default Netlify URLs stay noindex. Confirm the production deployment succeeds before editing domain DNS.
8. Add luxeinfra.in and www.luxeinfra.in in Netlify's domain settings when ready. Copy the exact DNS instructions shown for this project to GoDaddy, preserving email MX/TXT records. Do not use old Lovable DNS values or change nameservers unnecessarily. The committed www redirect points to the apex domain. Only HTTPS production requests on https://luxeinfra.in advertise indexing; verify /robots.txt and /sitemap.xml after domain connection.

Local deployment checks:

```text
npm ci
npm run build:netlify
node scripts/verify-redesign.mjs --netlify
```

The build checks TypeScript first and forces public content flags off. For a production-context check, set CONTEXT=production for the build process and run the verifier with --netlify --production. The context is recorded at build time because build context variables are not assumed to exist in function runtime.

The hosted gateway preserves SSR, redirects/404s, security headers, robots/sitemap and safe service statuses. Netlify's adapter prefers static assets before the SSR function, so portfolio images and films use the CDN. Keep generated .netlify and dist folders out of Git; Netlify rebuilds them from the committed source.

The current public release includes manual WhatsApp/email, built-in Ask Luxe answers and the room-fit planner, alongside connected Supabase text-enquiry saving, the private inbox and Resend business alerts. External Gemini conversation, hosted room contact capture and AI image generation still require durable private storage, shared allowance limits and hosted configuration. Adding a local key does not provide that backend or transfer private local records. Local AI settings and records remain unchanged.

### Missing package.json during a Netlify build

The owner's imported repository is https://github.com/rajeevrr-glitch/LuxeWeb, branch main. Its file listing was checked on 26 October 2026: the current app is inside website/, with website/package.json and website/netlify.toml. For this existing repository, set Base directory to website, leave Package directory unset, keep Build command npm run build:netlify and Publish directory dist/client, and use Node 24. Save and retry the deployment. The publish path is relative to website; do not enter website/dist/client. The repository root also contains historical archives and ZIP packages, which are not build inputs.

If the log says `ENOENT /opt/build/repo/package.json` and `No config file was defined`, the selected repository root does not contain the required build files. This failure happens before the website compiles. Confirm the connected repository and production branch, then open that branch in the Git provider and locate package.json and netlify.toml.

| Location in the Git repository                                | Netlify Base directory |
| ------------------------------------------------------------- | ---------------------- |
| package.json and netlify.toml at the top level                | Leave blank            |
| website/package.json and website/netlify.toml                 | website                |
| LuxeWeb/website/package.json and LuxeWeb/website/netlify.toml | LuxeWeb/website        |

Use the actual repository path, preserving capitalisation. Change Base directory in Project configuration → Developer settings → Continuous deployment → Build settings. Keep the build command `npm run build:netlify` and publish directory `dist/client`, relative to that base. Save and retry the deployment. The next log should identify the correct working directory and netlify.toml.

If package.json or netlify.toml is absent from the connected branch, push the complete source from Desktop/LuxeWeb/website using Git with its .gitignore. Do not upload private files manually. Do not upload only dist/ or compensate by changing the build command; the remote source must include the required files. The local project is not currently a Git checkout, so it does not identify which remote repository or branch was imported.

Official references checked on 26 October 2026:

- https://docs.netlify.com/build/configure-builds/overview/
- https://docs.netlify.com/build/frameworks/framework-setup-guides/tanstack-start/
- https://docs.netlify.com/build/configure-builds/manage-dependencies/
- https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/
- https://www.netlify.com/blog/introducing-netlify-free-plan/

## Backend work for full public functionality

The initial 26 October audit covered source/configuration. Since then, Supabase text-enquiry saving, the authenticated staff inbox and queued Resend business alerts have been activated on the published site. External Gemini conversation, room lead capture and image generation remain disconnected. The laptop's private files, in-memory jobs/sessions and file-based quotas cannot be used unchanged as a distributed serverless backend.

Completed foundations and remaining implementation order:

1. Complete: shared private lead database and server-side intake for popup, quote/callback, detailed-brief and partnership requests. Input/consent validation, duplicate handling and save references are active. Hosted Room Studio capture remains a separate step.
2. Complete: authenticated owner/team inbox and queued Resend new-lead alerts to sales@luxeinfra.in and infoluxeinfra@gmail.com, with receipt confirmed in both inboxes. Continue monitoring queue outcomes and checking failures privately. Visitors do not need an account for ordinary quote requests. Workflow assignment and owner password recovery are the next pending updates below.
3. Connect the WhatsApp Business Platform sender, approved notification template and consenting internal recipient. Distinguish provider acceptance from actual delivery; process signed status webhooks and prevent duplicate sends. Current manual WhatsApp remains available until the account is connected. Provider messaging charges may apply.
4. Port Gemini text chat to a hosted server API using private runtime settings, shared sessions and atomic attempt limits. Keep the existing opt-in, maintained site knowledge and quick-answer fallback.
5. Port Room Studio to private photo/result storage, expiring access, upload validation/metadata stripping and durable generation jobs. Enforce visitor ownership, contact consent, shared quotas and generation limits before the provider call. Protect against function retries generating or billing twice; recover known jobs instead of blindly repeating them. Delete expired photos/results according to the approved retention rule. Keep the existing local pilot counter and completed comparison receipt unchanged.
6. Add server-enforced abuse controls, restricted staff access, backups/restore, retention/deletion, redacted monitoring and provider usage alerts. Test saved enquiry, notification receipt/failure, duplicate submission, blocked upload, unauthorised access and restart behavior on staging before activation. Update the privacy page to describe the actual hosted arrangement.
7. Numerical estimates can be activated separately when the owner supplies an approved rate book, units, taxes, inclusions/exclusions and validity. This is a business-data dependency; it does not prevent a working request-for-quote launch.

The connected stack uses Netlify site/functions, Supabase shared Postgres/staff authentication and Resend alerts. Private image storage and durable generation jobs remain recommendations, not completed account connections. Keep service-role/provider secrets in private Netlify runtime settings. Restrict database/storage access through policies; do not expose private leads or photos in a public bucket. For image jobs, any retrying worker needs durable job locking to avoid duplicate generation or charges.

Lead saving, email alerts and staff access are now connected. Do not advertise automatic WhatsApp or hosted AI as available until those separate services are implemented and checked. Provider limits, messaging/image generation and hosting usage still need ongoing monitoring.

Official architecture references checked on 26 October 2026:

- https://docs.netlify.com/build/functions/environment-variables/
- https://docs.netlify.com/build/functions/background-functions/
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/storage/security/access-control
- https://supabase.com/pricing
- https://resend.com/docs/dashboard/domains/introduction
- https://whatsappbusiness.com/products/platform-pricing/

## Supabase lead saving: Luxe Infra / Luxe Web

The owner created Supabase organisation Luxe Infra / project Luxe Web. Obtain its Project URL from the dashboard or the private SUPABASE_URL setting rather than committing a project-specific value to this guide. Hosted intake is active for quote, callback, welcome, detailed-brief and partnership requests. It saves the existing text/contact payload, not uploaded photos/files. Its success means a private database commit with a reference, not a quotation or appointment. The connected staff inbox and email queue are separate services; Gemini chat, room contact capture/generation and automatic WhatsApp remain pending.

The owner supplied the current production website URL https://fantastic-liger-68a1da.netlify.app. Use that exact value for SITE_URL during this initial connection; change it deliberately when the custom domain becomes the canonical submission origin. It is already recorded in the private local setup for readiness checks.

### One-time database setup

1. In the Luxe Web Supabase dashboard, open SQL Editor → New query. Paste the entire committed supabase/migrations/202610260001_lead_intake.sql and Run it as the database owner. It creates private tables and restricted RPCs without dropping existing data. Running it again preserves existing leads.
   If an error mentions an inline_code_block and missing luxe_private schema, the test script may have been run before the migration. The setup file contains create schema if not exists luxe_private; the tests file does not. Open a fresh query with the complete migration rather than only a selected part or the SQL tests.
2. Keep luxe_private out of exposed API schemas. The migration enables RLS, revokes anonymous/authenticated access and permits the server service role to call only the two public functions; it cannot directly read the private tables through this configuration. Do not enable anonymous direct database writes or make customer records public.
3. Use the existing project's Secret key from Settings → API Keys. Put it only after SUPABASE*SECRET_KEY in the ignored local .env.local for a connection check, and later in Netlify environment settings. It starts sb_secret*; a Publishable key will not activate this backend. No database password or Supabase personal access token is needed for this integration.
4. Run npm run leads:check for local configuration booleans. Run npm run leads:check -- --connect for a read-only RPC check that creates no lead and sends no notification. All values printed are booleans or a numeric HTTP status; the key and provider error bodies are never printed. databaseReady must be true before enabling intake. HTTP 404 normally means the migration/RPC is missing from the API schema cache; 401/403 requires checking the credential/permissions. A network failure is reported without its raw error text.

### Netlify connection after database readiness

Push the current website source, including its new supabase/ folder and hosted-leads.server.ts, using Git's ignore rules. Keep website as the Base directory for the existing LuxeWeb repository. In Netlify's environment settings, enter these private runtime values; do not put them in netlify.toml, GitHub or VITE\_ variables:

| Variable               | Value                                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| SUPABASE_URL           | The HTTPS Project URL copied from the Supabase dashboard or private local setup                                                              |
| SUPABASE_SECRET_KEY    | The private server Secret key                                                                                                                |
| LUXE_LEADS_HMAC_SECRET | The generated 64-character hex secret in local .env.local; use the same value across function instances                                      |
| SITE_URL               | Exact current production HTTPS website origin, with no trailing slash/path; use the owner's Netlify URL until the custom domain is connected |
| LUXE_LEADS_ENABLED     | Keep false during setup; set true only after migration/readiness and the current site origin are confirmed                                   |

Redeploy after runtime settings are saved. Public database intake requires the baked production context, exact configured site origin and Netlify's trusted context.ip. Preview deployments and an unconfigured Node/local runner retain the manual fallback. The status endpoint gives an HttpOnly, Secure, SameSite=Strict signed session cookie; submissions require that cookie, same-origin JSON, bounded contact fields and explicit consent. Forwarded-IP headers supplied by a caller are not trusted. If the deployed context lacks an IP, the capability fails closed rather than bypassing rate controls.

For initial database-only setup, /api/enquiry-delivery/status should show enabled:true, channel:database, notifications.email:false and notifications.whatsapp:false. The current deployment also has email alerts connected, so its email capability differs from that initial stage; WhatsApp remains false. Confirm one clearly labelled synthetic enquiry and matching private record before treating a new deployment as connected. A timeout can follow a successful database commit; browser retries keep the same ID and return the same reference. Avoid repeated tests with real customer data and distinguish stored-lead, queued-alert and actual-receipt outcomes.

The connected `/admin` inbox is the normal way to work on enquiries. If database-owner inspection is needed, use Supabase SQL Editor privately:

```sql
select reference, created_at, kind, name, phone, city, message, status
from luxe_private.leads
order by created_at desc
limit 100;
```

No public listing endpoint exists. The authenticated inbox described below is a separate, connected service. The database enforces atomic duplicate handling, 12 enquiries per IP per rolling 10 minutes, five per phone per rolling hour, 500 total per UTC day and 10,000 retained leads. These are launch safeguards, not a spam-proof identity check. Quota keys are HMACs; raw IP addresses are not stored. All customer requests remain until managed under the agreed retention/deletion policy; expired rate events are cleaned after 24 hours. The migration does not silently delete leads. Add monitoring and an agreed retention/deletion routine before scaling.

## Private lead inbox and owner controls

The dedicated `/admin` workspace is active and separate from the public site's navigation, popup, chat and promotional content. Its initial view is the lead inbox. It reads the existing private Supabase lead records, without copying them into public files or browser storage. The owner account and migration 002 are already configured; the following steps are the setup reference, not instructions to create a duplicate owner.

### Owner account and database setup

1. In the existing Supabase project, open Authentication → Users → Add user → Create new user. Use the confirmed owner email `sales@luxeinfra.in`, choose a strong private password and enable Auto Confirm User. Keep the password out of chat, source, deployment variables and work logs. No invitation email is sent by the website.
2. Open `supabase/migrations/202610260002_lead_inbox.sql`. Copy the **entire migration** into a new Supabase SQL Editor query and run it as the database owner. The first lead-intake migration must already be installed. The second migration adds notes, follow-up dates, private memberships, login counters, minimal audit records and restricted inbox functions. It does not delete leads or change their existing reference numbers.
3. The migration binds the confirmed Auth user ID for `sales@luxeinfra.in` to the one owner seat. If it ran before the account existed, rerun the complete migration after account creation. It does not replace an existing owner or grant access merely because a browser submits that email. Later owner email/account changes require a deliberate database-owner recovery procedure.
4. Run `npm run inbox:check -- --connect` locally. This performs a read-only readiness RPC and prints booleans plus HTTP status, never credentials or lead data. Require `databaseReady:true` and `ownerConfigured:true` before enabling the workspace. A 404 indicates that the second migration is missing or the schema cache has not refreshed. It does not mean the first lead-intake setup must be rerun.

### Netlify activation

Keep the existing server-only `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `LUXE_LEADS_HMAC_SECRET` and exact HTTPS `SITE_URL`. Add `LUXE_INBOX_ENABLED=true` as a server environment variable and deploy the current source. Never use a `VITE_` prefix for inbox settings or credentials. Leave `LUXE_INBOX_LOCAL` unset/false on Netlify. Production requires the trusted Netlify context IP and exact configured website origin; preview deployments stay disconnected.

Visit the production website's `/admin` address directly and sign in using the owner account. No owner password is supplied to the build or stored in an environment file. The public site continues to collect enquiries independently when the inbox is disabled.

Local review stays at `http://127.0.0.1:3000/admin`. Its setup screen works without account credentials. To connect the actual private inbox during local development, explicitly set both `LUXE_INBOX_ENABLED=true` and `LUXE_INBOX_LOCAL=true` in ignored `.env.local`, keep the production HTTPS `SITE_URL` and run `npm run dev`. Local access accepts only loopback request origins and socket addresses, uses a separate encrypted HttpOnly cookie, and does not work over a LAN address. Normal `npm start` public review need not load private settings. Local access is optional and disabled by default.

### Inbox and master owner controls

- Inbox: newest-first enquiries, search, status/type filters, 25-record pages, full requirements, click-to-call, an explicitly clicked WhatsApp link, internal notes and follow-up dates. Dates display in IST; follow-up editing uses the device's local timezone as labelled. Status choices remain New, Contacted, Qualified and Closed. Scheduled dates show due flags; automatic reminder messages are not connected.
- Concurrent edits: the server compares the exact saved update timestamp. A conflicting save retains the user's edits and offers an explicit reload; it does not silently overwrite another team member's work. Unsaved edits require confirmation before leaving the detail view.
- Owner overview: total/new/contacted/qualified/closed enquiry counts and due follow-ups. These are lead counts, not visitor analytics or revenue projections.
- Team access: the owner can approve/reactivate or disable existing confirmed staff accounts by email. Create each staff Auth account privately in Supabase first. Staff may work on all leads, but cannot manage memberships or view the owner's team/audit screen. The owner seat cannot be disabled or replaced through the interface. The workspace supports up to 100 total memberships, including inactive accounts; expansion requires a deliberate migration.
- Activity history: recent lead updates and staff-access changes, with actor, time and reference. Full customer messages, notes, passwords, tokens and raw IP addresses are not copied into audit records. No leads are deleted or exported through this initial inbox.
- Authentication: Supabase verifies each user, then a server-only RPC verifies active private membership on every protected request. Session cookies contain only an encrypted access token and CSRF state; no refresh token is retained. Cookies are HttpOnly, Secure in production and SameSite=Strict. Sessions last at most 30 minutes and then require a fresh login. Mutations require exact Origin and CSRF, bounded JSON and trusted IP context. Login attempts are limited to 10/IP/15 minutes and 500 overall/hour with durable, hashed-IP counters. These controls are separate from the connected Resend alert queue; they do not claim MFA, WhatsApp alerts, visitor tracking or a full website CMS.

### Lead workflow: migration 004

Migration `supabase/migrations/202610270004_lead_workflow.sql` and its staged disposable-database tests pass locally. The owner applied the setup successfully and the hosted readiness check passes; the Production flag is saved. Deploy this source to use the workflow. Existing leads remain unassigned; migration 004 does not create accounts, send alerts or change staff access.

1. In the existing Supabase project, confirm migrations 001, 002 and 003 are installed. Open a **fresh SQL Editor query**, paste the entire `supabase/migrations/202610270004_lead_workflow.sql` setup file and run it as the database owner. Do not run `supabase/tests/lead_workflow.sql` on the live project. The setup migration can be reapplied without deleting leads.
2. Run `npm run workflow:check -- --connect` using the existing private local server settings. It checks configuration and the workflow readiness RPC/schema version only. It does not read customer records, assign leads or send an email. Require `serverConfigurationReady:true`, `databaseChecked:true` and `databaseReady:true`; a missing RPC/schema-cache issue must be resolved before activation.
3. Deploy the current workflow source. Set the server-only production variable `LUXE_WORKFLOW_ENABLED=true` in Netlify **only after readiness succeeds**, then redeploy so the runtime receives the setting. The flag defaults to false; installing SQL alone does not activate the UI. Keep existing intake, inbox and email settings intact. Never use a `VITE_` prefix for this flag or secrets.
4. In `/admin`, check Today, overdue, no follow-up, unassigned and My enquiries filters. **Today uses the Asia/Kolkata calendar day (IST)**; overdue includes open leads with a follow-up time before now, so a lead can appear in both Today and overdue. Closed leads stay outside workflow counts. Filters apply before the 25-record pagination.
5. The owner can assign or clear responsibility for an active confirmed inbox member. Assignment is a responsibility label, not a private-access rule: approved staff retain shared access to all leads and may update status, notes and follow-ups. Staff cannot change assignment. An inactive, banned, deleted, unconfirmed or changed-identity assignee is treated as unassigned until the owner reassigns it or valid access is restored. Assignment does not enable extra email or WhatsApp notifications.

Keep `LUXE_WORKFLOW_ENABLED=false` if activation is not ready; the existing lead inbox and Resend queue continue independently. SQL tests are explicitly guarded for a disposable database and must never be used as a production setup query.

### Owner password recovery

The `/reset-password` owner recovery flow is included in this source and has passed offline security tests and a browser check with an expired synthetic link. A **real completed owner reset and sign-in still require the owner**. It also handles older recovery links whose token fragment lands on the homepage, routing them to the private reset page without putting tokens in ordinary enquiry forms. The owner confirmed the exact Auth redirect URL below is saved.

1. In Supabase Authentication → URL Configuration, add this exact allowed Redirect URL: `https://fantastic-liger-68a1da.netlify.app/reset-password`. Keep `SITE_URL` aligned with that same published HTTPS origin. When moving to luxeinfra.in, deliberately update the exact redirect allowlist and server origin together. Do not use a broad wildcard just to make a recovery link work.
2. Deploy the current recovery route and server handlers before requesting a new link. Auth recovery email delivery is separate from the connected Resend new-lead alert queue; successful business alerts do not prove password-reset email delivery.
3. The owner opens the live `/reset-password` page, requests a link for `sales@luxeinfra.in` and uses the newest email. Open it on the same intended live website; check Spam/Junk if necessary. An incomplete or expired link requires a fresh request. No public signup or staff approval is granted by recovery.
4. The owner privately enters and confirms a unique password of at least 12 characters on the reset page, then signs in again at `/admin`. Never paste the password, full reset URL or token into chat, source, environment variables or logs. Existing leads, notes and memberships remain intact.

Confirm the exact live redirect, email receipt, password update and subsequent owner login before marking recovery complete. Do not record a reset as verified merely because the local route builds or the request screen appears.

The disposable SQL tests in `supabase/tests/lead_inbox.sql` are **tests only**, not setup, and must not be run against production. They isolate fixtures in a rollback transaction. Do not expose the private schema or grant direct lead-table access to anonymous/authenticated clients to make the UI work.

The SQL tests in supabase/tests/lead_intake.sql are for a disposable database only, with rollback. They cover restricted access, idempotency/conflicts, rate/capacity limits and timestamps. The implementation was also checked locally against an in-memory Postgres-compatible database; that does not replace the actual Supabase readiness and deployed form checks.

References:

- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/docs/guides/database/functions
- https://docs.netlify.com/build/functions/api/

### Netlify secret scan flags a configured project URL

If compilation and function packaging succeed but the secret scan reports SUPABASE_URL in this guide, update the repository with the current generic guide and deploy again. The Project URL is an address, not the server Secret key, but Netlify scans any value that was explicitly marked secret. Keep deployment-specific values in private runtime settings so this guide does not trigger that match. No scanner exclusion, key rotation or change to working runtime values is required for this documentation-only case. Do not disable secret scanning to bypass a genuine credential finding.
