# When You Call Me, Singe — Design System

A design system for **_When You Call Me, Singe_**, a bilingual interactive love-story video game. This folder gives a design agent everything needed to build on-brand artifacts — screens, slides, marketing pages, pitch decks, in-engine HUD mockups — that look and feel like the game.

> **It's a video game, not a website.** The "product" is a single-player narrative game that ships to web, PC and mobile. Its surfaces are: the **playable build** (an HTML5 canvas), the **Game Design Document** (a scrollable, CRT-styled artifact), and **promotional / pitch material**. Treat web conventions with suspicion — this is the warm static of late-night internet intimacy, not a SaaS landing page.

---

## The game in one breath

A sleepless Swede sends one restrained blue heart into a French streamer's 1 a.m. meltdown — and falls hard for a girl who never quite falls back. _When You Call Me, Singe_ is a **bilingual interactive love story** in which a quiet Swedish viewer (**Elias**), hopelessly in love, tries to learn the emotional language of **Loupiote / Lou** — a hot-tempered French-Maghrebi streamer who likes him, teases him, calls him _"singe"_ (monkey)… but never loves him back quite as hard.

It plays as a **visual novel braided with short arcade minigames**: rooftop races, fistfights against intrusive thoughts, an emotion-decoding quiz, a delete-before-you-send text duel, and a final ringing phone. A single **connexion** meter — visualised as Lou's warm palette bleeding into Elias's cold one — tracks how close they actually get, and routes the story to one of **three honest endings**.

- **Genre** — Interactive love story · VN hybrid with diegetic arcade interludes
- **Platform** — Web-first (HTML5), wraps to Steam / itch.io / iOS / Android
- **Length** — ~60–90 min · 3 endings · 1 hidden VOD · single-player
- **Languages** — English (cream) · French (dusty pink) · Swedish (lavender)

### Cast
- **Lou / "Loupiote"** — French-Maghrebi streamer, brown hair, short fuse. Loud, funny, performs affection at volume. Warm palette. _Invested 42, patience 24._
- **Elias / "EliasNordicBlue"** — tall, blond, Swedish; reads emotion like a foreign language. Devoted, patient, quiet to the point of being misread as cold. Cold palette. _Devotion 97, reads-Lou 28._
- **Baudelaire** — a black cat asleep on Lou's stream the entire game. Click him to unlock the hidden 9-hour-stream VOD.

### The four design pillars (every pixel obeys these)
1. **Love is not understanding** — it's patient translation.
2. **Every mechanic is a metaphor** — the race is keeping pace; the fight is intrusive thoughts; the quiz is misreading her.
3. **Two climates, one blend** — warm Lou, cold Elias; the palette blends only as far as they let each other in.
4. **The love is uneven** — he loves more than she does, and the game never pretends otherwise.

---

## Sources (for whoever builds on this)

This system was reverse-engineered from the game's own code and design document. If you have access, explore them directly — they are the ground truth.

- **Mounted codebase** — `ProfesseurNourv1-claude-friendly-keller-h8AkI/`
  - `index.html` — the **playable build**: a single-file HTML5 canvas chase-runner (Bruges → Paris → Sweden) in vanilla JS. Pixel-art Lou/Elias/monkey, WebAudio blips, parallax backgrounds, localStorage saves.
  - `GDD.html` — the **Game Design Document**: a scrollable, CRT-styled artifact that is itself a piece of the game's art direction (warm-top / cold-bottom, connexion-meter reading spine). **This is the richest source of the visual vocabulary** — palette, type, cards, character sheets, timeline, meters.
  - `screens/` — capture stills of the redesigned build (title hero with Nokia, dual CONNEXION/AUDIENCE meter HUD).
  - Copies of `GDD.html` and the build are kept in `source/` in this project for reference.
- **GitHub** — `https://github.com/Amendor47/ProfesseurNourv1`
  - ⚠️ Note: the repo's `main` branch currently holds a **different** project (an offline-RAG study-coach app, "Professeur Nour"), not the game. The game lives in the mounted working copy. Explore the repo if you need the broader author context, but the game's source of truth is the mounted codebase / `source/`.

---

## CONTENT FUNDAMENTALS — how the words are written

The voice is **literary, lowercase-leaning, bilingual, and emotionally precise**. It reads like a love letter typed in a terminal at 2 a.m. Restraint is the whole aesthetic — colour and capital letters are rationed; so are feelings, until they flood.

**Tone & vibe.** Tender but unsentimental. It states hard truths plainly ("the love is uneven") and trusts the reader to feel them. Wistful, a little wry, never twee. Think: a thoughtful indie-game GDD crossed with a breakup playlist.

**Person.** Third person for narration and lore ("She broadcasts vulnerability to thousands…"); second person when the design speaks to the player about what _they_ do ("**You** decode it for him", "the messages you _don't_ send"). System chrome speaks in clipped imperatives.

**Casing.** Headlines and body use **sentence case** ("Four rules the whole game obeys."). The wordmark and big titles are **ALL-CAPS monospace** ("WHEN YOU CALL ME, SINGE"). Kickers / eyebrows / labels are **UPPERCASE mono with wide tracking** ("DESIGN PILLARS", "▲ AUDIENCE"). Usernames are lowercased handles (`@loupiote`, `EliasNordicBlue`).

**Bilingual colour-coding.** Language _is_ emotional register, and it's literally coloured:
- **French** → dusty pink, italic — `<span class="fr">"singe"</span>`, `<span class="fr">Loupiote</span>`, `<span class="fr">connexion</span>`
- **Swedish** → lavender, italic — `<span class="sv">Första resan</span>`
- **English** → cream — the neutral, the sincere one she trusts least.

**Punctuation & rhythm.** Em-dashes for the caught breath. Ellipses for the trailing-off. Short fragments for impact, then one long flowing sentence that earns the weight. Italics on the word that hurts (_"too much"_, _"singe"_, _stays_).

**Emoji.** Used **deliberately, never as filler** — as iconography and as in-world texture (frog-spam in chat, a single blue 💙, 🍌, 🐈‍⬛, ☕). One emoji per card meta-slot, never a row of them for decoration.

**Specific examples (lift the cadence, not the literal lines):**
- Logline: _"A sleepless Swede falls hard for a French streamer who never quite falls back."_
- Pillar: _"Love is not understanding — it's patient translation."_
- Mechanic gloss (always one italic metaphor line under the description): _"how close you actually are, made visible."_
- Bittersweet ending: _"Some people arrive like unfinished songs."_
- In-engine bark (Lou): _"Not today!"_ · _"A monkey?! Really?!"_ — punchy, exclamatory, performed.
- In-engine bark (Elias): _"Wait— I just want to talk!"_ — earnest, interrupted.
- HUD strings: `connexion 06%`, `last seen 03:14 — "whatever lol"`, `● LIVE`.

**Don'ts.** No marketing exclamation in long-form copy. No "unlock your potential" SaaS-speak. No emoji confetti. Don't translate the French/Swedish away — the untranslated word is the point.

---

## VISUAL FOUNDATIONS

The look is **lo-fi, literary, and lit by a CRT** — never slick, always warm static. The governing image: an **orange glow (top-left) and a blue glow (bottom-right)** on near-black, converging only as far as the _connexion_ allows.

**Colour & climate.** Two opposed palettes that bleed toward each other. **Warm = Lou:** burnt-orange `#d8693b`, amber `#f2c14e`, dusty-pink `#e0a3a3`, cream `#f4ead5`. **Cold = Elias:** nordic-blue `#6e93bd`, snow-gray `#cdd6dd`, lavender `#b8b0cf`. Everything sits on **near-black paper `#0d0b12`**, raised surfaces `#14101a`. Colour is **rationed** — when it floods, it means something opened up. **Amber is the single ration of brightness** (accent, kickers, focus). The in-engine build uses a hotter warm pair — hoodie-pink `#E87D9A` and gold `#F5D03B` — for the pixel characters and HUD.

**Imagery vibe.** No photography. Imagery is **canvas pixel-art** (small running figures, parallax cities — Bruges, Paris/Eiffel, Swedish pines + IKEA) and **type-as-image**. Intimacy is carried by light, snow and typography — never literal character portraits. Colour grade is **warm-vs-cold split**, dim, slightly grainy. Backgrounds are flat dark fields with soft radial glows, _not_ photographs or busy gradients.

**Type.** Two families in tension. **JetBrains Mono** for HUD, chat, system chrome, kickers and labels (the terminal). **Newsreader** (a warm literary serif) for narration and body (the love letter). In-engine canvas text uses **Trebuchet MS**. Big titles are all-caps mono with a warm→cold gradient clipped to the glyphs.

**Backgrounds & texture.** Near-black base + two fixed radial glows (warm `12% 6%`, cold `88% 96%`). A **CRT scanline overlay** — `repeating-linear-gradient(0deg, rgba(0,0,0,.10) 0 1px, transparent 1px 3px)` with `mix-blend-mode:multiply` — plus a **radial vignette** and a slow **flicker** (opacity .85↔.7 over 7s). Optional lo-fi grain. No glossy gradients; no glassmorphism beyond a faint HUD blur.

**Borders.** Hairlines only: `1px solid rgba(205,214,221,.14)`. Section dividers are top-borders in the same line colour. Tinted cards get a coloured border at ~30% alpha of their climate (warm `rgba(216,105,59,.3)`, cold `rgba(110,147,189,.3)`).

**Corner radii.** Cards/pillars **14px**; large frames (the "monitor") **16px**; buttons **9px**; small panels / HUD **8px**; chips **20px (pill)**; swatches/avatars **10–12px**. Pixel/canvas elements stay sharp-cornered.

**Shadows & elevation.** Used sparingly. The big "monitor" frame: `0 30px 90px rgba(0,0,0,.55)`. Hover lift on buttons: `0 10px 28px rgba(242,193,78,.22)`. Glows are done with `text-shadow` / `box-shadow` in amber at very low alpha (`0 0 40px rgba(242,193,78,.06)`), not heavy drop shadows. Cards are mostly flat — separation comes from the `#14101a` surface against `#0d0b12`.

**Gradients.** Reserved for **meaning**: the connexion blend (warm→cold), meter fills (warm grad / cold grad), the reading-spine, and the wordmark text-clip. Never decorative purple/blue SaaS gradients. Character-card backgrounds use a subtle `165deg` climate-tint → transparent wash.

**Transparency & blur.** The HUD panel uses `background: rgba(13,11,18,.5)` + `backdrop-filter: blur(4px)`. Otherwise transparency appears as low-alpha tints over the dark paper. Blur is rare and quiet.

**Animation & motion.** Restrained and slow. **Reveal-on-scroll**: `translateY(18px)` + opacity over `0.7s ease`. **Blinking cursor** (`_`) on the title (1.05s steps). **CRT flicker** (7s). The connexion **spine fills** as you scroll (`height .12s linear`). Hover transitions ~`.2s`. In-engine motion is springy 60fps pixel animation (run cycles, particle bursts, floating text, screen-shake-free). Default easing for UI: `cubic-bezier(.22,.61,.36,1)`. No bounces, no parallax-on-mouse gimmicks.

**Hover / press states.** Buttons: ghost by default (transparent fill, amber 1px border, cream text) → on hover **fill amber, ink text, lift `-2px`** + amber glow. Links: amber, brighten on hover. Interactive cards: border brightens toward the climate accent. In-engine buttons use a pink translucent fill (`rgba(232,125,154,.22)`) with a gold border that brightens on press. No shrink-on-press; the lift/fill is the feedback.

**Layout rules.** Long-form artifacts: single **880px reading column**, generous `78px` section padding, top-border dividers. A fixed **reading-spine** at the left edge (3px) with an amber→lavender→blue gradient that fills with scroll, and a fixed **mono HUD** top-right (`GDD v1.0 · connexion 06%`). The game canvas is a fixed **900×500** surface, scaled responsively and letterboxed on near-black, with HUD drawn in screen-space (chapter+timer top-left, distance/connexion meters top-right, chapter dots top-centre, action button bottom-centre).

---

## ICONOGRAPHY

The game has **no SVG icon set and no icon font.** Iconography is built from three deliberate sources:

1. **Emoji as icons** — the primary "icon set". Used one-per-slot as section/mechanic glyphs and as in-world texture. Canonical emoji in use:
   `🎧` (Lou/stream) · `🎮` (Elias/play) · `💬` (story beat) · `🔀` (choice) · `📶` (connexion meter) · `📞` (the call) · `🧩` (decode quiz) · `📱` (text duel) · `🐒` `🐵` (monkey fight / "singe") · `🗣️` (bilingual) · `❤` `💙` (the heart) · `🍌` (banana) · `☕` (coffee pickup) · `🐈‍⬛` (Baudelaire the cat) · `🔥` `❄` `🥀` (the three endings) · `↗` `▶` `●` `▲` `▼` (mono-glyph UI marks). **Render emoji at intent, never as filler rows.**
2. **Monospace unicode glyphs** — UI marks set in JetBrains Mono: `▸` (loop arrow), `▲ ▼` (meter up/down), `↗` (open / external), `●` (LIVE / record dot), `_` (blinking cursor), `· × —` (separators).
3. **Canvas pixel-art** — in-engine, all characters, props and landmarks are **hand-drawn on the 2D canvas** (no image assets): Lou (pink hoodie, brown curls, necklaces), Elias (blue hoodie, blond side-swept hair) and his monkey form, NPCs (professor, tourist, conductor, viking), pickups (☕ coffee / ❤ heart), obstacles (book stacks, IKEA boxes, suitcases), and landmark silhouettes (Belfort, Eiffel, Swedish flag, IKEA sign).

**Logos / brand mark.** There is no raster logo file — the identity is the **typographic wordmark** "WHEN YOU CALL ME, SINGE" in all-caps JetBrains Mono with the warm→cold gradient clipped to the text and a blinking `_` cursor. Recreate it with CSS (see `preview/wordmark.html`), never trace it as an SVG.

**Substitution flag.** No icon-font substitution was needed (the game uses native emoji + mono glyphs). If a future surface needs outline icons, prefer a **thin-stroke, lo-fi** set and flag it — but default to emoji + mono glyphs to stay on-brand.

---

## Index — what's in this folder

| Path | What it is |
|------|------------|
| `README.md` | This file — product context, content & visual foundations, iconography, index. |
| `colors_and_type.css` | Design tokens: warm/cold/base colour vars, type scale, radii, gradients, motion. Import this. |
| `SKILL.md` | Agent-Skill front-matter wrapper so this system works as a downloadable Claude skill. |
| `source/` | Reference copies of the game's own `GDD.html` and the playable `game-build.html`. |
| `preview/` | Small HTML specimen cards that populate the Design System tab (palette, type, components, motifs). |
| `ui_kits/game-hud/` | UI kit: high-fidelity recreations of the game's screens — title menu, in-game HUD, cutscene, dual-meter stream layer, endings. `index.html` is an interactive walk-through. |
| `_ref/` | Raw screenshot stills from the build (scratch reference). |

**Build order for a new artifact:** import `colors_and_type.css` → wrap content in `.wycm` → lay out on near-black paper with the CRT/glow overlays → use Newsreader for prose, JetBrains Mono for chrome → ration colour, lead with amber → reach into `ui_kits/game-hud/` for ready components.
