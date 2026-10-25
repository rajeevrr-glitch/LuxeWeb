# WhatsApp delivery — remaining setup

23 October 2026.

Working now: a valid enquiry opens a WhatsApp draft to +91 9026271638 immediately. The visitor presses Send. Email remains a fallback using both confirmed mailboxes. No API key or paid messaging service is needed for this click-to-chat flow.

For a website submission to arrive automatically without the visitor sending a chat message, confirm:

1. The WhatsApp Business Platform account/provider and the business sending number. Confirm the destination for internal lead notifications; a business sender and the receiving number must be planned explicitly.
2. Server-side credentials entered privately in the chosen host, never in source files, public VITE variables, screenshots or chat. Hosting has not yet been selected.
3. The approved notification template, applicable recipient consent and any messaging cost. Do not assume that a user's website visit opens a WhatsApp customer-service conversation.
4. What enquiries/files are stored, access and retention, retry/deduplication rules and a delivery-failure fallback. Success must reflect actual API acceptance rather than merely opening a link; API acceptance is also distinct from delivered/read status.
5. An owner-operated test of real receipt, failure handling and any status webhooks before enabling automatic delivery on the public domain.

The local-only enquiry/AI pilots remain private and disconnected from public submissions.

Official references checked 23 October 2026: [Click to chat](https://faq.whatsapp.com/5913398998672934), [Business Platform](https://whatsappbusiness.com/products/business-platform/), [WhatsApp Business messaging policy](https://whatsappbusiness.com/policy/).
