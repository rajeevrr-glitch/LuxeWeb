# LuxeInfra redesign — version 5

Prepared 16 October 2026. Builds on version 4 and the agreed blueprint.

## Added

- Reimagine My Room at /reimagine, with a homepage entry and navigation link in the existing ivory/deep-blue theme.
- JPG/PNG room-photo selection and preview, length/width/ceiling height in feet or metres, room and style choices, desired changes and details to preserve.
- A review step, explicit provider-specific consent, honest disconnected/loading/error states, and recovery of an existing request without automatically generating again.
- Private image-generation service with OpenAI image-edit and Hugging Face/fal adapters. Credentials stay server-side. Generation is OFF until the owner connects an account.
- Before/after comparison, concept download, and carrying the original photo plus AI concept into Plan My Space when a result is available.
- A useful account-free path: carry the original photo, dimensions, style and requirements into the quote form now.
- Validated uploads, removal of embedded metadata before provider transfer, session-private images, expiring results, request deduplication and a persistent attempt cap. These are local pilot controls, not production hosting.
- AI-SETUP.md and .env.example for connecting an account later. No key, purchase or provider request is included.

## Review

Open Start-preview.cmd in Desktop/LuxeWeb/luxeinfra-preview-v5 and visit http://127.0.0.1:5173/reimagine. Close an earlier preview before starting another folder, because they share the same local ports. The first run installs pinned dependencies and needs internet.

Try: room photo → dimensions and preferences → Review my room brief → Add this room to my project brief. The planner imports the selected room/style, attaches the photo and fills the notes. Continue through the normal enquiry flow. Enquiries remain local; email delivery is not connected.

The separate Review-enquiries.cmd opens the protected local desk at http://127.0.0.1:8789. Each preview folder has its own private data. The archived package starts empty and contains no development enquiries, credentials or installed dependencies.

## Verification

Twelve automated test groups passed, covering the existing enquiry/desk flows plus AI disabled state, validation/consent, origin/session boundaries, private result retrieval, metadata stripping, retry deduplication, failed-call quota consumption and quota persistence across restart. The OpenAI request adapter was checked with a local response fixture; no real API call was made.

TypeScript and production build passed. Browser checks covered the disconnected state, choosing a real local source image as a test photo, reviewing dimensions and preferences, importing the room/photo/notes into the planner, and the 390px mobile layout. A saved-choice overwrite found during testing was fixed and the handoff was rechecked successfully.

The completed-image API was tested using a synthetic local image fixture. Actual provider generation, image quality, latency and billing have NOT been verified because the owner chose to connect an account later. The comparison/download interface is implemented; evaluate it with a real returned concept during that activation test.

## Next decisions

Connect an owner-controlled image account when ready; AI-SETUP.md explains the options and limits. The two-attempt default is not a currency budget. Each independent preview folder has a separate counter, so copying the folder is not an account-wide spending control.

Public hosting, durable private storage, production authentication/abuse controls, notification delivery, real project content and owner-supplied fees/payment/warranty terms remain pending. See DETAILS-TO-PROVIDE.md. Previous previews and the original Lovable export are preserved. Nothing was published, pushed or changed in GoDaddy or Lovable.
