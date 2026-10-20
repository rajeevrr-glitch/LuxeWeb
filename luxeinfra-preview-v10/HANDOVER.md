# LuxeInfra - version 10

Prepared 17 October 2026. Adds the testimonial collection and owner guidance for image generation.

## Included

- A new /testimonials page with a featured review layout and two supporting review cards.
- Three example stories covering whole-home interiors, kitchen/storage and a room redesign.
- Every example is explicitly labelled as sample copy, with placeholder attribution and no invented rating, review count or customer identity.
- A clearly labelled testimonial preview on the homepage.
- Testimonials links in desktop navigation, mobile navigation and the footer. The menu switches to its compact layout earlier to avoid crowding.
- A noindex directive on the sample testimonial page. Remove it only after replacing examples with approved content for launch.
- TESTIMONIALS-TO-PROVIDE.md: a template for the client's exact words, approved name, project details, source and publication permission.
- PICTURE-API-NEXT-STEPS.md: the current account setup, cost explanation and connection steps, based on official OpenAI documentation.

## Verification

The page was visually checked at desktop and 390px mobile widths. No horizontal overflow was observed on the checked mobile homepage or testimonial page. The mobile menu entry and homepage testimonial link both opened the new page. TypeScript and the production build both passed.

The image adapter and its configuration were not changed. Generation remains disconnected. No AI request or external enquiry was sent. Existing backend tests were not rerun for this content/layout change; all 13 last passed in version 7.

## Open and update

Run Start-preview.cmd and open http://127.0.0.1:5173/testimonials. Close any other preview server before starting another version on the same ports.

Example content is centralised in src/lib/testimonials.ts and reused by the homepage and testimonial page. Replace it with approved client wording and attribution before removing sample labels. Inspiration imagery is not presented as a client project.

Saved source and ZIP exclude credentials, private enquiries, installed dependencies and generated build output. Earlier versions and the original Lovable export remain unchanged. Nothing was published or pushed, and GoDaddy/Lovable settings were not modified.

