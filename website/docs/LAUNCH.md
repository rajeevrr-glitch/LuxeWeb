# Run, review and launch

## Daily local use

Open Start-website.cmd, or run `npm run dev` from the project. Use http://127.0.0.1:3000 in your browser. Keep its terminal open. This runs local review plus the private image/contact service. Client stories are text-only on /testimonials, without editorial notices or unapproved quotations; all project photos and films are on /projects. Proposed review wording is kept only in OWNER-INPUTS.md. The approved Diwali campaign is public content. It does not publish the site.

The root `.env.local` file is private. Gemini setup is in AI-SETUP.md. Automatic account enquiries remain disconnected in local development; forms use the labelled manual WhatsApp fallback. The older private enquiry/desk tools are retained for existing local data and tests but are not automatically started.

## Quality checks

Requires Node 24 or later and `npm ci` when dependencies are missing.

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
