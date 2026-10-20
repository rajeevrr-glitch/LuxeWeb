# LuxeInfra — local preview

This is version 9 of the agreed website blueprint implementation. It is a local preview, not a live deployment. The original Lovable ZIP and earlier previews are preserved separately.

## Start on Windows

Install Node.js 24 LTS if needed. Double-click `Start-preview.cmd`. The first run installs the pinned dependencies and needs internet access. Keep the terminal open while viewing http://127.0.0.1:5173. Press Ctrl+C to stop.

Alternatively: `npm ci`, then `npm run dev`.

## Included

- Ivory and deep-blue homepage with editorial imagery, room entry points, process, FAQs and clear calls to action.
- Five-step Plan My Space: location, property, room-by-room work, style, priorities, optional floor plans/photos, budget preference, review and contact details.
- Up to three PDF/JPG/PNG attachments, 10 MB each, validated by the local enquiry server.
- Saved gallery inspirations (up to 12) carried into the brief.
- Downloadable text brief and an optional WhatsApp handoff after local submission.
- Contact, studio, services, process, project-journal and preview privacy pages.
- Uttar Pradesh, Delhi NCR and Bengaluru; infoluxeinfra@gmail.com; +91 9026271638.
- No Lovable badge in this independent preview. Live Lovable hosting has not been modified.

## Local enquiries

The local server listens on 127.0.0.1:8788 and the website proxies `/api/` to it. Requests are stored in `.private/enquiries/<request-id>/brief.json`, with uploaded files alongside. Vite denies access to `.private` paths. Do not publish, share or include this private folder in source archives.

The server sends NO email and NO WhatsApp messages. It reports this explicitly on screen. A successful reference means local storage succeeded, not that a studio notification was delivered. Production requires a hosting adapter, private durable storage, a notification provider, and an authenticated enquiry dashboard. This local server is not a production deployment.

## Verification

`npm test` checks persistence, concurrent retry deduplication, validation, attachment rejection, origin checks and private API paths. `npm run typecheck` verifies types. `npm run build` builds client and server output. The browser flow was tested with synthetic contact data only.

## Before launch

1. Review the layout and wording with the owner.
2. Provide verified project photographs, image-use rights, project descriptions and any support/warranty terms. Current images are references from the supplied source, not evidence of completed LuxeInfra work.
3. Add the second email when supplied. Confirm the public business identity and final contact details.
4. Select production hosting. Add durable private file storage, access control, retention/deletion, anti-abuse protection, and an email provider with authenticated sender/domain. Configure receipt and notification failure handling.
5. Review the final privacy notice and contact consent with the actual production data flow.
6. Test production uploads, notification delivery, retries, mobile accessibility, broken links, performance and redirects from old URLs. Add final canonical/social metadata, sitemap and robots settings; remove preview noindex only for launch.
7. Back up DNS and the existing live website. Publish only after approval, then switch DNS in GoDaddy and verify HTTPS, www/root domains and forms. Domain registration can stay with GoDaddy.

See `LuxeInfra-Website-Blueprint.md` for the full staged roadmap. Instant pricing, 3D visualisation, customer login, payment and an operational CRM are not part of this first preview.

## Version 2 additions

Searchable room collections, enlarged image previews, My Inspiration, style discovery, room/style preselection and an expanded process page. See HANDOVER.md.

## Version 3 additions

Expanded service stories with direct planner links, home configuration and site-readiness questions, and an access-code-protected local enquiry desk. `DETAILS-TO-PROVIDE.md` contains the owner's pending business and launch information.

## Version 4 additions

Room-by-room priorities (First priority / Can wait / Discuss with designer) now travel through the planner, review, saved brief and enquiry desk. These are customer preferences, not a confirmed construction sequence. The process page includes an interactive quotation review checklist with a downloadable copy. Review buttons have descriptive accessible names and cannot edit steps while a request is saving.

`AI-ROOM-VISUALISER-PLAN.md` records the original proposal and pilot requirements.

## Version 5 additions

Reimagine My Room adds photo selection, dimensions, style and design requirements, a review step, provider-specific consent, a protected image-generation service, result comparison/download, and photo/concept handoff to the planner. OpenAI and Hugging Face/fal adapters are implemented. Generation remains OFF until an account is connected. See `AI-SETUP.md` for local setup, attempt limits and production requirements. No live provider call has been made.

## Review local enquiries

After installing dependencies through Start-preview.cmd, double-click `Review-enquiries.cmd` in the same folder. Open http://127.0.0.1:8789 and enter the session access code shown in that terminal. Keep the code private. It changes each time the desk starts and is kept in browser memory only. Reloading or locking the desk requires entering it again; stopping the terminal ends that session.

Submit a request through the local website, then refresh the desk. You can search requests, filter follow-up stages, review briefs, download attachments, and save internal notes. Notes and stage history are stored in a separate `workflow.json` beside the original brief. Internal notes are excluded from the customer brief download. This does not send email or WhatsApp messages.

Keep both terminals open while testing intake and reviewing requests. Ctrl+C stops each. The desk binds only to this computer and is a preview tool, not a public admin portal. A live version needs team authentication, durable storage and the production controls listed above. Test records from development are excluded from this archive; your packaged desk starts empty.



## Version 6 improvements

Reimagine now includes colour-based style cards with descriptions, photo guidance, quick idea starters that preserve your own wording, automatic feet/metres conversion and approximate floor area, and a downloadable text brief. Editing a review retains the selected photo without requiring another upload. The planner confirms transferred photos/notes and explains when a temporary brief has been lost after refresh. AI generation remains disabled pending account connection.



