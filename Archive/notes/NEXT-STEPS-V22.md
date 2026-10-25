# LuxeInfra — competitor-audit progress, version 22

24 October 2026. Local preparation only. This supplements the original blueprint and the 22 October UI audit; it does not replace the recorded business-input requirements.

## This pass: help visitors make a decision

- Saved inspiration now supports comparing up to three references, choosing the details the visitor likes and downloading a design-direction sheet. Fixed preference tags can accompany saved ideas in the short quote request. Optional written notes stay on the current page and are included only in an explicit download.
- The image viewer offers other references from the same room collection and a link to compare saved ideas. These are visual references, not claimed matching products, confirmed specifications or completed LuxeInfra projects.
- Four original planning guides cover the first design conversation, comparing quotations, kitchen planning and renovation priorities. They include related reading, practical questions and contextual next steps. Three have page-local preparation checklists and text downloads; the quotation guide opens the existing quotation-review checklist.
- The guides are linked from the homepage, Explore spaces menu, mobile menu, footer and materials page. Each article has its own title, description and canonical page; all five guide URLs are included in the sitemap.
- Removed unused globally mounted React Query/Sonner code, generated responsive WebP room shortcuts and restored keyboard focus when closing mobile navigation with Escape. Dependencies were not changed. Measurements and actual test coverage are in QA-REPORT-V22.md.

These changes address the audit's useful-gallery, practical-guides and technical-quality items. No claim is made that they outperform competitors or improve conversion without measured visitor outcomes.

## Other audit items already implemented

- Focused two-step quote entry; valid room/module/design context skips repeated project questions.
- BHK/size-first scope planning without contact capture while approved rates are unavailable.
- Room-appropriate detailed brief choices, optional room-photo briefing, saved ideas and style quiz.
- Clear Get a quote / Plan my interiors actions; simplified homepage; readable mobile welcome, later invitation timing and no floating overlap.
- Permanent client-stories/reviews section and partner entry. Public reviews/promotions remain approval-gated; labelled samples appear only in local review mode.
- Automatic submission foundation, private records and WhatsApp notification adapter. It remains disabled until connected and tested; see AUTOMATIC-DELIVERY-SETUP.md.

## Inputs and connections still needed

| Area | What is prepared | What is still needed |
| --- | --- | --- |
| Instant numerical estimates | Whole-home and modular planning/pricing structure | Approved rate list, units, inclusions, exclusions, tax treatment and real reference scenarios |
| Product/material comparison | Educational questions and a quotation checklist | Actual offered boards, finishes, hardware, product codes, dimensions and samples; meaningful tier differences |
| Real project proof | Gallery references and gated project/review structures | Permissioned project photos, scope, location, completed work details and genuine attributed reviews |
| Brand/local credibility | Confirmed broad service regions and contacts | Team profiles, genuine addresses/visit arrangements, hours and supported service clusters |
| Consultation/commercial clarity | Process explanation and preparation guides | Actual fees, payment/change/cancellation terms, schedules, warranty and aftercare responsibilities |
| Offer/partner benefits | Pages and introduction journeys | Approved dates, eligibility, exclusions, reward/referral and partnership terms |
| Automatic WhatsApp receipt | Server adapter and private submission flow | Host, durable storage, receiving team number/consent, approved template/account settings and actual receipt/recovery tests |
| Public AI images | Disabled provider-ready foundation/manual room brief | Provider account, server key, approved budget/limits, consent and controlled live tests |
| Measurement | No advertising or analytics trackers added | Approved analytics destination, privacy/event definitions and a process for recording qualified leads and actual sales |
| Launch/operations | Local public/review builds and Node server | Image rights, final owner approval, chosen host, secure configuration, domain connection, backups and real-device checks |

Do not deploy the review build. Do not activate placeholder prices, sample reviews or proposed offers as business facts. A source snapshot does not publish the new site or modify Lovable/GoDaddy.
