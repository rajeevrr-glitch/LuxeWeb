# LuxeInfra — launch preparation version 22

Updated 24 October 2026. Start with README.md, NEXT-STEPS-V22.md and QA-REPORT-V22.md. Saved-design comparison, related ideas and four planning guides are now included. Automatic private intake and WhatsApp notification remain disabled until account/host setup; AUTOMATIC-DELIVERY-SETUP.md and owner-inputs/AUTOMATIC-DELIVERY-CONNECTION.md cover that connection. NEXT-STEPS-V22.md consolidates the remaining business/content decisions. workdone.md preserves history. No public deployment has been made.

## Run and review

Requires Node 24 or later. Use npm and the included package-lock.json.

    npm ci
    npm run lint
    npm run typecheck
    npm test
    npm run format:check
    npm run build
    node scripts/verify-redesign.mjs
    npm start

Open http://localhost:3000. The normal build hides unapproved promotions, sample reviews and numerical prices. Valid quote/welcome/brief/partner submissions immediately open a WhatsApp draft. Visitors still press Send. Email remains a fallback; files must be attached manually. Public AI generation remains off.

The current unpriced planner starts with BHK/size and interior choices, then shows a scope summary without collecting contact details. Its optional quote action carries the selections into a short enquiry. Valid quote context bypasses repeated project selection. Numerical estimates remain inactive until rates are approved. Visitors still send requests through WhatsApp/email; automatic delivery is not active.

The welcome invitation is delayed until exploration/a longer visit and remains dismissible once per tab session. The header quote button reopens it on eligible browsing pages; floating invitations were removed. Active forms and privacy/contact pages are excluded. Use `/?welcome=1` for an explicit preview. Keep normal public build settings for launch; sample reviews and the proposed discount remain local-review content only.

For the proposed festive-offer design and sample review layout, use `npm run build:review`, `node scripts/verify-redesign.mjs --review`, then `npm start`. The included .env.review has two non-secret flags: VITE_CAMPAIGN_PREVIEW and VITE_CONTENT_PREVIEW. This mode remains noindex and must not be deployed publicly. The permanent Reviews link and homepage section also appear in the normal public build; sample quotes do not.

## Hosting settings

If automatic delivery will be enabled, complete AUTOMATIC-DELIVERY-SETUP.md first: private durable shared storage, an approved sender/template/receiver, private environment variables, ingress protections and real receipt checks. `npm run delivery:check` is offline and cannot prove actual provider/template delivery. The old local enquiry desk/pilot remains disconnected.

Use a Node 24 web-service host with managed HTTPS. This is a server-rendered TanStack Start application, not a static folder for an ordinary shared-hosting file manager.

- Build: `npm ci && npm run build`
- Start: `npm start`
- Health path: `/healthz`
- HOST: `0.0.0.0`
- PORT: supplied by the host; default 3000
- SITE_URL: `https://luxeinfra.in`
- INDEXABLE: `false` on staging; `true` only after approval on the final domain

Canonical/social URLs target https://luxeinfra.in. If the preferred final domain changes, update business.siteUrl in src/lib/business.ts and the host's SITE_URL together before building. The sitemap covers the public page list and room collections. Inactive offers and private/intake pages are excluded.

Dockerfile is provided as another Node hosting option; Docker has not been run on this laptop. The obsolete Worker configuration was removed because this checkout is configured for the included Node server.

## Source and runtime data

The versioned handover excludes .private, real environment files, .npm-cache, node_modules, generated dist output and builder metadata. .env.example and the non-secret .env.review are the only environment templates included. npm ci and npm run build recreate dependencies/build output. Do not publish local pilot servers or the enquiry desk.

No API key, database or mail password is required for the visitor-sent WhatsApp/email launch. Adding a key does not enable public AI. Local AI/desk/intake pilots remain separate, tested development tools; see AI-SETUP.md for their setup and limitations.

## Switch the domain only after the checklist is complete

Deploy to the chosen host's review URL first. Test desktop/mobile behavior and real WhatsApp/email receipt. Confirm image rights and public wording. Back up the current DNS records; change only required website records, preserve mail MX/TXT/DKIM/DMARC records and keep the Lovable version for rollback. Verify apex/www routing and HTTPS, then enable indexing and recheck metadata, robots.txt and sitemap.xml.

No account purchase, domain connection, Lovable edit, push or public deployment was performed by this preparation.
