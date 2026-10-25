# Automatic WhatsApp enquiry delivery — version 21

23 October 2026. Implemented and tested with fake notifications. No messaging account is connected, no real message has been sent and automatic delivery remains disabled.

## What happens when connected

The visitor submits a short quote, welcome request, detailed brief or partnership introduction on the website. The server validates it, saves the full text request privately, then sends an approved WhatsApp template notification to the internal team number. The visitor receives a reference without opening WhatsApp or pressing Send in another app. Approved-price planning results also offer this submission after the visitor reviews the result; actual prices remain inactive until approved.

The notification contains reference, request type, name, phone, city and a short summary. It is labelled as a summary; the full request remains on the private server. File checklists may be included, but photos/plans are not uploaded or attached automatically. A brief receipt offers a reference-based manual file-sharing link.

Success means the full text was saved and Meta accepted the notification. It is not a delivered/read receipt, a confirmed appointment or a quotation. This version does not implement WhatsApp status webhooks or a public staff inbox. The existing local enquiry desk is a separate pilot and is not wired to these new records.

## Connect later

1. Choose the Node 24 production host and a private persistent volume. Agree staff access, backup, deletion/retention and monitoring before activation. Do not use ephemeral serverless temporary storage.
2. Connect a WhatsApp Business Platform account, its sending Phone Number ID and a server access token. Plan the sending number and internal receiving number explicitly. Existing WhatsApp app/coexistence arrangements depend on the provider; do not move a working number without checking the account setup.
3. Confirm the internal receiving team number and its consent to notifications. The intended customer-contact number is +91 9026271638; recipient configuration is deliberately blank until the sender/recipient arrangement is confirmed.
4. Create and obtain approval for a template with exactly six positional BODY variables in the order below. No header or button variables are sent. Obtain the exact language code and a currently supported Graph API version from the account/provider. Do not assume that an arbitrary template name or example API version will work.
5. Enter the server variables below privately in the hosting dashboard. Never paste credentials into chat, commit them, put them in VITE_ variables or expose them in screenshots. Keep the enable flag false during setup.
6. Run the offline readiness check, then test on an access-controlled staging host. Enable only after the template/account, actual receipt, private storage, failure behavior and ingress protections have been checked. No activation or account purchase has been performed here.

| Server variable | Meaning |
| --- | --- |
| LUXE_ENQUIRY_DELIVERY_ENABLED | false now; explicitly set true after connection and staging checks |
| LUXE_ENQUIRY_DATA_DIR | Absolute private persistent directory; outside the source checkout, or under its excluded .private folder. Source/public/build directories are rejected |
| SITE_URL | Exact website origin accepted by the public intake, normally https://luxeinfra.in. Redirect www to the selected canonical origin |
| LUXE_WHATSAPP_ACCESS_TOKEN | Private server token |
| LUXE_WHATSAPP_PHONE_NUMBER_ID | Sender's numeric Phone Number ID |
| LUXE_WHATSAPP_RECIPIENT | Internal receiving number, international digits |
| LUXE_WHATSAPP_TEMPLATE | Exact approved template name |
| LUXE_WHATSAPP_LANGUAGE | Exact approved language code |
| LUXE_WHATSAPP_GRAPH_VERSION | Explicit supported version supplied by Meta/provider |

Run `npm run delivery:check` in the host environment. It checks configuration locally, prints booleans only and sends nothing. The production start command reads the host environment; merely editing .env.example does not load credentials. For a private local check, Node's --env-file option can load a separately protected file; do not include it in source handovers.

## Template contract

Suggested fixed text for submission to Meta (approval is not guaranteed):

    New LuxeInfra website request
    Reference: {{1}}
    Type: {{2}}
    Name: {{3}}
    Phone: {{4}}
    City: {{5}}
    Details: {{6}}

The adapter sends six single-line values capped at 64 / 40 / 80 / 32 / 100 / 400 UTF-16 units respectively. The summary always ends “Summary only; full request saved under reference.” Keep approved fixed text below 250 UTF-16 units so the combined body stays conservative. The complete 10,000-character request is not put in a template variable.

## Failure handling and operating limits

- JSON intake is limited to 64 KiB, with strict field/phone/consent validation, exact same-origin checks, no file upload, bounded concurrency and a socket-IP quota of 12 attempts per ten minutes.
- Origin checks are not bot authentication. Configure host/edge bot and per-visitor rate controls before enabling a paid messaging account. Behind a reverse proxy, socket-IP quotas can group all visitors together; forwarded IP headers are intentionally not trusted by this code. Provider billing limits and monitoring also need to be configured.
- A browser retry reuses its in-memory UUID for unchanged details. Atomic private record claims prevent repeated provider calls for that ID, including across server instances sharing the volume. The filesystem must support native hardlinks and atomic rename. Use one shared durable store; separate independent instance disks do not provide cross-instance deduplication.
- Provider rejection or uncertainty returns a generic error. A safe known reference is preserved and included in the manual WhatsApp fallback. The request may already be stored/accepted after a network timeout; the interface does not say it definitely failed.
- Pending, failed and uncertain stored requests are never automatically resent. An operator must check the private record/provider status before a deliberate recovery. This version has no background retry worker, delivery-status webhook or operator retry UI. Records include provider acceptance ID when known, but no raw provider errors or credentials.
- Normal browser retries keep their identity. Leaving/refreshing the page or deliberately starting over loses that browser identity; the team should check references/phone before treating manual follow-ups as new leads.
- Retention is not automatic. Define the retention duration, restricted staff access and a deletion/backup procedure before accepting real requests. New delivery records stay separate from the old local enquiry pilot.
- When disabled or incompletely configured, the endpoint saves nothing and calls no provider. The normal website retains the existing manual WhatsApp/email fallback, clearly labelled. It never displays a fake automatic success.

Official references checked during implementation: [WhatsApp Business Platform](https://whatsappbusiness.com/products/business-platform/), [business messaging policy](https://whatsappbusiness.com/policy/), [Meta's text-template API example](https://www.postman.com/meta/whatsapp-business-platform/request/o65u5m5/send-message-template-text).
