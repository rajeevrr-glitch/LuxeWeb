# LuxeInfra implementation backlog — version 2

Current implementation update: NEXT-STEPS-V22.md, README.md and workdone.md. The register below preserves the original proposed work; it is not an up-to-date statement of delivery, guide or pricing behavior.

19 October 2026. Companion to `LuxeInfra-Master-Blueprint-v2-2026-10-19.md`.

This records proposed work. “Present” means a local version 11 capability, not proof of a fully operated public service. Do not mark a feature complete because its screen exists.

## 1. Feature coverage register

| ID | Capability | Current position | Planned release | Dependency / completion evidence |
|---|---|---|---|---|
| F01 | Editorial homepage, preserved theme | Present; new conversion hierarchy needed | R1 | New primary journeys visible on mobile and desktop |
| F02 | CTA/button redesign | Planned | R1 | Repetitive primary-action arrows replaced; accessible states |
| F03 | Estimate/callback gateway | Planned | R1 | `/plan` offers both routes and optional detailed brief |
| F04 | Full-home estimate | Planned | R1, rate-gated | Approved module presets and validated scenarios |
| F05 | Kitchen/wardrobe estimate | Planned | R1, rate-gated | Explicit units, included work, quantities and finishes |
| F06 | Room-specific services | Present locally | R1 revalidation | Same catalogue drives UI, restore validation and pricing |
| F07 | Versioned pricing and bundles | New | R0/R1 | Approver, effective dates, audit and no double counting |
| F08 | Estimate result and comparison | New | R1 | Ungated range, assumptions, exclusions and editable tier |
| F09 | Callback request | New | R1 | Short form and durable server receipt |
| F10 | Reliable team notification | New | R1 | Queue, retry, failure alert and real inbox verification |
| F11 | Staff lead/task desk | Local prototype | R1 production adaptation | Authentication, ownership, permissions and due tasks |
| F12 | Consultation scheduling | Preferred-time input only | R1/R2 | Distinguish preference from confirmed booking |
| F13 | Room/service gallery | Present locally | R1 editorial review | Permissioned media, useful tags and relevant actions |
| F14 | Saved inspiration | Present locally | R1 integration | Context carries into estimate/callback without repeated questions |
| F15 | Style discovery | Present locally | R1 integration | Suggested direction visible without contact gate |
| F16 | Optional detailed project brief | Present as default long form | R1 restructure | Separate advanced route and migrated old links |
| F17 | Private floor-plan/photo uploads | Local pilot; public manual handoff | R2, storage-gated | Validation, privacy, retention and authorised access |
| F18 | Real project case studies | Structure; approved content pending | R1/R2 | Actual scope/media permissions and verified facts |
| F19 | Genuine testimonials | Samples hidden in public build | R2 content-gated | Approved source, attribution and publication permission |
| F20 | Materials comparisons | New | R2 | Verified specifications, trade-offs and relevant scope |
| F21 | Process/commercial terms | Process present; terms pending | R1/R2 | Actual timeline/payment/warranty/cancellation inputs |
| F22 | Useful guides/home tours | New editorial work | R2 | Original expert-reviewed content and real video rights |
| F23 | Location/serviceability pages | Broad region statement only | R1/R2 | True service clusters and visit arrangements |
| F24 | Room studio/photo brief | Local prototype | R1 honest preview | Functional planning without claiming active generation |
| F25 | Public AI concepts | Publicly disabled | R3 | Provider, spend, consent, quota, abuse and failure gates |
| F26 | Customer project area | New | R4 | Authorised actual project records and update owner |
| F27 | Versioned quote/change approvals | New | R2 internal; R4 customer view | Measured BOQ and auditable approvals |
| F28 | Care/snags and warranty access | Public contact only | R2/R4 | Actual aftercare owner and coverage |
| F29 | Customer referrals | New | R2 pilot | Approved eligibility, consent and reward terms |
| F30 | Partner applications/tracking | New | R2 pilot/R4 portal | Attribution, permissions and payout rules |
| F31 | Conversion/source measurement | New production setup | R1 | Correct event definitions, privacy and offline outcomes |
| F32 | Content/rate/claims administration | New | R0/R2 | Reviewed draft/publish workflow and evidence history |
| F33 | Accessibility/performance/search | Baseline prepared | Every release | Measured relevant checks; no unsupported certification |
| F34 | Deployment/backup/monitoring | Local release prepared | R1 | Selected host, durable data, restore test and rollback |
| F35 | Finance/EMI | No arrangement established | Evaluation | Provider agreement and complete approved terms |
| F36 | Franchise recruitment | No established programme | Evaluation | Proven repeatable business operations |
| F37 | Full 3D/floor-plan automation | Not implemented | Evaluation | Separate accuracy, cost and product case |
| F38 | Regional languages | Not implemented | R2 evaluation | Accurate copy and response capability |

## 2. Build sequence

### W01 — product contracts and owner decisions

Scope: agree serviceability, supported scope, rate units, default bundles, notification destination, enquiry owner and approved public claims. Prepare one catalogue contract with stable IDs and migration rules.

Depends on: owner decisions 1–5 in the companion sheet.

Done when: inputs are recorded, unknowns have an explicit deferred path, public claims have evidence/approval, and incompatible room/work combinations are defined for both UI and server use.

### W02 — pricing engine

Scope: authoritative rules, quantity/unit conversion, tier differences, bundle expansion, region/site rules, rounding, result snapshot/version, expiry and rate rollback.

Depends on: W01 approved pricing inputs. UI prototypes can progress with clearly labelled nonpublic fixtures; no public fabricated rupee results.

Done when: owner reference scenarios produce approved outputs; missing/expired/unsupported data is rejected or deferred; duplicates, count changes and unit conversions behave correctly. A minimum valid rate set can be activated independently of other scopes.

### W03 — reliable callback service and staff work queue

Scope: validated receipt endpoint, persistent lead/task storage, idempotency, notification outbox, real email setup, assignment, overdue/failure views and staff access.

Depends on: hosting/data choices, verified inboxes, staffing and privacy/retention decision.

Done when: a real authorised test reaches the receiving workflow; storage failure produces no success; notification failure does not lose the lead; duplicate retry creates one record; unauthorised users cannot read records.

### W04 — short journeys and CTA design

Scope: two-option gateway, four-panel-or-shorter estimate, compact result, four-required-field callback, useful loading/empty/error states and arrow-free primary controls.

Depends on: W01; integrate W02/W03 when ready.

Done when: a first-time mobile user can choose either route, view an available estimate without giving contact details, edit choices and request contact without a long brief or mandatory download. Validate the proposed short completion time before advertising a time claim.

### W05 — existing-feature integration and route migration

Scope: carry saved inspiration/style/room context across routes; move detailed planner to an optional route; migrate old bookmarks and stored choices; distinguish uploads needing manual handoff from a genuinely configured private upload service.

Depends on: W04 route contracts.

Done when: legitimate old links work, incompatible saved work is removed, customer inputs are not repeated or exposed in URLs, and a missing photo does not block a callback.

### W06 — evidence and decision support

Scope: approved case studies, review publication workflow, materials comparisons, truthful location pages, process/terms and searchable useful content.

Depends on: owner media/specification/terms approvals.

Done when: every published project/claim has its required evidence; sample content stays internal; materials and package statements agree with the offering and estimator.

### W07 — quality and deployment

Scope: real visitor test, route/asset/SEO checks, mobile/keyboard checks, pricing and receipt failure tests, secrets/private-file checks, usage alerts, backups/restoration and rollback.

Depends on: the actual R1 components being activated. W06 optional sections can remain unpublished if their evidence is missing.

Done when: the master acceptance checklist passes, the operational owner can find and action new leads, the release is saved separately, and the chosen host/domain path works on a review environment before traffic changes.

### W08 — controlled expansion

Scope: referrals and partner pilot, public AI, later customer area and quote/care visibility. Each is a separately flagged release with its own business and technical owner.

Depends on: stable receipt/operations; additional provider/access/cost decisions.

Done when: the relevant R2/R3/R4 gates pass. A feature can remain deferred without holding back the simpler working website.

## 3. High-value regression scenarios

| Test | Expected result |
|---|---|
| Stored bedroom contains an old kitchen option | Option removed before display/calculation; valid choices remain |
| Whole-home preset plus individually selected wardrobe | Same item is not billed twice |
| Feet changed to metres | Physical dimension and estimate remain equivalent within defined conversion/rounding tolerance |
| Unknown bathroom site conditions | Review-required scope is explicit; no invented all-in total |
| Rate set expires during a visit | Result refresh/review state; no silently changed old estimate |
| User retries a timed-out callback | One durable request/reference, not two leads |
| Email service fails after lead is stored | Request is retained and assigned; staff failure/retry visible |
| Database fails | No received/success claim; current-tab input retained |
| Someone guesses another receipt/project ID | No disclosure of contact details, files or project data |
| AI jobs start concurrently near quota | Server reservations prevent exceeding the approved allowance |
| Provider response is uncertain | Existing job reconciled; no automatic duplicate paid request |
| Visitor opens WhatsApp but never sends | Analytics records a click, not a received enquiry |
| Mobile keyboard/zoom opens | Primary action, consent and navigation remain usable |

## 4. Release-record rule

For each package, record: version/date, scope, actual status, tests completed, screenshots where useful, dependencies left, owner, deployment status and rollback path. Update `workdone.md` only with what was actually performed; planning a feature does not count as building it.

> Status update, 22 October 2026: this document retains the original planning baseline. BLUEPRINT-STATUS-V15.md records the current implementation status; LAUNCH-CHECKLIST.md records the current launch gates.
