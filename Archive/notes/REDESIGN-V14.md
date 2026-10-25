# LuxeInfra — festive edit and partnership UI, version 14

22 October 2026. Local review: http://127.0.0.1:3000/?review=14

## Changes

- Replaced the location-led utility strip with a navy festive banner. The review includes the requested proposed 15% offer and an explicit Preview label. Locations remain in relevant contact and service-area sections.
- Made the companion homepage quote panel navy with a champagne primary action; refined card elevation, focus states and room-shortcut interactions while keeping the blue/ivory theme.
- Added an image-led festive homepage feature and /offers page. The offer enquiry carries campaign context into the short callback and its WhatsApp/email draft.
- Added /partner-with-us with a photographed hero, five opportunity types, collaboration benefits, next steps, FAQ and a short introduction form. Company/portfolio details are optional. The chosen opportunity preselects the form, and validated role deep links are supported.
- Added partnership entry links to desktop/mobile navigation, footer and homepage. Partner pages use a relevant footer invitation and omit the customer mobile quote bar.
- Partnership details stay in the current page; visitors review and send their own WhatsApp/email message. There is no false submission confirmation or automatic transmission.
- Added draft/approved/dated campaign controls. `npm run build` does not advertise an unapproved offer. `npm run build:review` uses the included non-secret .env.review to show the proposed design; this mode stays noindex and must not be used for a public deployment.
- Updated privacy information and the public sitemap for the partnership page. Unapproved offers are not added to the sitemap.
- Added owner-inputs/OFFERS-AND-PARTNERSHIPS.md for final discount terms, actual joining benefits, referral arrangements and any genuine vacancies.

## Verification

All 26 automated checks passed. TypeScript checking passed. Normal public and review builds passed. Built-page verification covered 18 route/query combinations and 83 asset references in each mode, including the campaign gate and a career-interest deep link. The running local server returned the expected results for 17 routes and 83 assets; missing pages returned 404, private environment paths were blocked, public AI stayed off and automatic enquiry POST remained disabled.

The partnership desktop hero/navigation was visually inspected in a dedicated Chrome preview. A screenshot is saved in task outputs. Further UI input was stopped when human interaction was detected; the final mobile layouts and full browser form interactions still need a dedicated review. No claim of complete visual/accessibility certification is made.

## Still needed

Confirm the offer terms and real partnership benefits. Existing launch inputs remain: approved rates/catalogue, actual project/review content, image publication rights, fees/payment/warranty terms, hosting selection and real message-receipt checks. Public image generation remains off. No live deployment, Lovable edit, push or DNS change was performed.
