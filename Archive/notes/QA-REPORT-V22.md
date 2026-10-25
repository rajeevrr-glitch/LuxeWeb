# Decision-support verification — version 22

23–24 October 2026. Local review only. Companion: NEXT-STEPS-V22.md.

## Automated checks

- 77 automated tests passed. New comparison coverage checks the three-known-reference limit, fixed preference allow-list, current catalogue titles, explicit-only notes, 180-character note bound, malformed data and a deliberately empty comparison surviving reload.
- Strict TypeScript, zero-warning lint and formatting passed. No dependency additions or version changes.
- Public and review builds each pass 29 rendered route/query checks and 99 referenced assets. Added guide collection/articles, saved-ideas rendering, article discovery/context links and unknown-guide 404 coverage. Canonical/social metadata, one main heading, missing pages, review/campaign gates and existing quote/estimate behavior remain checked.
- All four guide articles and their collection are included in the production sitemap. Final server checked 11 page paths, 67 assets and all 27 sitemap pages, with noindex, private paths blocked, unknown-guide 404, legacy intake 405 and unconfigured automatic intake 503. Counts are saved in outputs/review-v22/live-smoke.json.

## Actual browser checks

- Desktop 1280px-wide preview: guide collection and article reading, preparation anchor and a native checklist tick changing the visible count from 0 to 1 of 4.
- Quotation guide link opens the existing process-page quotation checklist with its containing drawer expanded. The checklist was visibly present, not hidden behind a closed disclosure.
- Three saved designs display in comparison. A fixed Colour palette preference persists after navigating away; a synthetic written note clears when leaving. The short quote contact step shows its optional include-saved-ideas checkbox with comparison choices. No contact form was submitted.
- Related kitchen reference buttons changed the viewer from reference 01 to 04 and updated the quote URL to design=kitchen-4. A fourth reference was temporarily saved, the comparison correctly refused adding a fourth with an accessible explanation, and the extra test reference was removed to restore the original three saved ideas.
- Narrow preview: 335px viewport with 320px document content. Comparison cards measure 288px wide with no horizontal overflow; preference targets measure 44px high; note fields render at 16px and are empty after leaving/reloading. Cards stack vertically.
- Mobile menu opened and closed with Escape; focus returned to Open menu. Planning guides is available in that menu.
- Save guide and Download my direction buttons were activated. Their resulting files were not independently inspected in the in-app browser; comparison text generation and explicit-only note behavior have automated coverage. Physical-browser download behavior remains part of release-device checks.

## Performance measurements

- Before/after JavaScript measurements are stored in bundle-before.json and bundle-after.json. Main entry: 513,077 to 465,872 bytes; gzip: 164,921 to 152,367 bytes. The unused globally mounted React Query provider and Sonner notification renderer were removed; existing routing still builds and renders. Packages remain in the dependency manifest for now.
- Eight original room shortcut JPEGs total 759,826 bytes. Generated 160px WebP sources total 27,226 bytes; the 320px set totals 72,314 bytes. A responsive browser chooses one variant per room. These are source-file comparisons, not a claim about total page transfer or real-world loading time.
- Room shortcuts use responsive image sources, lazy loading and asynchronous decoding. Main hero priority is retained. Thumbnail inlining is disabled specifically for that folder so the images stay outside JavaScript and can be cached independently. Existing source photos are preserved; generated sizes can be reproduced with scripts/build-room-thumbnails.mjs.
- No Lighthouse/Core Web Vitals score, complete WCAG certification or conversion improvement is claimed.

## Boundaries

The preview contains explicitly labelled sample/proposed review content and must not be deployed as the public build. Numerical prices, genuine projects/reviews, actual product specifications and commercial terms still need owner input. Existing image publication rights still need confirmation.

Automatic enquiry delivery and public AI remain disabled until connected and verified. This pass sent no real enquiry, WhatsApp/API message or paid generation call, and did not publish, push source, edit Lovable or change GoDaddy/DNS.

See outputs/review-v22 for screenshots, browser summaries and quality/build logs. Full-device testing, assistive-technology testing, actual business receipt and production-host/domain checks remain open.
