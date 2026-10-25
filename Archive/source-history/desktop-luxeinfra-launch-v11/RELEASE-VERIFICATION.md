# Release verification — version 11

18 October 2026. This is a tested local release candidate, not an internet deployment.

Passed:
- All 17 automated tests after the dependency updates. Covers invalid room work, saved-choice migration, private files, local desk access, AI pilot controls and production endpoint restrictions.
- TypeScript checking after adapting the root error component to the framework's unknown error type.
- Production build using patched TanStack Start 1.168.60, React Router 1.170.41 and Vite 7.3.7. The later root edit changed a TypeScript annotation only, with no runtime output change.
- npm audit fix completed with 0 known vulnerabilities in the resulting dependency tree (18 October 2026).
- Production HTTP checks: 16 public routes/assets returned 200; unknown route returned 404. Includes planner, room studio, gallery/category, services, contact, privacy, sitemap, robots and favicon.
- Public testimonials response contains no example review copy.
- Browser: restored bedroom/bathroom choices, all five planner steps, correct review summary, contact consent, ready-to-send screen and edit flow.
- Downloaded synthetic brief inspected: room-specific work, city, contact and budget fields are correct.
- WhatsApp target and email To/CC verified from link destinations. No external message sent.
- Mobile width 390px: planner and ready screen controls present, no horizontal page overflow (scroll width 375px).

Remaining limits:
- Actual hosting account, domain/HTTPS/redirect setup and external email/WhatsApp receipt are not verified.
- Owner image-publication permissions, authentic testimonials and commercial terms remain pending.
- AI API keys were not activated and no paid provider call was made. Public AI remains disabled.
- Dockerfile is prepared but Docker build was not run here.
- No full accessibility certification or load testing has been performed.
