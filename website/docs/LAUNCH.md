# Run, review and launch

## Daily local use

Open Start-website.cmd, or run `npm run dev` from the project. Use http://127.0.0.1:3000 in your browser. Keep its terminal open. This runs local review plus the private image/contact service. Client stories are text-only on /testimonials, without editorial notices or unapproved quotations; all project photos and films are on /projects. Proposed review wording is kept only in OWNER-INPUTS.md. The approved Diwali campaign is public content. It does not publish the site.

The root `.env.local` file is private. Gemini setup is in AI-SETUP.md. Automatic account enquiries remain disconnected in local development; forms use the labelled manual WhatsApp fallback. The older private enquiry/desk tools are retained for existing local data and tests but are not automatically started.

## Quality checks

Requires Node 24.x and `npm ci` when dependencies are missing.

```text
npm run typecheck
npm run lint
npm test
npm run format:check
npm run build
node scripts/verify-redesign.mjs
```

For a public-mode local check, stop development, then run `npm start` after a normal build, or use scripts/windows/Start-release.cmd. The public Node server disables the local image and enquiry pilots. It does not automatically load .env.local; production secrets belong in the selected hosting environment.

## Before publishing

- Complete OWNER-INPUTS.md: real rates/specifications, permissioned content/images, terms and approved promotions. Never publish labelled sample reviews or proposed offers as real business facts.
- Check all ten brand options against the selected specification. Confirm genuine review wording and publication consent; project photos remain unassigned rather than paired with reviewers. Keep detailed Lifetime warranty\* coverage/exclusions and Diwali gift/calculation terms available before booking.
- Luxe website guidance works without an AI account. Optional AI text chat needs its own private chat settings and account/quota checks; follow AI-SETUP.md. Never reuse an image enable flag as chat authorisation. Keep one server instance for the file-based counter, or provide a shared atomic allowance store before scaling out.
- Choose a Node-capable host, review the normal build privately, configure secure server secrets and durable private storage, and verify message receipt and failure recovery with the business team.
- Confirm privacy/retention, ingress/spend limits, backups/restore, monitoring and rollback. Follow AUTOMATIC-DELIVERY-SETUP.md before enabling WhatsApp account delivery.
- Verify physical desktop/mobile browsers, keyboard/assistive technology, links/downloads, actual email/WhatsApp receipt, HTTPS and domain/SEO behavior.
- Verify MP4 playback, seeking/range requests and mobile controls on the chosen host. Room contact capture needs a private hosted service; local records are not automatically delivered and do not expire with the image session. Arrange retention/deletion and storage monitoring before activation.
- Only after explicit launch authorization, connect the new host to luxeinfra.in. GoDaddy currently manages the domain; domain registration is separate from website hosting.

There is one working source directory and one workdone.md. Future changes update them in place. Versioned preview folders, ZIPs and handover reports are created only when requested.

## Git to Netlify import

The owner selected Netlify and will push the source and import it themselves. The assistant has prepared the code, not created a remote repository or public deployment. Netlify Free currently permits commercial sites and includes custom domains/SSL with 300 monthly credits and a hard limit. Projects pause at that limit. Domain renewals and external AI usage are separate.

1. Open Desktop/LuxeWeb/website in your Git client. Push this website folder only; its package.json and netlify.toml should be at the repository root. Do not push the parent LuxeWeb folder or its Archive. Prefer a private repository for the business source.
2. Include package.json, package-lock.json, netlify.toml, vite.config.ts, tsconfig.json, src/, public/ and scripts/, with the repository's .gitignore. Git ignores local keys, .private, dependency/build outputs, Netlify state, workdone.md and internal owner/planning notes. Do not upload those private files manually through a browser.
3. In Netlify, choose Add new project → Import an existing project. Select your Git provider and the repository you just pushed. Choose the intended production branch.
4. Leave Base directory blank when the website is at the repository root. If you deliberately pushed an outer repository containing a website subfolder, set Base directory to that website folder instead. The directory must contain package.json and netlify.toml.
5. Build command: npm run build:netlify. Publish directory: dist/client. Node version: 24. These are already set in netlify.toml; the official adapter creates the server function automatically. Do not use a static Vite preset with a fallback to index.html, and do not set the functions folder to scripts/.
6. No API key or account token is needed in the repository to deploy the current public site. Keep secrets unprefixed in Netlify environment settings only when their corresponding hosted service is ready. Never copy .env.local or use VITE_ for a secret. Do not enable VITE_CONTENT_PREVIEW or VITE_CAMPAIGN_PREVIEW.
7. Deploy first to the generated netlify.app URL. Review home, /projects, /testimonials, /callback, /estimate, /reimagine, both project films, navigation and manual WhatsApp/email links. Preview/default Netlify URLs stay noindex. Confirm the production deployment succeeds before editing domain DNS.
8. Add luxeinfra.in and www.luxeinfra.in in Netlify's domain settings when ready. Copy the exact DNS instructions shown for this project to GoDaddy, preserving email MX/TXT records. Do not use old Lovable DNS values or change nameservers unnecessarily. The committed www redirect points to the apex domain. Only HTTPS production requests on https://luxeinfra.in advertise indexing; verify /robots.txt and /sitemap.xml after domain connection.

Local deployment checks:

```text
npm ci
npm run build:netlify
node scripts/verify-redesign.mjs --netlify
```

The build checks TypeScript first and forces public content flags off. For a production-context check, set CONTEXT=production for the build process and run the verifier with --netlify --production. The context is recorded at build time because build context variables are not assumed to exist in function runtime.

The hosted gateway preserves SSR, redirects/404s, security headers, robots/sitemap and safe service statuses. Netlify's adapter prefers static assets before the SSR function, so portfolio images and films use the CDN. Keep generated .netlify and dist folders out of Git; Netlify rebuilds them from the committed source.

The current public release includes manual WhatsApp/email, built-in Ask Luxe answers and the room-fit planner. External Gemini conversation, AI image generation and automatic enquiry delivery remain disconnected on serverless hosting until durable private storage, shared allowance limits and delivery configuration are implemented. Adding a local key does not provide that hosted backend or transfer private local records. Local AI settings and records remain unchanged.

Official references checked on 26 October 2026:

- https://docs.netlify.com/build/frameworks/framework-setup-guides/tanstack-start/
- https://docs.netlify.com/build/configure-builds/manage-dependencies/
- https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/
- https://www.netlify.com/blog/introducing-netlify-free-plan/
