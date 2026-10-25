# LuxeInfra — launch checklist

Updated 24 October 2026. Current version: 22. Read NEXT-STEPS-V22.md for the current audit/input register and QA-REPORT-V22.md for checks. Comparison and practical guides are implemented. Automatic delivery remains disabled until connected; see AUTOMATIC-DELIVERY-SETUP.md and owner-inputs/AUTOMATIC-DELIVERY-CONNECTION.md. This is a launch preparation build, not a published website. Earlier pass descriptions below are historical; work history is in workdone.md.

## Required before publishing

Version 20 now opens WhatsApp directly after validated submission. This removes an extra click but does not deliver a message until the visitor presses Send. See owner-inputs/WHATSAPP-DELIVERY-V20.md for automatic API delivery, which is not configured. Actual business receipt must still be tested by the owner.

| Item | Current position | Next action |
| --- | --- | --- |
| Image publication rights | Existing inspiration images are clearly described as references, not completed projects | Owner to confirm permission to publish all retained images, or provide approved replacements |
| Hosting account | Node 24 server/build prepared; domain is managed through GoDaddy; present live site appears to use Lovable | Choose the host/account and deploy the normal build to a review URL |
| Final browser review | V18 welcome popup passed narrow in-app checks: automatic opening, dynamic selection, phone validation, draft targets, Escape/focus, clearing, session suppression and 2 BHK budget entry. Prior reports cover earlier screens | Approve the appearance; finish wider-desktop/physical-device and remaining full form branches before launch. See QA-REPORT-V18.md and the historical v17 limits |
| Message receipt | Draft addresses and destinations checked; no actual message sent during development | Owner to send a real WhatsApp and email test and confirm receipt in both mailboxes; attach one sample file manually |
| Public wording/contact sign-off | Confirmed phone numbers, email addresses and broad regions are present | Confirm final business wording, serviceable locations and any fees/terms actually offered |
| Domain launch | No DNS/hosting change made | Back up current website DNS; connect apex/www to the chosen host, verify HTTPS and redirects, preserve mail records and keep rollback available |
| Search indexing | Local/staging server stays noindex | Enable INDEXABLE=true only on the approved final domain; verify canonical URLs, robots.txt and sitemap.xml there |

## Features that can remain inactive at first launch

| Feature | Current safe behavior | To activate later |
| --- | --- | --- |
| Instant rupee estimates | Scope/budget planning works; no fictional prices are shown | Approve both modular and whole-home rates, units, specifications, inclusions/exclusions, taxes, validity and reference quotes |
| 15% festive offer | Normal public build hides the proposal; review mode labels it Preview | Confirm booking dates, eligible amount, exclusions, minimum/cap, taxes, payments and final terms; see owner-inputs/OFFERS-AND-PARTNERSHIPS.md |
| Project stories and reviews | Reviews link and homepage section stay visible; normal public build uses approved reviews or an invitation. Labelled examples appear only in local review mode. Projects remain approval-gated | Supply genuine content, attribution and publication permission; replace sample layout copy before publishing genuine testimonials |
| Detailed catalogue/tier comparison | Materials guidance and illustrative palettes only | Supply actual catalogue/specification differences and permitted product media |
| Partnership rewards / vacancies | Short introductions work; no commissions, jobs or projects are promised | Supply approved benefits, referral arrangements, selection process and any genuine vacancies |
| Public AI image generation | Disabled; room-photo briefing remains available | Choose a provider/account and approve deployment, budget/abuse controls, private storage and the updated data flow |
| Automatic callback delivery / CRM | Visitor sends via WhatsApp/email; no false receipt | Configure durable storage, team access, notification delivery and end-to-end receipt verification |

The existing consultation/design fees, payments, cancellation/change policy, warranties and aftercare details are still awaiting owner input. The website does not invent those promises. Supplying these documents is separate from enabling prices or campaigns.

## Remaining blueprint work

BLUEPRINT-STATUS-V15.md audits all 38 feature IDs. Later work includes automatic lead delivery/staff operations, booking availability, customer project access, quote/change approvals, care workflows, referral/partner tracking, content/rate administration, measurement and additional local/editorial pages. Finance/EMI, franchise, full 3D automation and regional languages remain evaluation items; they are not presented as working services.

## Technical checks in this cleanup

Unused templates/dependencies removed; strict type checking, linting, consistent formatting, tests, public/review builds and route/asset checks are recorded in RELEASE-VERIFICATION.md. No deployment, genuine message receipt, full accessibility certification, independent speed score or load-test result is implied by those checks.

## Current UI pass — version 19, 24 October 2026

UI-REFINEMENTS-V19.md records the audit corrections and QA-REPORT-V19.md records their checks. The unpriced planner now provides a scope summary without contact details; quote context is carried forward and valid contextual entries skip the repeated chooser. Readable mobile controls and the removal of floating invitations address the observed overlap/legibility defects.

Before launch, resolve owner-inputs/AFTER-UI-AUDIT-V19.md: genuine project/review/media permission, real rate/specification data, commercial terms, campaign approvals, hosting/delivery and any analytics/AI configuration. Complete actual receipt testing and production-domain/device checks. The local review build still contains labelled examples/proposals and must not be deployed publicly.
