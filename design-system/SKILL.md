---
name: when-you-call-me-singe-design
description: Use this skill to generate well-branded interfaces and assets for "When You Call Me, Singe" — a bilingual interactive love-story video game — either for production or throwaway prototypes/mocks/screens/slides. Contains essential design guidelines, colors, type, fonts, the CRT visual language, iconography, and a UI kit of the game's screens (title, chapter select, cutscene, in-game HUD, endings).
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

This is a **video game**, not a website — design for the warm-static intimacy of a late-night screen, not a SaaS landing page. The governing image: a warm orange glow (Lou) and a cold blue glow (Elias) on near-black paper, converging only as far as the _connexion_ allows. Ration colour; amber/gold is the single bright accent. Newsreader serif for narration, JetBrains Mono for HUD/chrome, Trebuchet for in-engine text. CRT scanlines + vignette + flicker on every surface.

Key files:
- `colors_and_type.css` — import this for all colour, type, radius, gradient and motion tokens.
- `README.md` — product context, content & visual foundations, iconography.
- `ui_kits/game-hud/` — ready React components recreating the game's screens; copy them to assemble mocks.
- `preview/` — specimen cards for the palette, type, components and motifs.

If creating visual artifacts (slides, mocks, throwaway prototypes, screens), copy assets out and create static HTML files for the user to view. If working on production code, copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without other guidance, ask them what they want to build or design, ask a few focused questions (surface, chapter/tone, warm-or-cold register, variations), then act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
