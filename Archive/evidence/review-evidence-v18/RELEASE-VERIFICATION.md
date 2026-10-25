# Release verification — welcome experience version 18

22 October 2026. Local preview only; no public deployment.

Passed:
- 39/39 tests; four welcome tests cover protected journeys, session/seen handling, blocked storage and manual interaction cancelling pending invitations. Existing sales, pricing, room, server and local AI-pilot tests remain passing.
- Strict TypeScript, zero-warning lint, formatting and both build modes. Each build passed 21 rendered route/query checks and 81 referenced assets. The homepage launcher is present and protected journeys omit it; existing campaign/review gates remain intact.
- In-app browser at 335 × 604: normal arrival auto-opened; Kitchen selection updated image/copy/link; missing selection and invalid phone were rejected; synthetic details prepared correct WhatsApp/email drafts without sending. Escape restored focus to the launcher; reopening worked and personal fields were clear after dismissal. Reload did not repeat the invitation; explicit preview mode opened the refined form.
- Measured final opening: modal width and scroll width both 310px, panel height and scroll height both 411px; action fully visible and modal within the viewport. A 2 BHK selection carried into the correct estimator entry without another popup.
- Final running preview: 20 page/query paths and 74 assets returned 200; all 22 sitemap paths passed. Welcome launcher/route exclusions and the privacy flag notice were verified. Staging noindex, private paths blocked, missing 404, malformed 400, public AI off and automatic enquiry POST 405 remain intact.
- Screenshots and exact limits: QA-REPORT-V18.md. Running-server details are in the saved HTTP log.

Limits: wider desktop layouts, physical phones, assistive technologies and all branches of the existing v17 forms were not fully tested in this pass. Reduced-motion behavior is implemented in CSS, not certified on physical devices. Real prices, rights/content/terms, actual message receipt and hosting/domain checks remain launch items. Personal data is not automatically submitted; public AI remains off.

## Earlier version 17 verification

# Release verification — sales journeys version 17

22 October 2026. Local preview only; no public deployment.

Passed:
- 35/35 automated tests. Five new sales-journey checks cover contact validation, optional email/call preference, draft context, studio-home/size labels, saved-choice migration and explicitly approved size-band pricing. Bands do not become invented exact areas; missing/unapproved/unsuitable rates remain unavailable.
- Strict TypeScript, lint with zero warnings and formatting checks. No dependencies added or changed.
- Public and review builds; each passed 21 rendered route/query checks and 85 asset references. New coverage includes BHK-first opening, 2 BHK up-to/above 800 sq ft, wardrobe entry without BHK questions and preserved bedroom quote context. Existing review/campaign gates, canonical/social metadata, headings and missing-page response remain checked.
- Final running preview: 20 pages/query paths and 78 assets returned 200; all 22 sitemap paths passed. Staging noindex, private-path blocking, missing 404, malformed 400, public AI off and automatic enquiry POST 405.

Not verified in this version:
- New browser visual, mobile, keyboard and full interaction checks. Windows Computer Use stopped because it could not determine the browser URL confidently enough to enforce policy; no further native browser input was attempted. V16 screenshots are historical and do not verify the redesigned quote/budget screens.
- Livspace's published BHK/size/rooms/package sequence was researched, but its dynamic quiz, exact thresholds/contact order and final submission were not independently observed.
- Genuine WhatsApp/email receipt, automatic intake, actual rates, image rights, real client content, commercial approvals and hosting/domain checks remain launch items. Call windows are preferences, not confirmed bookings.

See SALES-REVIEW-V17.md, QA-REPORT-V17.md and LAUNCH-CHECKLIST.md. Previous checks below are retained as history.

## Earlier version 16 verification

# Release verification — reviews and browser checks version 16

22 October 2026. Local review only; no public deployment.

Passed:
- 30/30 automated tests, including preview-only example reviews and approval/consent filtering.
- Strict TypeScript, lint with zero warnings, and formatting checks. No dependency changes.
- Both public and review builds; 18 rendered route/query checks and 83 asset references per mode. Permanent Reviews navigation/home section; sample exclusion in public mode; campaign gates; canonical/social metadata; missing-page 404.
- Refreshed running server: 17 pages, 76 asset references and 22 sitemap paths. Staging noindex, private-path blocking, unknown 404, malformed URL 400, public AI off and automatic enquiry POST 405.
- Actual Chrome desktop and responsive 390px checks: Reviews/menu, callback phone validation and draft destinations, whole-home budget result and callback context, kitchen gallery search/save/viewer/Next/close, persistent saved state, partnership role selection and ready-to-send draft.
- Fixed the gallery viewer's inconsistent typography and sticky-header overlap on review-section links. Final screenshots and exact scope are recorded in QA-REPORT-V16.md.

Limits:
- Owner visual approval and physical-device/cross-browser review remain open. The full style quiz, every materials chapter, all detailed-brief/photo branches and budget edit/reset combinations were not repeated in v16.
- No external message was sent. Genuine receipt, host/domain/HTTPS/rollback, image rights, final content and commercial approvals remain launch gates.
- Sample review cards and the proposed offer are local review content only. Genuine reviews require wording/attribution/permission; real rates and public AI are inactive. No independent accessibility/security certification, performance score or load-test result is claimed.

See QA-REPORT-V16.md and LAUNCH-CHECKLIST.md. Earlier verification below is retained as history.

## Earlier version 15 verification

# Release verification — launch cleanup version 15

22 October 2026. Local launch preparation; no public deployment.

Passed:
- All 28 automated tests, including public error disclosure, malformed paths and sitemap coverage; existing pricing, room-work, intake/desk and AI pilot tests still pass.
- Strict unused-local/parameter type checking; lint with zero warnings across source/scripts/tests/config; consistent-format check.
- Public and review builds; 18 rendered route/query combinations and 82 asset references in each. Canonical URLs (including normalized collection paths), social-image metadata, approved-review empty state, campaign gate, career deep link and missing-page 404 checked.
- Refreshed running server: 17 pages and 82 assets returned 200; all 22 sitemap URLs returned 200. Missing page 404, malformed encoded path 400, private environment/source/data paths blocked, staging noindex, public AI off and automatic enquiry POST 405.
- Final npm audit on 22 October: zero known vulnerabilities; manifest and lockfile match. Package inventory reduced from 506 to 397 after unused dependencies were removed.

Limits:
- No new final mobile or full browser interaction sign-off was completed in this cleanup. Prior desktop observations remain documented below. Final mobile/browser verification remains a launch gate.
- No genuine WhatsApp/email message was sent; receipt is still an owner test. Docker, public hosting, HTTPS/DNS routing, monitoring and rollback have not been verified on a selected host.
- Image rights, approved content and actual commercial terms remain owner inputs. Numeric prices, public AI, unapproved offers and automatic receipt/delivery remain inactive.
- See LAUNCH-CHECKLIST.md for launch gates and BLUEPRINT-STATUS-V15.md for the complete 38-feature status register. No independent accessibility/security certification, speed score or load-test result is claimed.

## Earlier version 14 verification
# Release verification — version 14

22 October 2026. Local festive/partnership UI update; no public deployment.

Passed:
- All 26 automated checks, including new draft/approved/expiry boundaries for promotions and validation/message generation for partnership introductions.
- Normal public build, local review build and TypeScript checking. The normal build hides the unapproved 15% offer; review mode shows it as a preview. Sample testimonials remain excluded in both builds.
- Built-page checks: 18 route/query combinations and 83 built asset references for each mode; one main heading on each page, correct role deep link, callback campaign context, approved-review placeholder and missing-page 404.
- Running-server HTTP checks: 17 pages and 83 assets returned 200; staging noindex is set. Unknown page 404; .env.review is blocked; public AI disabled; automatic enquiry POST rejected with 405; partnership page included in the sitemap.
- Dedicated task-only Chrome: partnership desktop hero, navigation, imagery and top festive banner visually inspected. A screenshot was saved as outputs/redesign-v14/partner-desktop.jpg (or .png, according to the capture format).

Limits:
- Human input was detected during further browser interaction, so input was stopped. Final mobile layout and complete browser interactions for the new forms are not claimed verified. Form validation/message composition and route state are covered by the automated and rendered-page checks above.
- No message was sent to WhatsApp/email. Actual receipt still needs an owner test. There is no automatic submission, receipt, referral tracking or partner portal.
- Offer terms, actual joining benefits, genuine vacancies, pricing/catalogue, authentic project/review content, image rights, commercial terms and hosting approval remain pending. Public AI remains off.

## Earlier version 13 verification

21 October 2026. Local service-led UI redesign; no public deployment.

Passed:
- Final production build and TypeScript checking.
- All 22 automated checks for pricing guards, room-specific work, local enquiry/desk controls, pilot AI restrictions and production endpoint handling. No new tests that merely mirror visual styling were added.
- HTTP verification of 15 pages, including wardrobe-specific and 3 BHK entry URLs; 33 homepage image/style/script asset references returned 200. Gallery/scene/save controls and contextual links are present in the rendered page. Missing-page response is 404; public AI remains disabled.
- Dedicated task-only Chrome window: homepage composition, stronger typography, two-level navigation, companion quote selector and manual room thumbnails inspected. Wardrobe selection changes its quote/budget link and arrives at a wardrobe-only modular summary. A kitchen summary-image mismatch was identified and fixed in the final source/build.

Limits:
- User interaction was detected during subsequent browser actions. Further UI interaction was stopped; a full mobile/browser interaction review of version 13 (including gallery save/expand behavior) is still outstanding. Responsive styling and existing save logic are implemented; source/HTTP checks do not substitute for those remaining visual checks.
- Automatic approval rejected access to an unrelated private Chrome window. A separate local-preview window was opened for the permitted visual checks instead; no unrelated page content was read.
- The captured desktop-preview.jpg in task outputs is an intermediate budget-screen observation before the final summary-image fix, not a final homepage/mobile approval screenshot.
- Existing limits remain: actual rates, image rights, verified projects/reviews, catalogue, commercial terms, hosting and real message receipt. Automatic callback delivery and public AI are not enabled.

## Earlier version 12 verification

21 October 2026. Tested local redesign review build; no public deployment.

Passed on the final build:
- Production build and TypeScript checking.
- All 22 automated checks, including missing/expired/unsupported rates, exact units/specifications, safe measurements and whole-home bundle arithmetic. The server tests use temporary local ports; they were run with local network access after the sandbox denied those socket connections.
- HTTP checks: 20 pages/endpoints and 23 homepage asset references returned 200; unknown route returned 404; public AI status is disabled; public testimonials contain no sample reviews.
- Desktop browser: room navigation opens and Escape closes it; room edit changes its image/copy; modular scope/measurements/finish/result work; choices carry to the short enquiry; materials palette carries forward; invalid typed phone is rejected; valid test input produces correct WhatsApp and email To/CC links. No external messages were sent.
- Existing bedroom planning link enters the gateway and preserves Master bedroom in the selected-room estimate. The optional detailed brief remains a separate working route.
- Mobile viewport 390px: homepage, navigation, materials chapters/palettes and whole-home choices/result work. Measured content client/scroll widths both 375px (no horizontal overflow). Final homepage typography was refined after the first mobile check.
- Fresh-selection reset clears the new estimate choices. Existing saved inspiration is preserved.
- No errors recorded in the final homepage browser console.
- Screenshot evidence: outputs/redesign-v12/home-desktop.jpg, home-mobile.jpg and home-full.jpg in the task workspace. Desktop source package includes the preview images separately.

Limits: real prices, product catalogue, verified project/review content, media rights and commercial terms await owner input. Short enquiries use customer-sent WhatsApp/email; automatic receipt, staff assignment and notification delivery are not activated. Hosting, real inbox/WhatsApp receipt, public AI, Docker and end-to-end domain launch have not been tested. No accessibility certification, independent performance score or load-test result is claimed.

## Earlier version 11 verification

18 October 2026. This is a tested local release candidate, not an internet deployment.

Passed:
- All 17 automated tests after the dependency updates. Covers invalid room work, saved-choice migration, private files, local desk access, AI pilot controls and production endpoint restrictions.
- TypeScript checking after adapting the root error component to the framework's unknown error type.
- Production build using patched TanStack Start 1.168.60, React Router 1.170.41 and Vite 7.3.7. The later root edit changed a TypeScript annotation only, with no runtime output change.
- npm audit fix completed with 0 known vulnerabilities in the resulting dependency tree (18 October 2026).
- Production HTTP checks: 16 public routes/assets returned 200; unknown route returned 404. Includes planner, room studio, gallery/category, services, contact, privacy, sitemap, robots and favicon.
- Public testimonials response contains no example review copy.
- Browser: restored bedroom/bathroom choices, all five planner steps, correct review summary, contact consent, ready-to-send screen and edit flow.
- Downloaded synthetic brief inspected: room-specific work, city, contact and budget fields are correct.
- WhatsApp target and email To/CC verified from link destinations. No external message sent.
- Mobile width 390px: planner and ready screen controls present, no horizontal page overflow (scroll width 375px).

Remaining limits:
- Actual hosting account, domain/HTTPS/redirect setup and external email/WhatsApp receipt are not verified.
- Owner image-publication permissions, authentic testimonials and commercial terms remain pending.
- AI API keys were not activated and no paid provider call was made. Public AI remains disabled.
- Dockerfile is prepared but Docker build was not run here.
- No full accessibility certification or load testing has been performed.

