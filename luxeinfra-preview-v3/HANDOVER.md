# LuxeInfra redesign — version 3

Prepared 16 October 2026. Continues the agreed blueprint and preserves the ivory/deep-blue theme, existing galleries, contact details and service areas.

## Added

- Expanded service stories for whole-home interiors, kitchens, storage and renovation, with direct links into the relevant project brief.
- Home configuration and site-readiness questions, included in the review and saved enquiry.
- A local enquiry desk protected by a temporary session access code: search, stage filters, brief review, protected attachment downloads, internal notes and follow-up history.
- A saved checklist of business information to supply later: DETAILS-TO-PROVIDE.md.

## Open this version

1. In Desktop/LuxeWeb/luxeinfra-preview-v3, double-click Start-preview.cmd. First use installs dependencies and needs internet. Open http://127.0.0.1:5173.
2. To review requests, double-click Review-enquiries.cmd in that same folder. Open http://127.0.0.1:8789 and enter the access code shown in its terminal.
3. Keep the terminals open while reviewing. Ctrl+C stops each. The desk code expires when its terminal stops.

Each preview folder has its own private enquiry storage. This new package contains no customer or development-test records. Submit a local test brief and refresh the desk to see the workflow. Earlier preview folders remain intact.

## Checks completed

TypeScript and the production build passed. Six automated test groups passed, covering enquiry persistence, retry deduplication, input/file validation, desk authentication, origin checks, follow-up persistence, stale-update protection and attachment restrictions.

Browser checks covered desk login, saved notes and stages after restart, filtering, locking, service-to-planner navigation, home-detail selection and retention, and mobile services/planner layout at 390px. No browser console errors appeared in the checked website flow. Sample data only was used.

## Still pending

Commercial terms, fees, warranty wording, the additional email, verified project stories and image permissions are listed in DETAILS-TO-PROVIDE.md. No prices or guarantees were invented. Current supplied imagery is presented as design inspiration.

Enquiries and notes are stored locally. Email delivery and production team accounts are not connected. The next launch work is production hosting, private storage, notifications and final owner-approved content. Nothing was pushed, published or changed in GoDaddy or Lovable.
