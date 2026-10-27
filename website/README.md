# LuxeInfra website

Open **Start-website.cmd**, then visit **http://127.0.0.1:3000**. Keep the terminal running while you browse. This is local development, not a published site. Client stories have a dedicated text-only page, without editorial notices or unapproved quotations. Proposed wording is kept in the existing owner-input notes, outside the website. Project photographs and films live under **Our work**. The owner-approved Diwali campaign is public content.

Desktop/LuxeWeb/website opens this active project folder. It is a folder link, so there is one working copy. Older source backups, notes and evidence are organised under Desktop/LuxeWeb/Archive.

The published website is [luxeinfra.in](https://luxeinfra.in). GoDaddy keeps domain registration and DNS; Netlify hosts the website with HTTPS; www and the former default Netlify hostname redirect to the apex domain. Supabase enquiry saving, the private lead inbox and queued Resend new-lead alerts are active; receipt has been confirmed at both business email inboxes. The spreadsheet inbox, assignment views and owner password recovery route are deployed. Migration 005 for aggregate site traffic is installed and its hosted readiness check passes; the traffic flag is saved for Production only. The owner-only Site traffic tab is live. Automatic WhatsApp and hosted Gemini features remain disconnected.

Service coverage names **Ghaziabad and Noida** explicitly within Delhi NCR, alongside Uttar Pradesh and Bengaluru. Public coverage text and region labels come from `src/lib/business.ts`; submitted region values stay unchanged so quotes and estimates continue to work.

## Gemini image key

Add it only to the private `.env.local` file beside package.json, after `GEMINI_API_KEY=`. Do not post it in chat or add it to `.env.example`. Follow [AI setup](docs/AI-SETUP.md) to check configuration and enable a limited local trial. `npm run ai:check` prints no key and makes no provider request.

## Luxe chat

Ask Luxe provides site-specific guidance in English, Hindi and Hinglish. Quick answers work without an API call; optional Gemini conversation is connected locally after one owner-approved successful text test. Visitors choose Start an AI conversation before sending a question to Google. The updated chat includes the approved Diwali campaign, business figures and qualified warranty wording. The separate key stays in private `.env.local`; never paste it into chat. Image settings remain separate. See [AI setup](docs/AI-SETUP.md).

The homepage keeps the main room photograph and simple quote/design links. The project choices are inside the welcome popup, which becomes ready ten seconds after arrival without requiring a scroll. It appears once per tab session and defers while a visitor is typing, using another dialog/menu or viewing a background tab. Get a quote can reopen it on browsing pages.

## Full home renovation estimates

The owner-approved full home renovation packages are **Essential** (Affordable and practical), **Signature** (Best balance of quality and price), and **Luxe** (Premium finish and experience). After size, the visitor chooses a package. Customer-facing screens, chat and request summaries show the package and calculated total starting budget with **+**, without displaying unit rates or multiplication formulas. Approved calculation values remain unchanged. Home carpet area/size band describes the property separately; BHK and size bands do not substitute for the explicitly entered work area.

The calculator is in its early stages; the final price will be quoted after a site visit. These rates do not price modular interiors, selected-room work or commercial spaces. Detailed material specifications, inclusions/exclusions, tax treatment and offer-calculation rules still require owner input; do not infer them or automatically apply the Diwali discount.

## Folder guide

- `src/` — website pages, components, styles and images.
- `public/` — public static files.
- `scripts/` — local services, production server and maintenance tools; optional Windows launchers are in `scripts/windows/`.
- `tests/` — regression tests.
- `supabase/` — private lead database migration and disposable-database SQL tests.
- `docs/` — current AI, enquiry delivery, launch, owner-input, blueprint and UI-audit guidance.
- `workdone.md` — the single continuing work log.
- `.private/` and `.env.local` — private local data/configuration; never include them in shared source.
- `node_modules/`, `dist/` and `.tanstack/` — dependency/generated folders, excluded from source control.

## Commands

Use Node 24.x. Run `npm ci` if dependencies are missing.

`npm run dev` starts the local site and image service. `npm run typecheck`, `npm run lint`, `npm test` and `npm run format:check` run quality checks. `npm run build` prepares the public build; `npm start` serves it after stopping development. See [launch guidance](docs/LAUNCH.md).

`npm run build:netlify` prepares the Netlify deployment, using its official TanStack adapter. The committed `netlify.toml` sets the build command, `dist/client` publish folder and Node 24 automatically. Import this repository into Netlify using **Import an existing project**; no API key is needed to publish the current website. See the exact [Git and Netlify steps](docs/LAUNCH.md#git-to-netlify-import).

For the existing rajeevrr-glitch/LuxeWeb repository, the source is inside `website/`: keep Netlify Base directory `website` and publish directory `dist/client`. In a new repository containing only this website, package.json and netlify.toml can instead live at its root with a blank Base directory. Local keys, `.private/`, generated folders, `workdone.md` and the owner-input notes are ignored; keep them on this laptop. The owner manages Git pushes and the Netlify import.

## Hosted enquiry database

Supabase lead saving is active in the owner's Luxe Infra / Luxe Web project. The setup and maintenance instructions are in [Supabase setup](docs/LAUNCH.md#supabase-lead-saving-luxe-infra--luxe-web). `npm run leads:check -- --connect` checks readiness without creating a lead or printing customer data. Keep server credentials private and the configured website origin aligned with the published site.

An accepted online request means it was saved privately with a reference. Internal email alerts run separately through the connected queue; an email problem does not erase the saved enquiry. Automatic WhatsApp and hosted AI remain separate connections. Photos and floor plans are not automatically uploaded by the enquiry form.

## Private lead inbox and owner controls

The private workspace is at `/admin`. It has its own login and does not use the public website's menus, promotions or popup. Approved staff can search/filter enquiries, read their requirements, update status, add notes and schedule follow-up dates. Follow-up dates are displayed in the inbox; they do not send an automatic reminder. The owner additionally sees an overview, staff-access controls, recent activity and email-alert status.

The initial owner is `sales@luxeinfra.in`; the confirmed owner account and private inbox are active. Keep its password private. `npm run inbox:check -- --connect` checks database readiness and owner configuration without listing leads. See [inbox setup](docs/LAUNCH.md#private-lead-inbox-and-owner-controls) for maintenance and staff access.

No public signup grants inbox access. Owner/staff permissions are checked at the server and database on every request. Sessions expire after at most 30 minutes; sign in again when prompted. Passwords and provider tokens are not stored in browser storage. Do not share the owner's login with staff: create each staff account in Supabase, then approve its email from Team access. Removing inbox access does not delete the underlying Supabase Auth account. CSV export and a content-management system are not included in this workspace.

Internal new-lead email alerts are active through migration 003 and Resend. Receipt has been confirmed at `sales@luxeinfra.in` and `infoluxeinfra@gmail.com`. They notify the business, without emailing customers or backfilling existing leads. Follow [email-alert setup](docs/EMAIL-ALERTS-SETUP.md) for configuration and recovery. `npm run email:check -- --connect` checks configuration and the notification schema without sending an email. The owner’s Email alerts tab distinguishes queued, accepted, failed and uncertain attempts; accepted means Resend accepted the request, not that every later message was received or read.

The live spreadsheet inbox has Today in IST, overdue, no-follow-up, unassigned and Mine views, plus owner-managed responsibility assignment. Use a row's **Assign** or **Change** action to open the enquiry and choose its **Responsible team member**, or choose **Unassigned** to clear it. The dropdown uses existing approved Team access members; assignment does not create an account or send a notification. Migration 004 and `LUXE_WORKFLOW_ENABLED=true` are active in Netlify Production only. Local and preview contexts remain disabled. `npm run workflow:check -- --connect` checks schema/readiness only, without reading customer records or sending alerts. See [workflow setup](docs/LAUNCH.md#lead-workflow-migration-004).

A dedicated `/reset-password` owner recovery page handles older reset links that land on the homepage. The route is deployed and the owner confirmed saving the exact Supabase Auth redirect URL. The owner must complete a real reset and sign-in privately; automated verification uses fake Auth responses only. Never share a password or reset link in chat. See [password recovery](docs/LAUNCH.md#owner-password-recovery).

## Aggregate site traffic

The owner-only **Site traffic** tab adds 7-, 30- and 90-day views of page views, daily visitor estimates, recent activity and saved enquiries. Visitor days are summed daily estimates, not distinct people across the selected period. The recent estimate covers 15 minutes and can count the same browser twice around midnight IST. Saved enquiries are period totals, not attributed conversions. There is no traffic history before recording is enabled.

Migration 005 is installed and `npm run traffic:check -- --connect` confirms schema readiness. Keep `LUXE_TRAFFIC_ENABLED=false` locally and in previews. To activate the current source, save `LUXE_TRAFFIC_ENABLED=true` for Netlify **Production only**, publish and verify the public status and owner dashboard. No new API key is needed. Recording uses the existing Supabase and Netlify allowances, with limits of 10,000 page views per IST day and 100 per daily visitor estimate; free allowances are finite.

Only 35 fixed public pages, nine source buckets and four device categories are counted. Query strings, fragments, contact details, raw IP addresses and raw user agents are not stored. Daily keyed visitor hashes and event identifiers are retained for seven IST calendar days; aggregates for 90. Older records are pruned on the next capture, not by a timer. There are no analytics cookies; the only statistics value kept in browser storage is an opt-out preference. DNT/GPC and the [privacy-page opt-out](https://luxeinfra.in/privacy#site-statistics) suppress recording. Private workspace/recovery pages and common bots are excluded. See [traffic setup and limits](docs/LAUNCH.md#aggregate-site-traffic-migration-005).

The portfolio includes eleven unique photos and two project films. Films are assigned to Harsh Pal and Dharmendra Singh as instructed; other photographs stay unassigned and review wording needs confirmation. The floating WhatsApp button stays above the mobile actions and steps aside while the welcome popup or Luxe chat is open. It opens the confirmed studio number; visitors still send their own messages. Rates for other scopes, detailed renovation specifications, warranty coverage and remaining business terms are still needed; the owner-input notes remain local and are excluded from Git. Automatic WhatsApp delivery and public image AI are not activated merely by adding a local Gemini key.

Update this project and workdone.md in place. Do not create another preview folder, numbered report or ZIP unless requested.
