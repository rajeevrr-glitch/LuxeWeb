# LuxeInfra — sales journey review and redesign

22 October 2026. Version 17; local preview only.

## Sales assessment

The previous opening was less persuasive than it could be. It asked for location before giving visitors an easy choice, introduced technical cabinet measurements early, and used broad headings instead of explaining the next useful outcome. The short quote form opened on personal fields, which gave a cold visitor little reason to begin. These are design judgments, not measured conversion findings.

The revised approach earns the next click through relevant choices. It separates a quick personal-quote request from a more qualified budget-planning journey. Contact fields come after project choices, before the budget/plan result. There is no claim that this has increased conversion yet.

## Livspace reference and limits

Livspace's public calculator page describes a sequence of BHK type, home size, rooms and package preference. Its FAQ says its experts reach out after details are filled. The interactive quiz linked from that page could not be read by the web research tool; later Windows browser inspection was stopped because the tool could not reliably determine the current browser URL. Its exact live thresholds, contact fields and submission behavior were therefore not independently verified in this pass.

Source checked 22 October 2026: [Livspace full-home price calculator](https://www.livspace.com/in/interiors/home-interior-price-calculator).

The 2 BHK / 800 sq ft split below follows the owner's requested example. Other bands are working LuxeInfra discovery choices, not quoted competitor data or approved commercial rates. No competitor branding, imagery, packages or prices were copied.

## Implemented budget journey

1. **Your home:** a default full-home entry with visual floor-plan cards: 1 RK, 1 BHK, 2 BHK, 3 BHK, 4 BHK and 5+ BHK. Kitchen/wardrobe and selected-room entries remain separate and relevant. Existing query links preserve room/module context immediately in the rendered opening screen.
2. **Approximate size:** up to / above the configuration's threshold, or Not sure. Exact carpet area is optional and collapsed. Changing BHK clears the previous size so contradictory selections do not carry forward. Legacy ambiguous 4+ BHK entries ask the visitor to choose a current configuration.
3. **Your interiors:** new home or renovation, plus a storage-finish preference or Guide me. Modular cabinet frontage stays optional and hidden behind a disclosure. It is never substituted with floor area.
4. **Your details:** name, mobile, city and region. An optional disclosure offers email and a preferred call window. Contact identity, phone, email and call preference remain page-local; only non-contact planning preferences/location stay in tab session storage.
5. **Your plan/result:** relevant choices, location and a ready-to-share request. When approved matching rates exist, an indicative range can appear after valid contact details. Until then, the page clearly offers a tailored quotation and says an instant price is unavailable. WhatsApp and email options carry the complete relevant context.

Working discovery thresholds:

| Configuration | Up-to / above split |
| --- | --- |
| 1 RK | 400 sq ft |
| 1 BHK | 600 sq ft |
| 2 BHK | 800 sq ft |
| 3 BHK | 1,200 sq ft |
| 4 BHK | 1,600 sq ft |
| 5+ BHK | 2,000 sq ft |

These are carpet-area discovery bands. Above has no implied upper limit. A band never becomes a guessed exact measurement. A rate must explicitly approve that configuration/band/package; measured-area-only rates do not price a band. Conflicting exact sizes or narrower rate bounds fall back to review. Unknown sizes also fall back to review. Actual package scope, quantities, taxes, exclusions and validity still need owner approval.

## Implemented quick quote journey

1. Choose Full home, Kitchen, Wardrobes, Selected rooms, Renovation or Help me decide. Existing bedroom links preselect Selected rooms and show the chosen bedroom.
2. Add the four essentials, with optional call/email preferences. Relevant saved budget/material/style/inspiration context is retained. No technical measurements are required.
3. Review and send through WhatsApp or email. Direct call numbers remain available. There is no fake appointment or received-lead confirmation.

Visual changes include an image-led navy/champagne quote opening, smaller focused question panels, architectural BHK cards, visible selection ticks, a clear progress indicator, warm material swatches, a live project summary, stronger action labels and responsive layouts. The ivory/blue theme remains. Homepage and gateway wording now explain that contact details come at the end.

## Lead acquisition: current reality

Entering contact details prepares a browser-local draft. It does **not** create a record for the sales team. A lead reaches LuxeInfra when the visitor sends the WhatsApp or email message. This preserves the previously agreed delivery arrangement and is stated in the interface. Preferences are not confirmed appointments. No message was sent during this work.

To acquire leads automatically like a connected sales funnel, the next implementation needs a chosen production host, durable intake, consent/retention rules, abuse protection, deduplication, team notification with retries and verified receipt. The screen should say Received only after a durable server acknowledgement. The sales process then needs an assigned owner, a real response target and a way to record qualification, visit, quotation and outcome. These operational services are not activated by changing the UI.

Useful measurements after launch: journey starts, BHK/size completion, contact-step abandonment, valid submissions or outbound handoffs, actual received leads, qualified opportunities, site visits, quotations and closed projects. Distinguish handoff clicks from received leads. No advertising tracker or conversion experiment was installed in this version.

## Owner inputs and approval

- Confirm or adjust the discovery cutoffs above.
- Supply approved whole-home packages and modular rates with scope/quantities, materials, region/new-home/renovation differences, units, taxes, exclusions and validity. Supply representative quotes to verify the result.
- Approve the new visual journeys after previewing them; new browser visual/interaction verification remains open because of the tool restriction.
- Choose whether to retain manual WhatsApp/email delivery for launch or connect automatic intake with the selected hosting service.

See QA-REPORT-V17.md for checks and limitations; workdone.md records the change history. No public publishing, Lovable edit or DNS change was made.
