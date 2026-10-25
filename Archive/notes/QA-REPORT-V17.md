# Version 17 — sales journey verification

22 October 2026. New quote and budget-planning UI. Local review only.

## Automated verification

- 35 tests cover existing pricing/privacy/server/room/AI-pilot logic and new contact validation, optional email/call preference, enquiry context, studio-home/size labels, stored-choice migration and explicit approved size-band packages. Missing or unsuitable rates do not produce a numerical result; a size band is not converted to an exact floor area.
- Strict TypeScript, lint with zero warnings and formatting checks.
- Normal public and local review builds, with rendered-page/asset checks including default BHK-first entry, 2 BHK / 800 sq ft choices, wardrobe entry without BHK questions and the bedroom quick-quote context. Preview offer/review gates, metadata, missing-page behavior and existing routes remain checked.
- Current counts and running-server results are recorded in RELEASE-VERIFICATION.md and the saved check logs.

## Browser verification limit

Windows Computer Use stopped this turn with: “could not determine the current browser URL on Windows with enough confidence to enforce policy.” No further native browser input was attempted. The earlier v16 screenshots and observations describe the previous screens, not this redesign. New desktop/mobile layout, keyboard and full interactive step checks are **not** claimed passed. Review these before public release.

The public Livspace page was researched and supports the published BHK/size/rooms/package order. Its dynamic quiz returned no readable form content to the web tool. Exact competitor field order, thresholds and lead/result behavior were not independently verified.

## Remaining launch limits

Actual rates, image rights, genuine reviews/projects, final commercial terms, hosting/DNS/HTTPS and real WhatsApp/email receipt remain pending as described in LAUNCH-CHECKLIST.md. Contact fields prepare manual handoffs; no automatic lead receipt, booking or notification is implemented. No external message or paid provider call was made. Public AI stays disabled. No performance score, full accessibility certification or browser/device coverage is implied by passing code/build tests.
