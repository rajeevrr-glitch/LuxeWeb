# Reimagine My Room — proposed LuxeInfra feature

16 October 2026. Original feasibility proposal. Version 5 now implements the first local pilot; see AI-SETUP.md and HANDOVER.md for its actual scope. No AI account has been connected or purchased. Revisions and measured layout validation remain future work.

## Recommendation

Build a small photo-based room concept pilot integrated with Plan My Space. A visitor uploads a room photograph, supplies dimensions and describes the desired changes. An image-editing service returns a concept that can be compared with the original and attached to an estimate request.

This is technically feasible using an existing image-editing API. Commercial feasibility should be established by testing output quality, cost per useful concept and the number of qualified enquiries it produces. We do not need to train a custom model for the first version.

## Visitor flow

1. Take or upload one clear room photo. Provide photography guidance: a wide view, good light, visible corners, no people or personal documents. Offer ordinary file upload as a fallback to camera capture.
2. Select room type and enter length, width and ceiling height with explicit feet/metres units. Ask which wall the photo faces and where fixed doors/windows are. A second view or a plan can be an optional later improvement.
3. Describe the changes, choose a style, list what must stay and optionally state a budget preference. Example: keep the window and floor, add a study desk and wardrobe, use warm neutral finishes.
4. Show a concise interpretation for confirmation and explain that the room photo will be processed by the selected AI provider. Request consent before transmitting it.
5. Generate one concept with a clear waiting state, failure handling and limited retries. Instruct the model to retain camera perspective and fixed features, then evaluate how reliably it does so.
6. Compare original and AI concept with a before/after slider. Clearly label the output as an AI concept, not a measured construction design. Allow one guided revision in a pilot, subject to budget.
7. Use “Request an estimate for this look” to carry the chosen concept, original photo, dimensions and preferences into the existing project brief. The team reviews feasibility and pricing.

## Accuracy boundary

Dimensions provide useful context but do not guarantee scale in a generated image. A photo and text prompt cannot establish every hidden measurement, structural condition, service location or clearance. The model may alter openings or furniture proportions despite instructions. Designer review is required before treating any layout as buildable. Accurate furniture fit or dimensional planning would require a measured 2D/3D model and validation, which is a separate larger feature.

## What the implementation needs

- A paid image-editing API account with the secret key kept on the server.
- A background generation job so a slow response does not lose the request.
- Private photo/output storage, explicit deletion/retention rules and owner-approved disclosure of the AI provider.
- Server-side upload validation, access controls, rate limits and an enforced generation budget.
- No unlimited anonymous generations. Begin with limited attempts and a capped pilot; consider verification if abuse occurs.
- Save generation parameters, status and usage without exposing credentials or private images in analytics.
- Keep the user's original photo unchanged and connect the selected concept to the enquiry.
- Do not present the model's invented furniture, materials, prices or delivery dates as supplied products or commitments.

## Pilot gates

First make the upload/description/comparison flow locally using clearly labelled demonstration content. Then, after provider access and a spending cap are agreed, test a varied set of permission-approved room photos. Evaluate preservation of doors/windows, visible geometry, requested changes, inappropriate additions, time to result, retry rate and actual usage cost. Release a limited public version only after acceptable results and the real privacy/storage setup are ready.

Monthly cost depends on photo inputs, output quality/resolution, revision attempts, traffic and hosting/storage. Measure the full cost per successful concept during the pilot rather than promising a fixed rupee figure now. Do not equate a photorealistic output with a technically accurate design.

## Documentation checked

OpenAI's official image-generation guide supports source-image edits and documents limitations in exact composition and generation latency, plus usage-based cost calculation:
https://developers.openai.com/api/docs/guides/image-generation

An API provider is an implementation option, not a selected or activated vendor. The proposed flow and business recommendation above are LuxeInfra-specific design recommendations.
