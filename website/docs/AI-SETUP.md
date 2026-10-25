# Room image generation — Gemini

## Add the key locally

Open `.env.local` beside package.json, or Desktop/LuxeWeb/website/.env.local. Both paths refer to the same private file. Paste the key after GEMINI_API_KEY=; never paste it in chat or a website form.

```dotenv
GEMINI_API_KEY=your_key_here
LUXE_AI_PROVIDER=gemini
GEMINI_IMAGE_MODEL=gemini-nano-banana-2.1
GEMINI_API_TIER=free
LUXE_AI_ENABLED=false
LUXE_AI_MAX_ATTEMPTS=2
```

The file is ignored by source control and excluded from source sharing. Never prefix a key with VITE\_. Real keys do not belong in `.env.example`.

Run `npm run ai:check` to check the local setup offline. It shows only provider/model, whether a key exists, the enable switch and attempt cap. It does not contact Google or print the key.

Save your changes with Ctrl+S before checking. A present key and an enabled switch mean the settings were loaded; they do not confirm that Google accepts the key or that image generation has billing/quota access. If Google rejects the key, replace its value with the complete key from Google AI Studio, save and restart the local runner.

The local image service uses the operating system's trusted certificates for HTTPS. Certificate verification remains enabled.

The example above starts safely with the free account tier. These Gemini image models have no free API tier, so `GEMINI_API_TIER=free` pauses generation even when the key is present and LUXE_AI_ENABLED=true. The room brief remains available. This does not change the Google account or enable billing. The local two-attempt allowance is an application limit, not free Google credits.

Current local verification, 24 October 2026: after the owner confirmed billing, the original sample concept succeeded. A later explicitly authorised comparison made exactly two additional generation attempts: one Nano Banana 2.1 image (22 seconds) and one Nano Banana Pro image (26 seconds), using the same photo and room-preserving instructions. Both succeeded without retries. The counter advanced from two to four; it was not reset. The comparison used a temporary two-attempt allowance within the same image service while the ordinary pilot remained exhausted. The ordinary configured cap stays at two and therefore remains exhausted. The private comparison receipt at `.private/model-comparison/state.json` prevents the comparison command from running a second time.

The comparison results are `.private/model-comparison/nano-banana-2.1.jpg` and `nano-banana-pro.jpg`; the earlier test remains `.private/room-concept-test.jpg`. Nano Banana 2.1 is now the default: in this single sample its desk was fully visible and the response was faster, whereas Pro cropped the desk at the right edge. This is a narrow sample preference, not a general accuracy benchmark or proof of furniture fit.

## Try your room

1. Check that the Google AI Studio project has access to the chosen image model and any required billing. A Gemini key alone does not guarantee free image generation. Review the [official pricing](https://ai.google.dev/gemini-api/docs/pricing) and your project usage controls.
2. Only after you have deliberately enabled billing/access on the same Google project and reviewed spending controls, change GEMINI_API_TIER to paid and LUXE_AI_ENABLED to true. This local tier setting records your confirmation; it cannot verify or activate Google billing. Keep the initial two-attempt cap. Restart Start-website.cmd or `npm run dev`.
3. Visit http://127.0.0.1:3000/reimagine and choose Restyle my room. Add a permitted photograph, selected changes and retained features. Dimensions are optional context; marking an area provides guidance rather than a pixel lock. Review the provider disclosure and consent before generating. Plan what fits is a separate scaled 2D tool; it makes no image-generation request.
4. Review the resulting concept, before/after view and download. This is an image-editing concept, not a measured plan or guaranteed furniture fit.

Set the switch back to false and restart to disable. The live tests confirmed generation access for the tested models. Wider reliability, actual provider charges and production deployment remain separate checks. Review provider usage before deliberately authorising additional attempts. Do not rerun the comparison or increase the cap to obtain extra variants without a new owner request.

## Limits and privacy

- The key is used only in a server-side x-goog-api-key header to Google's fixed API domain. The browser receives no credential. Responses/errors are bounded and do not include provider payloads.
- The server strips embedded photo metadata before sending the photo, dimensions and prompt to Google. Provider terms apply separately. Results are session-private and expire after 30 minutes; a service restart clears them. Downloads you keep are separate.
- The persistent `.private/ai-pilot-usage.json` counts attempts, including failures, across restarts. This is a request cap, not a currency budget. Do not delete it to bypass the cap. Check provider usage before deliberately allowing more.
- A lost response can still consume credits. The service does not automatically retry a generation; check the existing request first.
- Failures now distinguish quota/rate limits, billing, rejected keys, permissions, rejected requests, unavailable models, content refusals, missing images and connection/timeouts. Only fixed safe descriptions, category codes and numeric HTTP statuses are used in diagnostics. Provider error bodies, keys and photo/brief contents are not logged or shown. Earlier attempts that used the old generic error handler cannot be diagnosed retrospectively from their screenshots.
- Public production builds continue to disable the local image pilot. Going live needs an authenticated service, durable shared quotas/private storage, retention and abuse controls, approved data handling and a spending policy.

Existing OpenAI/Hugging Face adapters are retained as optional alternatives; their account access must be checked separately.

Official references: [image editing API](https://ai.google.dev/gemini-api/docs/generate-content/image-generation), [API keys](https://ai.google.dev/gemini-api/docs/api-key), [pricing](https://ai.google.dev/gemini-api/docs/pricing).

## Luxe text chat — separate connection

Ask Luxe works immediately as a website guide using approved business information. That mode makes no AI request. It can direct visitors to home and commercial enquiries, planning, materials, Room Studio and studio contacts. It cannot generate images, send a lead or promise prices, delivery dates, offers or warranties.

To connect the optional Gemini text assistant, open the existing ignored `.env.local` and use these separate settings:

```text
LUXE_CHAT_ENABLED=false
LUXE_CHAT_API_KEY=
LUXE_CHAT_MODEL=gemini-3.5-flash-lite
LUXE_CHAT_DAILY_LIMIT=20
```

Put the chat key after `LUXE_CHAT_API_KEY=` only in this private file. Change `LUXE_CHAT_ENABLED` to `true` only when the account and its quota/billing are ready, then restart `npm run dev`. Never post a key in a conversation, use a `VITE_` prefix or add it to `.env.example`. The existing room-image key, paid image model and exhausted image allowance are independent and remain unchanged. One owner-approved live text test succeeded on 25 October 2026; the local connection is now enabled.

The default text model follows Google’s [Gemini 3.5 Flash Lite documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite). Check the connected account’s actual availability, free-tier eligibility and [current pricing](https://ai.google.dev/gemini-api/docs/pricing); a free key does not guarantee free requests. The adapter uses the official [Interactions API](https://ai.google.dev/api/interactions-api), sends one current question and the approved site context with `store=false`, and requests a short plain-text answer. It does not send the previous conversation. Google’s applicable data terms still govern processing.

When enabled, visitors must choose Start an AI conversation before a question leaves the website. A failed request falls back to a clearly described quick answer; it is not retried automatically. The conversation stays in page memory, and no transcript is written by the server. A same-origin private session permits at most eight provider attempts over thirty minutes. The default private daily counter permits twenty attempts per UTC day; failures count. It stores only the UTC day and count in `.private/luxe-chat-quota.json`. These are attempt limits, not currency caps. Configure provider-side spending and abuse controls too.

The optional middleware runs in local Vite and the production Node server. Production reads secrets from the hosting environment, not `.env.local`. Use one server instance with durable private storage for this file-based counter. Multiple server instances need a shared atomic quota/store before enabling AI. Chat is not model training or fine-tuning: its initial knowledge is a small maintained set of approved business facts, to be expanded with the owner’s real catalogue and terms later.

### Site-specific knowledge

`src/lib/luxe-knowledge.ts` builds the AI instructions from the public business details, room-specific work, approved-content gates, pricing readiness, featured brands, commercial categories and partnership roles. It describes seventeen actual site journeys. It does not read deployment settings, API keys, owner notes or private enquiries. The knowledge is built for each provider request, so approved site-data changes can be reflected without retraining a model. Update the plain page descriptions when journeys change.

`src/lib/luxe-chat.ts` routes visitor topics to useful site tools and `src/lib/luxe-chat-copy.ts` supplies concise English, Hindi and Hinglish website guidance. The helper distinguishes commercial offices from home offices, retains commercial subtypes in enquiry links and explains actual limits: no invented instant price, confirmed discount, warranty term, genuine rating or guaranteed image generation. Future catalogue, rates and genuine reviews must pass their existing approval gates before becoming business claims.

The credential guard accepts both standard and newer Google authorisation-key formats. See Google’s [current key documentation](https://ai.google.dev/gemini-api/docs/api-key). The owner confirmed Google AI Studio/Gemini and explicitly approved exactly one text-only test on 25 October 2026. That request went through the existing private-session, consent, knowledge and quota middleware to Google’s official Interactions endpoint using the saved key. Google and the local endpoint both returned HTTP 200, with a relevant reply about LuxeInfra’s services and service regions. The test made exactly one provider request and no retry or image request. A private execution receipt and one-request guard prevented repetition; the ordinary daily counter advanced to one attempt.

`LUXE_CHAT_ENABLED` is now `true` and localhost reports optional AI guidance available. The key itself and all image settings were preserved. The configured chat allowance remains twenty provider attempts per UTC day, including failures, with eight per session; live account quota and billing remain the provider’s authority. Future visitor AI questions use that account only after the visitor opts in. The completed test establishes one working text response, not a guarantee that every question will be answered correctly or that quota will always be available.

## Room design lead capture and current knowledge

Local Restyle review now requires name, Indian mobile, city and separate contact consent before generation. The server saves a session-bound, retry-safe record in ignored .private/room-enquiries; it contains no photo bytes or AI prompt. Contact details are never sent to the image provider or browser storage. Records remain until managed/deleted, independently of thirty-minute image/session expiry. Capture is limited to three per session and 1,000 stored records. A local save is not studio delivery: the interface offers an explicit WhatsApp handoff. Production image AI remains disabled until hosted private capture/delivery and retention are configured.

Luxe knows the owner-confirmed 6+ years and 200+ projects, Lifetime warranty\* with terms pending, the approved ongoing Diwali 15% offer plus gifts, ten brand options and the real portfolio. Project media lives on Our work and client stories have a separate text-only page. Unapproved review wording is excluded from the website and chat knowledge; proposed editorial copy stays in the owner-input notes. Client names do not establish satisfaction or ratings, and other portfolio photos remain unassigned. Quick-answer labels replace the old repeated website-guide labels; the visitor explicitly chooses Start an AI conversation before Google receives a question. No extra real provider test was performed during these changes; the authorised chat-test counter remains one.
