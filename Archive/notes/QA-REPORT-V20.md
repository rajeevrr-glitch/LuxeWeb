# Verification — version 20

23 October 2026. Local review; no deployment and no actual message sent.

## Passed

- 45 automated tests: existing validation, pricing, room-work, consent, public server, private pilot and invitation checks, plus WhatsApp message encoding/destination, synchronous single opening and blocked-browser fallback handling.
- Final strict TypeScript, lint with zero warnings and formatting checks.
- Normal public and local review builds. Each passed 23 rendered route/query checks and 81 referenced built assets. Review samples/proposed offer stay excluded from the normal build. The copy-specific assertions were updated to the new plain-language headings and explicit Sample review label.
- Final running review server: five pages and 45 referenced assets, noindex, private paths blocked, automatic intake POST 405 and public AI disabled. Log: outputs/review-v20/live-smoke.json.
- In-app browser: desktop homepage and simplified invitation; mobile homepage at 335px capture width / 320px document content, with no horizontal page overflow; contextual bedroom quote with the right room and no kitchen work offered.
- A welcome Kitchen selection carried into contact details. Missing name/city and an invalid phone were blocked. A valid test using the already-public business phone opened an unsent WhatsApp draft at the confirmed +91 9026271638 destination, preserving Kitchen context. The external draft page was inspected; neither Open app nor Send was used. Email remains a collapsed fallback.
- Independent source review checked validation, direct-opening lifecycle and truthful receipt wording. It identified and resolved explicit long-brief attachment instructions, detailed-brief heading focus and privacy wording about passing a draft to WhatsApp before Send.

## Evidence and limits

Selected captures: home-desktop.png, home-mobile.png, welcome-desktop.png, handoff-mobile.png and whatsapp-draft.png in outputs/review-v20. Homepage/welcome styling is unchanged between the inspected build and the final build; later changes refined privacy and detailed-brief wording/focus.

After the external draft test, the in-app browser intermittently returned delayed/stale visual or interaction state. Later Close/Escape/reset interactions were therefore not counted as newly verified in this pass; earlier v19 checks remain historical. All legacy detailed-brief branches, long-brief manual attachment, physical phones, screen readers and actual receipt still require owner/device checks. No performance score or complete accessibility/conversion certification is claimed. The build retains the existing large-client-chunk and framework internal unused-import warnings.

Automatic WhatsApp Business API delivery is not configured. Click-to-chat opens a draft; the visitor presses Send. The website cannot observe whether the message was sent or delivered. Files are never auto-attached.

No paid image generation, real enquiry, source push, Lovable edit, publishing or GoDaddy/DNS change occurred. The local preview uses review mode and must not be deployed publicly.
