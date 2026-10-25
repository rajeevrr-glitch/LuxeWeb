# LuxeInfra — blueprint status at version 15

Current implementation supplement: NEXT-STEPS-V22.md (23 October 2026), including F14/F22 comparison and practical guides, F33 technical improvements and the remaining owner inputs. The version 15–17 descriptions below are historical, not the current delivery or pricing behavior. See README.md and workdone.md.

22 October 2026. Current implementation audit against the 38-feature backlog. A built screen is not treated as a running business service. All work remains local; nothing has been published by this task.

## Version 16 supplement

Version 17 supersedes the quote/budget UI described in earlier checks. F03/F04/F05/F08/F09 now use progressive project choices, BHK/size bands for whole homes, contact details before the final plan/result, optional call/email preferences and manual handoff. Explicit approved band packages can price an approximate size; real rates remain inactive. New visual/browser checks could not run because of the Computer Use URL policy restriction. See SALES-REVIEW-V17.md and QA-REPORT-V17.md; do not treat v16 screenshots as verification of these replacement screens.

The table below preserves the version 15 audit. In version 16, F19 now has permanent Reviews navigation, a visible homepage section and dedicated page, plus clearly labelled example cards in local review mode only. The normal public build uses approved/permissioned reviews or an invitation. Genuine reviews still need owner input.

Representative browser checks progressed for F01/F02/F08/F09/F13/F14/F30/F33: desktop navigation and phone validation/drafts; mobile Reviews/menu, whole-home selection/handoff, kitchen search/save/viewer/Next/close, saved-state retention and partnership introduction. The viewer typography and review anchor overlap were fixed. This is scoped verification, not full device/accessibility sign-off. See QA-REPORT-V16.md for evidence and remaining branches; owner approval, image rights, hosting and real receipt remain open.

## Original version 15 audit

| ID | Feature | What exists now | What remains |
| --- | --- | --- | --- |
| F01 | Homepage | Image-led service homepage, room selector, inspiration, materials and partner entry | Final mobile/browser sign-off; permissioned final imagery/content |
| F02 | Calls to action | New primary controls and short quote/budget entries | Final accessibility/interaction review |
| F03 | Two starting journeys | /plan routes to /estimate or /callback; detailed brief optional | Hosting and production review |
| F04 | Whole-home estimate | Configuration, scope, area/finish choices and calculation foundation | Approved package rates, specifications and real reference scenarios |
| F05 | Kitchen/wardrobe estimate | Separate modules, frontage measurements and calculation foundation | Approved units/rates, actual inclusions and scenario validation |
| F06 | Relevant room work | Bedroom/bathroom/kitchen choices and old-draft validation | Map approved catalogue/specifications into pricing |
| F07 | Versioned pricing | Approval/expiry/specification guards; no whole-home double counting | Approved rates, full administration/history/rollback workflow |
| F08 | Estimate result/comparison | Editable selection, result/fallback and quote handoff | Real numerical results and approved tier comparison |
| F09 | Callback | Four required fields and visitor-sent WhatsApp/email draft | Automatic server receipt only if a later delivery service is chosen |
| F10 | Team notification | Business destinations included in drafts | Automated queue/retry/failure handling; real receipt test |
| F11 | Staff desk | Authenticated local prototype and tested workflow | Production authentication, durable storage, staff ownership and operation |
| F12 | Scheduling | Enquiry/conversation path | Real availability, confirmed bookings and fee/response rules |
| F13 | Room gallery | Collections, search/category browsing, lightbox and save controls | Publication rights, final curation and complete browser review |
| F14 | Saved inspiration | Browser shortlist and enquiry/brief context | Final end-to-end browser review |
| F15 | Style discovery | Ungated style quiz and contextual next steps | Final browser review; optional editorial refinement |
| F16 | Detailed brief | Optional /project-brief with room-specific work and manual attachment guidance | Final browser review and any future automatic intake |
| F17 | Private uploads | Local intake prototype; public manual attachment handoff | Production storage, permissions, retention and delivery configuration |
| F18 | Project case studies | Approval-gated structure | Genuine project data/photos and permission |
| F19 | Reviews | Approved-content structure; example-review source removed | Genuine review wording, attribution and consent |
| F20 | Materials comparison | Educational materials guide and illustrative palettes | Real catalogue, exact specifications and verified tier differences |
| F21 | Process/commercial terms | Process content and quote-review checklist | Actual fees, payments, cancellation/change and warranty/aftercare terms |
| F22 | Guides/home tours | Not built as a publishing collection | Original content, permissioned media and editorial ownership |
| F23 | Location pages | Confirmed broad service regions and city input | Actual city clusters, visit arrangements and truthful local pages |
| F24 | Room studio | Photo/dimensions/style briefing and manual handoff | Final browser review |
| F25 | Public AI | Separate tested local provider adapters; public generation off | Account, spending/abuse controls, private production storage, data-flow approval and actual provider validation |
| F26 | Customer project area | Not built | Authentication, real project data, customer permissions and update owner |
| F27 | Quote/change approvals | Not built as a business approval workflow | Measured BOQ/versioning and auditable customer/internal approvals |
| F28 | Care/warranty access | Direct public contact details | Real policy, aftercare ownership, snag and warranty workflow |
| F29 | Referrals | Partner page can prepare a referral-interest introduction | Approved eligibility/rewards, consent, attribution and payout workflow |
| F30 | Partner applications/tracking | Public short introduction page for five opportunity types | Real benefits/selection rules, durable application records and tracking/portal |
| F31 | Conversion measurement | No advertising trackers/analytics added | Approved measurement plan and accurate offline enquiry outcomes |
| F32 | Content/rate administration | Reviewed source-data approval gates | Owner/staff publishing UI and evidence/history management |
| F33 | Quality/search | Lint, strict types, tests, formatting, route/asset checks, canonical/social metadata and sitemap | Complete final mobile/browser sign-off; independent performance/accessibility review if required |
| F34 | Deployment/monitoring | Node startup, staging controls, source backups and launch instructions | Host choice, review deployment, HTTPS/DNS, monitoring and restore/rollback verification |
| F35 | Finance/EMI | No arrangement or claims | Provider/business agreement and approved terms before implementation |
| F36 | Franchise | No programme or claims | Established business programme before implementation |
| F37 | Full 3D/floor-plan automation | Not built; a photo brief is not a 3D model | Separate accuracy, cost and product evaluation |
| F38 | Regional languages | Not built | Supported languages, accurate copy and response capability |

The simpler website can launch with manual WhatsApp/email enquiries while pricing, AI and later operational features remain inactive. Use LAUNCH-CHECKLIST.md for the actual launch gates and owner-inputs/START-HERE.md for documents to supply.
