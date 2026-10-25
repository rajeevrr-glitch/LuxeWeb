# WhatsApp and UI refinement — version 20

23 October 2026. Local implementation; not published.

## Request flow

- The quick quote and welcome form have two input steps: project, then contact details. Valid submission opens WhatsApp immediately for +91 9026271638, with the relevant selections included.
- The detailed brief and partnership introduction also open WhatsApp directly after their existing validation. The room-photo journey stages its brief into the detailed planner, which uses the same handoff.
- WhatsApp opening happens in the visitor's submit action. Rendering, reloading or viewing a result does not open another draft. The external page has no opener access.
- The fallback screen offers Open WhatsApp again, edit details and a secondary email draft to sales@luxeinfra.in, copied to infoluxeinfra@gmail.com. It never claims a message has arrived.
- Detailed briefs longer than 1,800 characters open a short introduction. A prominent notice explains that the full brief is missing from that draft and must be downloaded and attached. Photos/plans also need manual attachment.
- Contact data is not added to browser storage. Opening the external link passes the draft details to WhatsApp before Send; the privacy notice explains this.
- The approved-price result remains a review-first journey: visitors see their budget before choosing to contact the team. Rates are still inactive.

## Interface

- Kept the navy/ivory colours and room photography. Added a restrained serif headline on the homepage and quote photograph, an ivory project chooser and simpler card edges.
- Replaced generic “next chapter / vision / possibilities” copy with specific service, room and contact language across the homepage, reviews, footer, welcome and quote pages.
- Removed the tilted floating note, sparkle decoration on the home/welcome opening and the animated button sheen. Reduced card lift/shadows and uppercase promotional labels.
- Retained readable mobile fields, focus indicators, protected routes, delayed once-per-session welcome invitation, saved-design references and approval gates for prices/offers/reviews.

## Delivery limit

This release opens a prepared WhatsApp message. The visitor still presses Send; neither the website nor a successful popup opening proves delivery. Fully automatic delivery needs a configured WhatsApp Business Platform sender, server-side credentials and an agreed notification flow. No automatic endpoint or local private pilot service has been exposed. See owner-inputs/WHATSAPP-DELIVERY-V20.md.

No real message was sent, paid API was called, source pushed, live site changed or domain record edited.
