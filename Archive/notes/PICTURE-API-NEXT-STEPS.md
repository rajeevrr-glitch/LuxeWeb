# Picture API - owner summary

Checked 17 October 2026 against official OpenAI documentation and the local implementation.

## What the feature does

A visitor supplies a room photo, approximate dimensions and a description. The server sends the photo and design instructions to an image-editing provider, then returns an illustrative concept for comparison and download. It is not a measured architectural model; dimensions do not guarantee furniture fit or preserved proportions.

## Current status

The local OpenAI adapter already exists. It currently uses the Images edit endpoint with gpt-image-2.5-flare, low quality and a 1024px JPEG. Generation remains OFF. No account was connected and no live provider result or charge was tested in this update. The existing Hugging Face adapter is another option, but its account allowance and availability have not been rechecked in this update.

## What you need to supply locally

1. An OpenAI API account with usable billing/credits and access to the image model. A key is a credential, not an unlimited free image allowance. Organisation verification may be required.
2. A project API key created at https://platform.openai.com/api-keys. Enter it only in the local server configuration; do not paste it into chat or the public website.
3. When ready, follow AI-SETUP.md: create .env.local from .env.example, set the OpenAI provider and key, keep the pilot at two attempts, and deliberately enable generation before restarting.

We should first test one or two permitted, non-sensitive room photos. Review the output, how closely the layout is preserved, elapsed time and actual usage in the provider account before enabling wider access. The two-attempt limit counts requests, not a fixed rupee budget. Existing production-launch work in AI-SETUP.md remains necessary.

## Model choice and cost

Official guidance describes GPT Image 2.5 Sunburst as the choice when editing precision matters, and Flare as a fast everyday image-generation option. The current adapter is Flare; no model change was made here. A future comparison could determine whether Sunburst better preserves a room's details.

The API is usage-priced. For GPT Image 2.5, current standard rates are USD 8 per million image input tokens, USD 30 per million image output tokens, and USD 5 per million text input tokens. Total cost per edited room depends on the input image, prompt, output size, quality and actual token usage; the image-output estimate alone is not the complete editing cost. Recheck pricing and account access when enabling the service.

Sources:
- Image editing, model choice and verification: https://developers.openai.com/api/docs/guides/image-generation
- Official pricing: https://developers.openai.com/api/docs/pricing
- Account setup: https://developers.openai.com/api/docs/quickstart

The API account and key power the website independently of GoDaddy domain management. The secret stays on the server.
