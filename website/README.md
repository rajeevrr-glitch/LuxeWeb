# LuxeInfra website

Open **Start-website.cmd**, then visit **http://127.0.0.1:3000**. Keep the terminal running while you browse. This is local development, not a published site. Client stories have a dedicated text-only page, without editorial notices or unapproved quotations. Proposed wording is kept in the existing owner-input notes, outside the website. Project photographs and films live under **Our work**. The owner-approved Diwali campaign is public content.

Desktop/LuxeWeb/website opens this active project folder. It is a folder link, so there is one working copy. Older source backups, notes and evidence are organised under Desktop/LuxeWeb/Archive.

## Gemini image key

Add it only to the private `.env.local` file beside package.json, after `GEMINI_API_KEY=`. Do not post it in chat or add it to `.env.example`. Follow [AI setup](docs/AI-SETUP.md) to check configuration and enable a limited local trial. `npm run ai:check` prints no key and makes no provider request.

## Luxe chat

Ask Luxe provides site-specific guidance in English, Hindi and Hinglish. Quick answers work without an API call; optional Gemini conversation is connected locally after one owner-approved successful text test. Visitors choose Start an AI conversation before sending a question to Google. The updated chat includes the approved Diwali campaign, business figures and qualified warranty wording. The separate key stays in private `.env.local`; never paste it into chat. Image settings remain separate. See [AI setup](docs/AI-SETUP.md).

The homepage keeps the main room photograph and simple quote/design links. The project choices are inside the welcome popup, which becomes ready ten seconds after arrival without requiring a scroll. It appears once per tab session and defers while a visitor is typing, using another dialog/menu or viewing a background tab. Get a quote can reopen it on browsing pages.

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

Supabase lead saving is prepared for the owner's Luxe Infra / Luxe Web project. Set up the committed SQL migration, privately configure the server Secret key and signing secret, and run `npm run leads:check -- --connect` before activation. Its output contains only readiness booleans and an HTTP status. Keep `LUXE_LEADS_ENABLED=false` until the migration, exact public website origin and deployment are verified. Follow [Supabase setup](docs/LAUNCH.md#supabase-lead-saving-luxe-infra--luxe-web).

An accepted online request means it was saved privately with a reference. Automatic WhatsApp/email alerts and hosted AI remain separate connections. Photos and floor plans are not automatically uploaded by the enquiry form.

## Private lead inbox and owner controls

The private workspace is at `/admin`. It has its own login and does not use the public website's menus, promotions or popup. Approved staff can search/filter enquiries, read their requirements, update status, add notes and schedule follow-up dates. Follow-up dates are displayed in the inbox; they do not send an automatic reminder. The owner additionally sees an overview, staff-access controls, recent activity and email-alert status.

The initial owner is `sales@luxeinfra.in`. Create that confirmed account privately in Supabase Authentication and run the second migration `supabase/migrations/202610260002_lead_inbox.sql` after the existing lead-intake migration. Run `npm run inbox:check -- --connect`; databaseReady and ownerConfigured must both be true. Add the server-only `LUXE_INBOX_ENABLED=true` setting in Netlify and deploy the current code. See [inbox setup](docs/LAUNCH.md#private-lead-inbox-and-owner-controls).

No public signup grants inbox access. Owner/staff permissions are checked at the server and database on every request. Sessions expire after at most 30 minutes; sign in again when prompted. Passwords and provider tokens are not stored in browser storage. Do not share the owner's login with staff: create each staff account in Supabase, then approve its email from Team access. Removing inbox access does not delete the underlying Supabase Auth account. Visitor analytics, CSV export and a content-management system are not included in this workspace.

Internal new-lead email alerts are prepared for Resend and remain disabled until setup is complete. They notify the two business inboxes, without emailing customers or backfilling existing leads. Follow [email-alert setup](docs/EMAIL-ALERTS-SETUP.md). `npm run email:check -- --connect` checks configuration and the notification schema without sending an email. The owner’s Email alerts tab distinguishes queued, accepted, failed and uncertain attempts; accepted means Resend accepted the request, not that a recipient read or received it.

The portfolio includes eleven unique photos and two project films. Films are assigned to Harsh Pal and Dharmendra Singh as instructed; other photographs stay unassigned and review wording needs confirmation. The floating WhatsApp button stays above the mobile actions and steps aside while the welcome popup or Luxe chat is open. It opens the confirmed studio number; visitors still send their own messages. Rates, detailed warranty coverage and remaining business terms are still needed; the owner-input notes remain local and are excluded from Git. Automatic WhatsApp delivery and public image AI are not activated merely by adding a local Gemini key.

Update this project and workdone.md in place. Do not create another preview folder, numbered report or ZIP unless requested.
