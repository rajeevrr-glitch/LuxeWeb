# Reimagine My Room — connect an account later

16 October 2026. Version 5 is a local pilot. Generation is OFF. No key is included and no paid API call has been made.

## Try it now

Open `Start-preview.cmd`, then http://127.0.0.1:5173/reimagine. Add a JPG/PNG photo, dimensions in feet/metres, design direction and requirements. Review, then carry the photo and details into Plan My Space. Connecting a provider unlocks generation, before/after comparison, concept download and attaching both images to an enquiry.

## Connect when ready

1. Choose an account you own. OpenAI images are usage-priced; a key does not mean free credits. Hugging Face may provide a small trial allowance, subject to change and model cost. Check your account before enabling anything. No purchase or subscription has been arranged here.
2. Copy `.env.example` to `.env.local` beside `package.json`. Edit it locally. Never share a key in chat, screenshots, website forms or a ZIP. Never use a `VITE_` variable for a secret.
3. **Hugging Face option:** create a token with Inference Providers permission at https://huggingface.co/settings/tokens. Set `LUXE_AI_PROVIDER=huggingface` and fill `HF_TOKEN`. This adapter routes through fal with `Qwen/Qwen-Image-Edit-2511`. Confirm model/provider access in your account.
4. **OpenAI option:** create a project key at https://platform.openai.com/api-keys. Set `LUXE_AI_PROVIDER=openai` and fill `OPENAI_API_KEY`. The adapter uses the Images edit endpoint with `gpt-image-2.5-flare`, one low-quality 1024px JPEG. Confirm model access, any verification requirements and current pricing before use.
5. Keep `LUXE_AI_MAX_ATTEMPTS=2` for the trial. Set `LUXE_AI_ENABLED=true` only when ready to allow requests. Stop and restart the preview. The visualiser should report that a limited trial is ready.
6. Try one non-sensitive room photo you have permission to share. Review the named provider and consent before generating. Evaluate layout preservation, furniture proportions, unwanted changes, latency and actual account usage before allowing further attempts.

To disable generation, set `LUXE_AI_ENABLED=false` and restart. Keys stay on the server.

## Cost control

`.private/ai-pilot-usage.json` counts attempts, including failures, across restarts. This is a REQUEST LIMIT, not a currency budget. Deleting a concept does not refund credits. Failed or cancelled calls may still cost money. There are no automatic provider retries; after a lost response, check the existing request first.

Do not delete the counter to bypass the limit. Review provider usage, then deliberately raise the configured total if more attempts are approved. Review the provider's own spending controls separately; a dashboard budget may not be a hard stop. Account activation and spending remain your decision.

## Where photos go

Selecting a photo keeps it in your tab. Generate sends it to the local service, which validates and re-encodes it, strips embedded metadata, and forwards the photo plus instructions to the named provider. Hugging Face routing also involves fal. Provider retention policies apply separately.

Result access is private to the browser session and expires after 30 minutes. Expired local images are swept from memory; a restart clears them sooner. Clear/cancel removes the local job, but cannot guarantee cancellation or deletion at the external provider. Download or attach results before leaving; refresh can lose unfinished details.

Only submitting the planner saves carried-over images to `.private/enquiries`. Submitted attachments remain there until removed through the local retention procedure. Do not include that folder in shared archives.

The image service listens on 127.0.0.1:8791; the website proxies `/api/visualiser`. Enquiries remain on 8788 and the private desk on 8789. This computer-only preview is not reachable by a phone on another device.

## Before launch

This is a localhost pilot, not a production image service. Production needs HTTPS, secure cookies, persistent authenticated sessions, durable private storage and timed deletion, shared atomic quotas, abuse prevention/moderation, approved provider terms and retention, notification delivery, and an agreed spending policy.

Dimensions are prompt context, not a measured room model. AI may change proportions or openings. A designer must verify dimensions, furniture fit, materials, feasibility and price.

## References and verification status

- OpenAI image editing: https://developers.openai.com/api/reference/resources/images/methods/edit
- Hugging Face image-to-image: https://huggingface.co/docs/inference-providers/tasks/image-to-image
- Hugging Face allowances: https://huggingface.co/docs/inference-providers/main/pricing

Recheck pricing, model availability and account access when connecting. Local fixtures verify service behaviour; real provider output quality, latency and charges remain unverified until an account is connected.
