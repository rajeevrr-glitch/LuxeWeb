# LuxeInfra — launch candidate 11

Updated 18 October 2026. Prepared for deployment; not yet published. Existing Lovable site and GoDaddy DNS are untouched.

## What is ready
- Room-specific work choices, with invalid older selections removed.
- WhatsApp brief handoff to +91 9026271638. Second phone +91 7678432743 appears below it.
- Email drafts addressed to sales@luxeinfra.in and copied to infoluxeinfra@gmail.com.
- Visitors download the complete brief and attach it, plus their floor plan/photos, in their email or WhatsApp app. The site does not automatically send mail, upload files, or confirm receipt.
- Public builds omit sample testimonials from home/navigation and show no sample reviews even on their direct URL.
- Public room studio supports planning. AI generation is disabled in the production server, regardless of any pilot key.
- Production startup, health endpoint, security headers, sitemap/robots and staging noindex controls.

## Run the public version locally
Requires Node 24 or later. From this folder:

    npm ci
    npm run typecheck
    npm test
    npm run build
    npm start

Open http://localhost:3000. This is the actual production build, including hidden sample content. It is not an internet deployment. For design development and the separate AI pilot use npm run dev (port 5173).

## Deployment configuration
Use a Node 24 web-service host with managed HTTPS. The project follows TanStack's universal fetch server approach; it serves dist/client and forwards page requests to dist/server/server.js. It is not a static dist upload to an ordinary shared-hosting file manager.

Build command: npm ci && npm run build
Start command: npm start
Health path: /healthz
Runtime variables: HOST=0.0.0.0; PORT supplied by host; SITE_URL=https://luxeinfra.in
Set INDEXABLE=false on staging. Set INDEXABLE=true only on the final public domain after review. The staging server adds X-Robots-Tag: noindex even though public page metadata is ready for indexing.

A Dockerfile is also included for a host that accepts containers. The Docker build itself has not been run on this machine.

No database, email password or AI API key is needed for this first release. Do not expose the local enquiry desk or pilot servers publicly. Do not upload .env.local, .private, original ZIPs or local test data.

## Before switching the domain
1. Select and sign in to the deployment host. Confirm the current domain connection in Lovable/GoDaddy; do not assume a GoDaddy domain includes web hosting.
2. Deploy this release to the host's preview URL. Test all pages and the full planner on desktop/mobile.
3. From your own device, send a genuine test via WhatsApp and both mailboxes, with a downloaded brief and attachment. Confirm receipt. Links have been checked; inbox/WhatsApp delivery cannot be certified without this test.
4. Confirm permission to publish the supplied interior images. The gallery is inspiration, not a claim that LuxeInfra completed those projects.
5. Keep unconfirmed reviews, prices, warranties and delivery promises out. Add approved content later using the saved owner templates.
6. Add luxeinfra.in and www to the host, wait for HTTPS certificates, then change only the required website DNS records. Preserve domain mail MX/TXT/DKIM/DMARC records. Save the current records for rollback first.
7. Check HTTPS and the preferred www redirect, then set INDEXABLE=true and verify robots.txt and sitemap.xml. Keep the existing Lovable project for rollback until launch is verified.

## AI later
API credentials alone do not activate the public image feature. The local pilot remains for testing. Public AI needs authenticated or abuse-controlled access, shared quotas/storage and retention, provider billing review, and an updated privacy notice before it is connected to the public server. See AI-SETUP.md.

Official deployment reference: https://tanstack.com/start/latest/docs/framework/react/guide/hosting
Lovable repository sync reference: https://docs.lovable.dev/integrations/git-sync-overview

## Verification
See RELEASE-VERIFICATION.md for the completed checks and remaining limits.
