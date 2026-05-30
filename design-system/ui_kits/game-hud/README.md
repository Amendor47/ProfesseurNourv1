# UI Kit · Game HUD — _When You Call Me, Singe_

A high-fidelity recreation of the game's screens and chrome. The game is a single-player **chase-runner / visual-novel hybrid** that lives inside a CRT-lit "monitor"; this kit rebuilds its five states as clickable React components so you can assemble on-brand mocks without touching the canvas engine.

> **Recreation, not production code.** The real characters and cities are drawn on a 2D `<canvas>`; here Lou/Elias/the monkey are simplified CSS figures and the cities are CSS silhouettes. The **UI chrome** (menus, HUD, meters, dialogue, endings) is the faithful part — that's what a UI kit is for. Source of truth: `../../source/game-build.html` + `../../source/GDD.html`.

## Run it
Open `index.html`. It boots a small state machine — Title → Cutscene → Play → Ending, plus Chapter Select. Use the rail under the monitor to jump between states; the second rail swaps chapter (1–4) in Play/Cutscene and ending flavour (warm / honest / cold) in Ending.

## Files
| File | What it provides |
|------|------------------|
| `kit.css` | The "monitor" shell — bezel, 900×500 screen, CRT scanlines + vignette + flicker, run-cycle keyframes, the in-engine `.gbtn` button. Imports the root design tokens. |
| `Sprites.jsx` | `<Runner who>` (lou / elias / monkey block figures), `<Bubble>` (mono speech bubble), `<PlayBackdrop chapter>` (parallax sky → ground, chapter-tinted). |
| `HUD.jsx` | `<HUD>` and its parts: `<ChapterDots>`, `<DistanceBar>` ("Elias is getting closer…"), `<ConnexionMeters>` (the signature connexion-vs-audience dual meter). |
| `Screens.jsx` | `CHAPTERS` data + `<TitleMenu>`, `<ChapterSelect>`, `<Cutscene>`, `<Ending>` (+ `ENDINGS`). |
| `PlayScene.jsx` | `<PlayScene chapter>` — backdrop + both runners + dialogue + full HUD + item ring. Chapters 2–3 morph Elias into the monkey; chapter 4 flips who chases whom. |
| `index.html` | Wires it all into the interactive walk-through. |

## Component coverage
- **Title menu** — gradient wordmark, "A love story in 4 chapters", START GAME / CHAPTER SELECT, control hint, Baudelaire the cat easter-egg.
- **Chapter select** — 2×2 grid of chapter cards with best-times, lock states.
- **Cutscene** — kicker + serif narration + skip hint, fade-up reveal.
- **Play HUD** — chapter+gold timer, 4 chapter dots, distance bar, connexion/audience meters, throwable cooldown ring.
- **Endings** — three honest endings (🔥 warm / 🥀 honest / ❄ cold) with stat line + PLAY AGAIN.

## Reuse notes
Every component reads the CSS vars from `../../colors_and_type.css`. In-engine text uses Trebuchet (`--game`); HUD/labels use JetBrains Mono (`--mono`); narration uses Newsreader (`--serif`). Keep colour rationed — amber/gold is the one bright accent. To drop a screen into your own mock, mount one component inside a `.screen` div inside the `.monitor` shell.
