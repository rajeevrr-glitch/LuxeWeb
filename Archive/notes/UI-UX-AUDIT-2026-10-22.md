# LuxeInfra UI and customer-journey audit

Reviewed: 22 October 2026. Baseline: local version 18 at http://127.0.0.1:3000/.

## Product judgement

LuxeInfra has a coherent navy/ivory identity, appealing interior imagery, a shortlist, relevant room choices and a useful foundation for two enquiry journeys. The largest remaining gap is decision confidence: visitors can explore attractive references, but cannot yet verify much completed work, compare actual specifications, receive an approved budget or complete an automatically delivered enquiry.

The next refinement should prioritise clear choices, evidence and reliable follow-through. Adding more homepage sections or animation alone will not resolve those gaps. This is an expert review, not evidence of a measured conversion uplift or a claim that the competitors deliver their advertised promises.

## Scope and evidence

- Inspected LuxeInfra's desktop homepage, welcome invitation, budget entry, contextual quick quote and kitchen gallery/lightbox in the browser. Checked the existing narrow homepage and welcome invitation. Inspected source for pricing, approved content, campaign gates, service routing, About and process copy.
- Desktop local inspection: 1280 × 720 CSS viewport. Narrow local inspection: 320px content width within the 335 × 604 preview capture. No claim of complete physical-phone or cross-browser coverage.
- Opened current Livspace and HomeLane homepages. Navigated Livspace's BHK, area, room-count, package and contact screens; navigated HomeLane's BHK/purpose and contact gate. Stopped before entering personal information or submitting either form. Read official portfolio and product pages.
- No UI/source implementation was changed by this audit. No enquiry was sent, account changed, paid API called, deployment performed or DNS edited.
- The local review build deliberately shows labelled sample reviews and a proposed 15% campaign. Approved review/project lists are empty and campaign approval is false. The ordinary public build gates that material. The findings below concern missing genuine launch content, not a claim that fake testimonials are currently published.

## What competitors currently do better

| Area | Observed competitor implementation | Lesson for LuxeInfra |
| --- | --- | --- |
| Buying reassurance | Livspace puts advertised delivery/warranty/quality signals alongside inspiration and named customer feedback. HomeLane similarly foregrounds commercial reassurance. These remain company claims with applicable conditions. [Livspace](https://www.livspace.com/in), [HomeLane](https://www.homelane.com/) | Replace generic benefit statements with a few verifiable promises and supporting evidence. |
| Brief-to-budget structure | Livspace's live flow asks BHK, then reveals size options; 2 BHK showed below/above 800 sq ft. Room counts and three package choices follow, then contact details. Its published calculator explains the assumptions. Final post-submission price/receipt was not tested. [Calculator](https://www.livspace.com/in/interiors/home-interior-price-calculator) | Our BHK/size opening is already comparable. The missing value is approved pricing and a meaningful result. |
| Short initial commitment | HomeLane's inspected estimator starts with BHK and purpose, then displays a contact gate over three specification alternatives with masked prices. It does not give an ungated final price in the inspected path. [Estimator](https://www.homelane.com/quotes/estimate-flow) | Keep the first decision small and show what the visitor will receive. Do not imply the competitor needs no contact details. |
| Project evidence | Livspace's delivered-project catalogue includes locality/project name, BHK, work scope, photographs and indicative project price bands. These are publisher-presented projects, not independently verified installations. [Delivered projects](https://www.livspace.com/in/livspace-portfolio/delivered-projects) | Three informative genuine case studies can be more useful than a large anonymous image gallery. |
| Useful design detail | A HomeLane kitchen detail page identifies layout, dimensions, cabinet material, finish and functional features. [Example kitchen](https://www.homelane.com/interior-design/modular-kitchen-design/coastal-chic-modular-kitchen-design-cid-HLKT00000834) | Turn our anonymous references into explainable designs, using only verified metadata. |
| Consultation expectations | HomeLane describes the designer session and subsequent payment/execution stages on its homepage. It links location discovery separately. [HomeLane](https://www.homelane.com/), [Locations](https://www.homelane.com/cities) | Explain the consultation output, fees if any, next action and who handles the project. Publish our own terms. |

The competitors also have dense menus, long pages, repeated sales prompts and lead gates. Their scale does not establish that every UI choice is better. We should adopt useful decision support while keeping LuxeInfra calmer and easier to understand.

## Prioritised issue register

P0 = resolve before treating this as a dependable lead-generation launch. P1 = next conversion/usability pass. P2 = differentiation and broader quality work. Effort estimates are relative, not delivery promises.

| ID | Priority / area | Observed problem and likely consequence | Recommended refinement | Dependency |
| --- | --- | --- | --- | --- |
| 01 | P0 — Enquiry completion | Quote, welcome and budget forms prepare a request. The visitor must then open and send WhatsApp/email. Finishing the form does not deliver a lead to staff. Honest disclosure helps, but the extra action creates an abandonment point and prevents a dependable received-request state. | Prefer reliable hosted intake with delivery status and a real acknowledgement; keep WhatsApp as an alternative. If launching with manual handoff, make that action the prominent final step and count draft preparation separately from confirmed delivery. | Hosting/delivery choice and an actual receipt test. UI wording can be refined now. |
| 02 | P0 — Budget promise | The header says “Cost calculator”; approvedRateBook is unapproved and empty. Visitors answer questions and give contact details, but the fallback contains no rupee range. The later disclosure is accurate; the entry label still sets a stronger expectation. | Until rates are approved, call this a scope/planning journey and state upfront that the studio prices it. Once rates are ready, show a range, actual inclusions/exclusions, taxes, assumptions and expiry. Keep instant budget distinct from quick quote. | Owner-approved modular AND whole-home rates. Renaming/expectation clarity needs no rates. |
| 03 | P0 — Genuine trust | The review build has labelled layout samples; approved customer reviews and project stories remain empty. Illustration cannot establish workmanship or customer satisfaction. | Launch with genuine project photography, identifiable scope/locality, owner-approved review text and permission to publish. Put a compact proof strip near the first decision. A verified external review link is preferable to an invented aggregate star rating. | Owner projects/reviews and image rights. |
| 04 | P1 — Mobile overlap | On the inspected homepage at 320px content width, the floating welcome launcher intersects the hero's “Explore design ideas” link by about 30 × 39px. Header quote action, bottom quote/budget bar and floating launcher also repeat competing invitations. | Reserve one mobile action zone, prevent launcher/content overlap and give content sufficient safe spacing. Show a compact invitation only where it does not obstruct other controls. | UI only; verify at 320/360/390px and with zoom. |
| 05 | P1 — Mobile readability | Measured welcome labels are 9px, the question 10px, guidance/exit/budget alternatives 8px. Secondary actions are about 13–19px high; the close control is styled at 29 × 29px. Fitting everything into the panel has reduced legibility and tap comfort. | Use readable body/choice text, larger exit targets and simpler mobile content. Allow intentional panel scrolling or a shorter image rather than shrinking critical words. Aim for comfortable 44px action targets where feasible. | UI only. These observations are not a full accessibility certification. |
| 06 | P1 — Arrival timing | A first-visit invitation opens after 1.8 seconds on eligible browsing routes, covering the designs before many visitors have assessed the brand. Once-per-tab and easy dismissal are good safeguards. | Preserve the requested invitation, but compare delayed/engagement-based opening against immediate opening. Avoid repeat prompts after dismissal and during active journeys. Measure qualified enquiries and dismissals, not popup opens alone. | UI experiment plus analytics. No drop-off percentage is claimed. |
| 07 | P1 — Hero positioning | The hero describes a beautiful personalised home, but gives little concrete reason to choose this business. The same style of promise appears throughout the page. The logo also combines a very small mark with a text wordmark. | Use a clearer service headline, one real differentiator, compact service coverage and one verified proof item. Keep the navy/ivory palette and image-led composition; simplify the logo lockup. | UI/copy now; real differentiator/proof from owner. |
| 08 | P1 — Information hierarchy | The homepage is approximately 8,359px high in the inspected desktop state. Room navigation, solutions, gallery, BHK plans and additional differentiator blocks repeat related decisions. Length alone is not a defect; duplication weakens emphasis. | Consolidate into an intentional sequence: promise → proof → solutions → relevant designs → budget/quote choice → process/reassurance → final action. Move secondary tools deeper into browsing. | UI/content editing. |
| 09 | P1 — CTA consistency | Similar destinations use many labels: personalised quote, conversation, plan a space, talk interiors and brief. They do not consistently explain the next action or outcome. | Establish two primary journeys and stable names. Use “Get a quote” / “Request a callback” only with accurate delivery expectations; use “Estimate my budget” only when numerical pricing works. Use visual hierarchy and clear selected states instead of adding decorative icons everywhere. | UI/copy. |
| 10 | P1 — Form focus | The budget page retains promotional/header/category navigation and a large introduction. At 1280 × 720 the BHK cards extend below the first screen; the next action is further down. A four-stage progress bar sits beside “Step 1 of 3.” | Use a compact form shell, consistent progress language, a visible current selection and an accessible next-action area. Explain three input steps plus a result, or count all four consistently. | UI only. |
| 11 | P1 — Repeated project question | A quote entered with Master bedroom context correctly preselects Selected rooms, but still opens the general six-card project chooser. The services page still says “Build my brief” and routes kitchen/storage through the generic planner. | When context is valid, open the short contact step with a visible editable summary. Send kitchen/wardrobe visitors to their relevant journey. Keep a detailed brief optional for customers who want it. | UI/routing; preserve all existing context. |
| 12 | P1 — Gallery usefulness | The kitchen detail modal contains a reference number, image and save/next controls. It has no verified layout, fit, finish, functional benefit or direct design-specific quote action. | Add human titles and a compact information panel, relevant similar designs and a quote action that carries this design. Clearly separate references from completed projects. | UI now; accurate design metadata and rights from owner. Never infer dimensions/materials from a photo. |
| 13 | P1 — Materials and specifications | The materials guide explains questions to ask, but does not let a customer compare actual offered boards, finishes, hardware, included quantities and exclusions. Working tier names alone are insufficient. | Build a side-by-side specification matrix from the real catalogue. Show practical trade-offs and what changes in the quote. Keep undecided visitors able to ask for advice. | Owner catalogue/specification/rate inputs. |
| 14 | P1 — Business identity and local confidence | About is largely generic approach copy plus service regions. The reviewed content does not identify a founder/designer, a genuine studio/team, confirmed visit arrangements or detailed local examples. | Add a credible team introduction, authentic photographs and city-relevant projects. Publish a real address/visit process and hours only if applicable; do not invent showrooms. | Owner business details/media. |
| 15 | P1 — Consultation and commercial clarity | Process copy says details will be agreed, but cannot yet answer exact design/consultation fees, deliverables, payment milestones, support/warranty or cancellation/change terms. | Add a concise “what happens next” panel and a straightforward commercial FAQ. State response windows only when operationally supportable. | Owner-confirmed terms; existing pending-input notes remain applicable. |
| 16 | P2 — Public readiness of optional features | Room studio currently prepares a photo-based brief; public AI generation is disabled. The 15% campaign is only a review proposal. Partnership enquiries have no approved incentive programme yet. | Describe each feature by its actual available outcome. Enable AI and offers only when configured and supportable. Keep partnership acquisition secondary to homeowner actions. | API/hosting configuration and owner campaign/partner terms. |
| 17 | P2 — Measurement | Visual and functional checks do not reveal where real customers abandon or which channels produce qualified leads. A WhatsApp link click is not proof of a received enquiry. | Track journey entry, step completion, validation errors, popup dismissal, handoff click and confirmed delivery separately. Evaluate qualified consultation requests and eventual projects, using appropriate privacy choices. | Analytics/delivery design. |
| 18 | P2 — Performance/accessibility validation | This review found concrete small-text/overlap problems, but did not benchmark field speed, slower-network image loading, all keyboard paths, zoom or screen-reader journeys. | Test representative physical phones, image loading, font loading, contrast, zoom, keyboard/focus and reduced motion. Record measurements before claiming speed or accessibility superiority. | QA pass on the intended production build/host. |

## Proposed refinement sequence

### Pass 1: Fix usability and expectation gaps

1. Repair the narrow-screen overlap and welcome typography/exit targets.
2. Simplify the form shell, reconcile progress and skip repeated project selection when context is already known.
3. Standardise quote/budget labels and state the unpriced outcome before collecting details.
4. Consolidate homepage repetition and give the main hero a concrete proposition.
5. Retain the requested popup while testing a less interruptive trigger.

Acceptance: no blocked controls at narrow widths; readable form choices; one understandable next action per step; relevant room context retained; no implied automatic submission or instant price that is unavailable.

### Pass 2: Make the content help a customer buy

1. Add three genuine case studies and three permissioned reviews, prioritising our service regions.
2. Turn the best catalogue references into informative design detail pages.
3. Populate real specification comparisons and activate approved modular/whole-home rate ranges.
4. Add team/local identity and confirmed consultation/commercial information.

Acceptance: a visitor can understand who will do the work, see relevant evidence, compare scope/specifications and understand a price's limitations.

### Pass 3: Make enquiries operationally dependable

1. Choose hosting and configure reliable intake/notifications if automatic delivery is selected.
2. Test actual receipt, retry/failure handling and honest acknowledgement states.
3. Add meaningful funnel measurement and conduct device/performance/accessibility checks.
4. Release AI generation and campaigns only after their own configuration and approval checks.

Acceptance: staff genuinely receive requests through the chosen route; customer messaging matches what happened; failures have a recovery path; production content gates and indexing are correct.

## A defensible LuxeInfra advantage

Proposed positioning: a transparent, locally accountable interiors service that helps customers understand what they are choosing.

Make that tangible through an itemised scope, understandable material alternatives, relevant local before/after cases, a named contact and a short path from a saved design to a conversation. These are proposed commitments; publish them only when the business can deliver them. The shortlist and room-photo starting point are useful foundations, but should feed the same short enquiry journey rather than becoming additional forms to complete.

## Inputs still needed from the owner

- Approved modular and whole-home rate list, quantities/units, applicable taxes, inclusions/exclusions and validity.
- Catalogue/specification differences: boards, finishes, hardware, brands actually offered and verified design metadata.
- Genuine project photos, location/BHK/scope, optional approved budget bands, publication rights and permissioned customer feedback.
- Team/studio/visit details and precise service arrangements.
- Consultation/design fees, deliverables, payment milestones, change/cancellation and warranty/aftercare terms.
- Actual offer dates/eligible amount/exclusions and any partner incentives.
- Hosting/delivery choice and AI account configuration when ready. Do not put secret API keys in this report.

## Evidence files

Saved under `outputs/ui-audit-2026-10-22/`:

- `luxe-desktop-home.png` — homepage hierarchy after invitation dismissal.
- `luxe-desktop-welcome.png` — desktop invitation.
- `luxe-mobile-home.png` — competing actions/launcher overlap.
- `luxe-mobile-welcome.png` — compact labels and exit controls.
- `luxe-desktop-estimate.png` — form hierarchy and progress count.
- `luxe-desktop-quote.png` — contextual quote still opens project cards.
- `luxe-gallery-detail.png` — reference modal with limited purchase context.
- `livspace-contact-gate.png` — final inspected calculator contact step, without submission.
- `homelane-contact-gate.png` — contact gate over masked specification alternatives, without submission.

Read-only DOM measurement: mobile launcher x=140.5, y=473.625, width=164.5, height=45.375; hero action x=38, y≈477.104, width≈132.677, height=39. Intersection ≈30.177 × 39 CSS pixels. This is a specific observed viewport/scroll position, not an assertion that every screen is obstructed.

No changes have been implemented from this report. It is the proposed refinement backlog for owner review.

## Follow-up implementation — 23 October 2026

The original findings above are preserved as the version 18 baseline. The owner subsequently authorised all improvements that could proceed without further business inputs. Version 19 implements the usability, hierarchy, scope-planning, context-routing, invitation and gallery/handoff refinements described in UI-REFINEMENTS-V19.md. QA-REPORT-V19.md records actual checks; owner-inputs/AFTER-UI-AUDIT-V19.md separates the remaining genuine-content, commercial and configuration decisions.

## Next audit pass — version 22, 24 October 2026

Gallery usefulness now includes comparing up to three saved references, fixed favourite-detail tags and other references from the same room edit. The practical-guide backlog now has four original articles with preparation/review tools and contextual next steps. The material page links the quotation-comparison guide; actual offered-product/specification comparisons still need the owner's catalogue.

Technical work removed unused global code, added responsive room thumbnails and corrected mobile Escape focus. Automatic notification infrastructure was built in version 21 and remains disabled until connected. NEXT-STEPS-V22.md consolidates the current status and business-input dependencies; QA-REPORT-V22.md records 77 tests, rendered-route/server checks, desktop/narrow browser coverage and remaining limits. Genuine proof, rates, terms, analytics configuration and production operations are not marked complete merely because UI exists.
