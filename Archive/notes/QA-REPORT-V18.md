# LuxeInfra — interactive welcome form, version 18

22 October 2026. Local preview only. No publication or external message.

## What visitors get

- An automatically opening welcome quote form after a 1.8-second pause on the first eligible browsing page in a tab session.
- A photo-led introduction, animated entrance/step transitions, a subtle button sheen and project selection cards. Home, kitchen, wardrobe and room selections change the main image and headline. Whole-home visitors can optionally choose 1 RK through 5+ BHK.
- A short contact step, optional call/email preferences and a clearly described WhatsApp/email handoff. It does not claim automatic receipt or invent a price, offer or response promise.
- Close button, Escape, “I’m just exploring,” a budget alternative and a floating reopen button. Personal fields clear on close. A simple seen flag, with a memory fallback when storage is blocked, prevents repeated invitations during browsing.
- The invitation waits while a menu/dialog is open, a field is being edited or the page is in the background. Existing budget, callback, detailed brief, room studio, partnership, privacy, contact and style-quiz journeys do not show it. Manual interaction also cancels a pending auto-invitation. An explicit `?welcome=1` URL permits previewing the welcome on an already seen session.
- Reduced-motion styling suppresses the new decorative animations. This is source-verified, not a physical-device accessibility certification.

## Checks

Automated:

- 39/39 tests passed: existing price/privacy/room/server/AI-pilot checks plus four new welcome checks for eligible routes, once-per-session flag handling, blocked-storage fallback and pending/manual invitation behavior.
- Strict TypeScript, zero-warning lint and formatting checks passed; no dependency changes.
- Normal public and local review builds passed. Each passed 21 rendered route/query checks and 81 referenced asset checks, including the launcher on the homepage and its omission on protected journeys. Existing offer/review approval gates remain checked.
- Running-server results are in RELEASE-VERIFICATION.md and the saved HTTP log.

Actual in-app browser, narrow 335 × 604 viewport:

- Ordinary homepage reload automatically opened the invitation without clicking the launcher.
- Selecting Kitchen changed its checked state, image, copy, next-action wording and budget link.
- Missing project selection was rejected with a helpful error.
- The contact step rejected phone 12345. Synthetic QA Preview / 9000000000 / Noida input prepared a not-sent request with Kitchen context and correct WhatsApp +91 9026271638 / email sales@luxeinfra.in copied to infoluxeinfra@gmail.com links. No external send link was opened.
- Escape closed the popup and focus returned to its launcher. Manual reopening worked; returning to the contact step showed blank personal fields after the previous close.
- Reload after dismissal showed the launcher without auto-opening again. A later explicit `?welcome=1` preview opened the refined design.
- Final compact opening fit within the viewport: dialog top about 51px, bottom 553px; width and scroll width both 310px; panel height and scroll height both 411px. The primary action was fully visible around y456–503. No horizontal modal overflow or initial-panel scrolling was measured.
- Whole home revealed optional home types. Choosing 2 BHK updated the budget link. Following it opened the estimator with 2 BHK selected and the up-to/above 800 sq ft choices, without a second welcome overlay.

Saved screenshots: welcome-opening-mobile.png (final refined opening) and welcome-ready-mobile.png (ready-to-share request). They are copied to Desktop/LuxeWeb/review-evidence-v18. No desktop screenshot is claimed for this pass.

## Remaining limits

Wider desktop layouts, physical phones, screen-reader/device combinations and every existing v17 form branch were not fully tested in this pass. The previous v17 browser limitation remains historical; the in-app browser worked for the narrow welcome tests above. Final owner visual approval and launch checks remain required.

Real rates, image rights, genuine reviews/projects, final commercial/offer terms, hosting/domain/HTTPS and actual WhatsApp/email receipt are still pending. Automatic intake and public AI remain disabled. No paid provider call, live deployment, Lovable edit or DNS change was performed.
