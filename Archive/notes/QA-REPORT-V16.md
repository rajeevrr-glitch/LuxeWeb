# LuxeInfra — reviews and browser checks, version 16

22 October 2026. Local review only. No publication, DNS change, external message or paid AI call.

## What changed

- Added a permanent Reviews link on desktop, near the top of the mobile menu and in the footer.
- Added the image-led “Know it from the people who live it” section after the homepage inspiration gallery and before the calculator banner, plus a dedicated /testimonials page.
- Local review mode shows three clearly labelled sample cards for layout approval. There are no invented customer identities, stars, review counts or verified badges. Normal public mode uses only approved, permissioned reviews, or a useful invitation to share an experience. Real reviews take precedence over samples.
- Fixed enlarged gallery images using an older font outside the main page wrapper. The viewer now inherits the current site typography. Added sticky-header offsets for review-section/card links.

## Checks completed

### Automated and built pages

- 30/30 automated tests passed, including two new tests for preview-only samples and approved/permissioned review selection. Existing pricing, room-work, intake/desk, production-server and local AI-pilot checks passed.
- Strict lint with zero warnings, strict TypeScript unused-code checks and formatting checks passed. No dependency changes in this version.
- Both normal public and local review builds passed. Each passed 18 rendered route/query checks and 83 asset references, including review visibility, public sample exclusion, campaign gates, canonical/social metadata, heading structure, career deep link and missing-page response.
- Refreshed HTTP server checks passed for 17 pages, 76 referenced assets and all 22 sitemap paths. Unknown route: 404; malformed path: 400; private environment/source/data paths blocked; staging noindex; public AI off; automatic enquiry POST: 405.

### Actual Chrome interactions

Desktop at 1280px:

- Reviews page, heading/photo composition, sample labels and permanent navigation inspected.
- Explore-spaces menu opened; Escape closed it and a visible focus outline returned to its trigger.
- Callback phone validation rejected 12345. Synthetic QA Preview / 9000000000 / Noida input prepared a draft, with an explicit not-sent state.
- Actual draft links target WhatsApp +91 9026271638 and sales@luxeinfra.in, copied to infoluxeinfra@gmail.com. Links were read without opening external apps or sending messages.

Responsive mobile viewport at 390 × 578px:

- Header, menu and Reviews navigation worked; menu closed on navigation. Reviews is placed high enough to discover readily.
- Client-stories heading, preview notice, image and full sample card inspected. Cards wrap and stack; no horizontal page spill was visually observed. No DOM width measurement or physical-device claim is made.
- Whole-home journey completed with Noida/Delhi NCR, 2 BHK, optional 900 sq ft and Laminate preference. Result retained choices and showed the tailored-quotation fallback rather than unapproved rupee prices.
- Discuss-this-selection opened the callback page with location/scope/estimate context retained and contact fields blank.
- Gallery search for kitchen returned its matching collection; collection showed ten designs. Image enlargement, save state, Next navigation and close control worked. Saved count became one and remained saved on a later full-page visit.
- Final gallery viewer typography inspected; Escape closed the focused viewer and a visible outline returned to the image opener.
- Partnership design-role button selected Design collaboration and scrolled to the introduction area. Synthetic required details prepared a not-sent draft; actual WhatsApp/email links contained the selected role and correct destinations.

## Screenshot evidence

Saved separately in Desktop/LuxeWeb/review-evidence-v16, copied from task outputs/reviews-qa-v16:

- reviews-desktop.jpg — desktop review-page composition.
- mobile-menu-final.jpg — final prominent Reviews menu position.
- reviews-mobile-top.jpg — responsive headline and preview notice.
- reviews-mobile-card-final.jpg — complete labelled example review card.
- home-reviews-mobile-final.jpg — homepage review-section heading with sticky-header offset.
- quote-draft-desktop.jpg — validated local callback draft, not sent.
- budget-mobile-result.jpg and budget-mobile-handoff.jpg — no-price fallback and next action.
- partner-mobile-draft.jpg — partnership introduction ready to share, not sent.
- gallery-mobile-viewer-final.jpg — corrected gallery viewer typography and saved state.

Intermediate screenshots with no “final” suffix may record an earlier stage; mobile-menu.jpg and gallery-mobile-viewer.jpg are superseded and excluded from the selected evidence handover. Screenshots include browser test tools, not a proposed customer-facing layout.

## Limits and owner approval

These checks cover representative journeys, not every browser/device or every optional branch. The full style quiz, every materials chapter, all detailed-brief steps, photo/dimensions flow, budget edit/reset combinations, assistive technologies and physical phones were not repeated in this version. Earlier results remain historical evidence, not new v16 claims.

The owner still needs to approve the visual layout and final public wording, confirm image rights, supply genuine reviews/projects and commercial terms, choose hosting and verify real WhatsApp/email receipt (including a manually attached file) before domain launch. Actual rates and the proposed 15% offer require separate approval. Public AI and automatic lead delivery remain off. No independent accessibility/security certification, performance score or load-test result is claimed.

The normal public build must be deployed, not the local review build containing sample stories and the proposed discount. Previous versions remain preserved.
