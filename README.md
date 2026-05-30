# WHEN YOU CALL ME, SINGE

*a bilingual interactive love story · EN · FR · SV*

> A sleepless Swede sends one restrained blue heart into a French streamer's 1 a.m.
> meltdown — and falls hard for a girl who never quite falls back. *Not soulmates.
> Not destiny. Just two people deciding, night after night, whether to stay on the call.*

A visual novel braided with short arcade minigames. You play **Lou / "Loupiote"**
(a hot-tempered French-Maghrebi streamer, brown hair, short fuse) chased across
**Bruges → Paris → Sweden** by **Elias** (tall, blond, Swedish, hopelessly in love) —
and in the final chapter, she chases him back. A single hidden **connexion** meter,
rendered as her warm palette bleeding into his cold one, routes the story to one of
three honest endings.

## Play

The whole game is a single self-contained HTML5 canvas build — no build step, no
dependencies.

- **Quickest:** open `index.html` in any modern browser.
- **Recommended (avoids `localStorage`/file-URL quirks):** serve it locally —
  ```sh
  python3 -m http.server 8000
  # then visit http://localhost:8000/
  ```

**Controls** — `SPACE` / `↑` jump · `←` `→` move · `X` punch · or tap (on-screen pad
on touch devices). Click the sleeping cat 🐈‍⬛ on the title for a secret chapter.

## What's in here

| Path | What it is |
|---|---|
| `index.html` | **The playable build** — the full game, vanilla JS on a 900×500 canvas (parallax cities, pixel Lou/Elias/monkey, WebAudio blips, `localStorage` saves). |
| `docs/GDD.html` | The **Game Design Document** as a CRT-styled, scroll-driven artifact (the connexion meter fills as you read). |
| `docs/When-You-Call-Me-Singe-GDD.md` | The GDD in portable Markdown — concept, characters, mechanics, narrative arc, art & sound direction, sample walkthrough. |
| `design-system/` | The **brand & design system**: colour/type tokens (`colors_and_type.css`), the `README.md` guidelines, component/colour `preview/` specimens, the `ui_kits/game-hud/` React HUD recreations, and reference stills in `_ref/`. |

## The four pillars

1. **Love is not understanding** — it's patient translation.
2. **Every mechanic is a metaphor** — the race is keeping pace; the fight is intrusive thoughts; the quiz is misreading her.
3. **Two climates, one blend** — warm Lou, cold Elias; the palette blends only as far as they let each other in.
4. **The love is uneven** — he loves more than she does, and the game never pretends otherwise.

## Cast

- **Lou / "Loupiote"** — French-Maghrebi streamer, brown hair, short fuse. Warm palette.
- **Elias / "EliasNordicBlue"** — tall, blond, Swedish; reads emotion like a foreign language. Cold palette.
- **Baudelaire** — a black cat, asleep on Lou's stream the entire game. Click him to unlock the hidden 9-hour-stream VOD.
