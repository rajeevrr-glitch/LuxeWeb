# LuxeInfra UI direction - version 7

## Reference

Studio McGee's About page (https://www.studio-mcgee.com/about), viewed 17 October 2026, informed the generous image framing, serif hierarchy and calm spacing. This is design inspiration only. No competitor copy, photographs or code were imported.

## LuxeInfra interpretation

Keep the existing ivory and deep-blue theme, Cormorant Garamond headings and Jost body text. Use architectural curves for large photographs, warm paper surfaces and restrained natural colour swatches. Give the page one strong focal point rather than several competing panels.

Reimagine should feel like a personal design studio: a welcoming opening, a clear photograph entry, visual style selection and a structured brief. Real room photos remain distinguishable from style references. The interface must not imply a generated image exists when the provider is disconnected.

Existing photographs from the supplied project are used as inspiration only. Their rights and suitability for public launch still require owner confirmation, as recorded in the launch checklist.

## Implementation

src/refinement.css holds the visual refinements and is loaded after studio.css. Reimagine markup lives in src/routes/reimagine.tsx; the homepage feature lives in src/components/StudioHome.tsx. No new dependency or font was introduced. Reduced-motion preferences and keyboard focus are supported.
