# WHEN YOU CALL ME, SINGE — Game Design Document

> *a bilingual interactive love story · EN · FR · SV*
>
> **GDD v1.0 · canon+ · May 2026 · connexion 06%**
>
> *not soulmates. not destiny. just two people deciding, night after night, whether to stay on the call.*

---

## Design pillars — four rules the whole game obeys

Every system, line, and pixel is checked against these.

1. **Love is not understanding — it's patient translation.** Elias never fully *gets* Lou. The game is about staying through the not-getting, not about finally cracking her code.
2. **Every mechanic is a metaphor.** The race is keeping pace. The fight is intrusive thoughts. The quiz is misreading her. The phone is patience. No system is *just* a system.
3. **Two climates, one blend.** Lou is warm and loud; Elias is cold and quiet. The palette literally blends only as far as they let each other in.
4. **The love is uneven.** He loves more than she does. The game never pretends otherwise — and asks, honestly, whether uneven love is still worth staying for.

---

## 1. Game concept & logline

**Logline.** *A sleepless Swede sends one restrained blue heart into a French streamer's 1 a.m. meltdown — and falls hard for a girl who never quite falls back.* A bilingual love story about loving more than you are loved, and staying anyway.

**Concept.** *When You Call Me, Singe* is a visual novel braided with short, diegetic arcade minigames. You mostly play **Elias**, a quiet Swedish viewer hopelessly in love with **Lou / "Loupiote,"** a hot-tempered French-Maghrebi streamer who likes him, teases him, calls him *singe* (monkey)… but never loves him back quite as hard. A single hidden **connexion** meter — rendered as Lou's warm palette bleeding into Elias's cold one — tracks how close they actually get and routes the story to one of **three honest endings**.

**The title, decoded.** *"Singe"* is Lou's pet name for Elias. He doesn't like it — it makes him feel like her amusement, not her equal. He answers to it anyway. The whole game lives in that gap: *the things we accept from people who love us less than we love them.*

---

## 2. Genre & platform

| Axis | Choice | Why it serves *these* two people |
|---|---|---|
| **Core genre** | Narrative VN hybrid | Choice-driven visual novel as the spine, with arcade interludes — each genre-shift mirrors an emotional gear-change between *talking* and *acting*. |
| **Texture** | Lo-fi / CRT | Pixel runners, scanlines, emoji-as-icon, WebAudio blips — the warm static of late-night internet intimacy. The medium *is* the relationship: it lives on screens. |
| **Feel** | Emotional-translation sim | The real "skill" is reading a person who speaks in implication, sulks, and goes quiet. You will get it wrong. |
| **Platform** | Web-first, ships everywhere | HTML5 build runs in any browser; wraps cleanly for Steam / itch.io and iOS / Android. Touch + keyboard parity; on-screen pad for mobile. |
| **Scope** | Short & replayable | ~60–90 min per run · 3 endings · 1 hidden 9-hour-stream VOD · single-player. Solo-dev / small-team feasible. |
| **Languages** | EN (cream) · FR (dusty pink) · SV (lavender) | Language is the emotional register, and it's literally colour-coded. |

We refuse a single genre **because the relationship doesn't sit in one either** — flirtation is an arcade race, self-doubt is a brawler, misreading her is a quiz, restraint is a delete-key, and patience is a ringing phone.

---

## 3. Core gameplay loop

A five-step loop that repeats, gear-shifting between talk and action every chapter.

```
01  💬  STORY BEAT     A VN scene plays — chat scrolls, snow falls, Lou vents.
02  🔀  THE CHOICE     Say it / stay quiet / send it / delete it — public or private.
03  🎮  MINIGAME       The feeling becomes an action: race, fight, decode, text.
04  📶  METER SHIFTS    Connexion rises/falls; palettes blend or pull apart.
05  📞  NEXT NIGHT      Repeat across 4 chapters → the meter writes the ending.
```

**The loop's quiet cruelty:** the *right* move and the *rewarded* move aren't always the same. Performing for chat earns love instantly — sub alerts, emote spam, dopamine. Reaching Elias earns nothing visible… until, much later, it's the only thing that mattered. The game trains you toward the loud reward and then bills you for it.

---

## 4. Character sheets

*Depth without sainthood — neither is the easy one to love.*

### 🎧 Lou / "Loupiote"

> *@loupiote · ● live · French-Maghrebi streamer · brown hair · short fuse*

| Trait | Value |
|---|---|
| expressive | 96 |
| temper | 88 |
| invested | 42 |
| patience | 24 |

**Personality.** A popular live streamer who performs as Loupiote — *"the little lamp."* Loud, funny, quick — and quick to snap: she'll go off at chat, at lag, at Elias for a misread tone, then move on like nothing happened while he's still bleeding from it. She is generous in public and miserly in private with the one currency he wants: a plain, un-joking feeling.

**The contradiction that makes her real.** She broadcasts vulnerability to *thousands*, yet can't say one sincere thing to the one person who'd actually catch it. The performance is easier than the person. Affection, for her, has to be *loud* to feel safe — a tease, a bit, a stream segment — because anything quiet and direct could be believed, and being believed is terrifying.

**Three registers, one she trusts least.** Arabic at home, French on stream, a clipped English with Elias. The sincere register is the one she trusts least; sincerity has cost her before. Which language she reaches for tells you exactly how guarded she is in the moment.

**Backstory.**
- Built her channel from nothing; the audience arrived *before* any boyfriend did, and it shows — the stream is the relationship she's most loyal to.
- Heritage she keeps mostly off-stream — Loupiote is lighter, easier, more *sellable* than Lou. She is not ashamed of it; she is protective of it. There's a difference, and the game knows it.
- Calls Elias *singe* because teasing is how she shows affection. She knows he hates it. She does it anyway — and the day she stops is the day it would mean something, which is exactly why she can't.

**Role in gameplay.**
- **Runner & Fighter** — you play *her* in the rooftop/ice races and in the monkey-fights against her own intrusive thoughts. Playing Lou is the only time you're inside her head instead of guessing at it.
- **The text she sends** — the subject of the decode quiz; her implications are the puzzle.
- **The streamer layer** — her chat, her temper, and her oversharing drive the public-vs-private mechanic (see §7).

*She is not cruel. She is honest enough not to fake a love she doesn't fully feel — which is its own brutal kindness.*

### 🎮 Elias / "EliasNordicBlue"

> *EliasNordicBlue · lurking · tall · Swedish · blond · reads emotion like a foreign language*

| Trait | Value |
|---|---|
| devotion | 97 |
| patience | 90 |
| reads Lou | 28 |
| expressive | 18 |

**Personality.** Tall, blond, quiet to the point of being misread as cold. He isn't cold — he's *lost*. Emotions, especially Lou's, arrive as static he can't decode in real time. He replays her voice notes three times and still guesses wrong. He communicates through *action* — stays on silent calls, brings water, fixes things — because words fail him at speed.

**The contradiction that makes him real.** His silence reads to Lou as rejection. It's the *opposite* — it's the sound of him trying so hard not to get her wrong that he says nothing at all. His great virtue (he will never stop trying to understand her) is indistinguishable, from the outside, from his great absence (he can't tell her what he feels while it's happening).

**The math he knows.** He is the one who's in love — fully, inconveniently, more than is returned. He *knows* the arithmetic is uneven. He stays in the call anyway, because being near her unsolved is better than solving anyone else. The game's central ethical question is his: is that devotion, or is it just a quieter way of not being chosen?

**Backstory.**
- Found her by accident at 1 a.m.; sent a single blue heart 💙 instead of spamming. She remembered the username.
- Swedish winter taught him that silence is a *default*, not a punishment — a thing Lou, who fills every gap with noise, finds unbearable.
- Flinches every time she calls him *singe*. Has never once asked her to stop — until, maybe, once, if the player spends it.

**Role in gameplay.**
- **The player's seat** — most choices are his: send the heart, decode the quiz, hold or delete a text, answer or let it ring.
- **Ghost-rival** — the runner Lou races against; you feel him at her shoulder, never quite caught. Even as a phantom he's *pacing* her, which is the whole relationship in one sprite.
- **The waiter** — the final phone call is his patience turned into a mechanic.

### 🐈‍⬛ Baudelaire — the third character

A black cat, asleep on Lou's stream the entire game. Click him on the landing screen and he stretches, unlocking the hidden **"9-hour stream" VOD** — the only place you ever see Lou with the persona switched off, unperformed. He never wakes for anyone else. He is the game's proof that the real Lou exists; you just rarely get invited.

---

## 5. World & setting

*Two climates, mostly lived through the wires. The relationship happens online; reality is the rare, terrifying intrusion.*

- **Lou's world — warm.** *Always on, always loud.* A cramped, glowing bedroom-studio. Stream overlays, Discord pings, chat scrolling like weather, 2 a.m. playlists, French slang, frog emotes 🐸. Affection performed at volume. Safe **because** it's a stage — there's always a mute button and an audience to deflect to.
- **Elias's world — cold.** *Quiet, spacious, snowed-in.* A Swedish winter: empty rooms, long light, frozen lakes, Stockholm looking *"emotionally unavailable."* Silence as a default, not a wound. Terrifying to Lou, who fills it with noise the instant she arrives.

Most of the love lives in **liminal digital space** — Discord calls, Twitch chat, a text thread, a buzzing Nokia. When Lou finally visits Sweden in Act II, the *absence of an audience* is the whole drama: no chat to perform for, no mute button on a silence, just two people and the weather. The warm and cold palettes are not decoration — they are the two emotional atmospheres, and the game's central image is **how far they're willing to bleed into one another.**

---

## 6. Narrative arc — four chapters, three acts, three honest ends

**Contact → Translation → Rupture & Repair.** The meter decides which repair you get.

### Act I — Contact

**Ch.1 · The First Stream — *one blue heart in a wall of noise.***
Elias finds Lou mid-meltdown over a game's ending. Everyone performs love loudly; he sends a single restrained heart. She notices the quiet one. A teasing rooftop race is declared — *"loser admits feelings first"* — and the intrusive-thought monkeys 🐒 arrive.
→ `RUNNER · race 1` · `MONKEY FIGHT 1` · `CHOICE · send the heart`

### Act II — Translation

**Ch.2 · *Le problème des émotions* — *a four-minute voice note he can't parse.***
After a bad stream Lou leaves a rambling voice message — three feelings, two tangents, a joke hiding a plea. Elias listens three times and still can't read it. **You decode it for him.** Then Lou falls asleep on the call and he stays, silent, for three hours.
→ `DECODE QUIZ` · `SILENT CALL · intimacy beat`

**Ch.3 · *Första resan* — Sweden — *no audience, no mute button.***
Lou visits. Stockholm, a café where the owner assumes they're married, and a frozen lake where she asks, *"do you ever feel people only love versions of you?"* His long pause — once terrifying — lands, for once, as caution, not emptiness. A second race across the ice.
→ `RUNNER · race 2` · `MONKEY FIGHT 2` · `MEMORY BRANCHES`

### Act III — Rupture & Repair

**Ch.4 · *La grande dispute* — *she overshares; he vanishes.***
A fight spills onto her stream — impulsive, public. Elias goes quiet to self-regulate; she reads silence as abandonment; the *singe* nickname turns from tease to weapon. You hold both phones in the **text-duel**: type, panic, delete before you send.
→ `STREAM OVERSHARE` · `TEXT DUEL · delete mechanic`

**Finale · When You Call Me — *the phone rings; voice is too real.***
They mostly text now — voice feels dangerous. The finale opens on a ringing Nokia and a waiting mechanic: the longer you let it ring, the more her monologue spirals. Answer, and the meter chooses your ending.
→ `PHONE CALL · wait mechanic`

### The three endings (the meter decides)

| | Threshold | Ending | The honest truth of it |
|---|---|---|---|
| 🔥 | connexion ≥ 72 | **Ensemble à Stockholm** | Hopeful, not perfect. She lets him a little further in than she lets anyone. Final image: the two of them arguing lovingly over IKEA instructions. |
| ❄ | connexion 40–71 | **Still figuring it out** | The honest one. They love unevenly and keep trying anyway. The last scene isn't dramatic — just another call, another night, another attempt. |
| 🥀 | connexion < 40 | **We burned beautifully** | Bittersweet. Timing and the imbalance win. Years later, certain notification sounds still feel dangerous. *"Some people arrive like unfinished songs."* |

---

## 7. Key mechanics tied to the story

*Eight systems, each a translation of an emotional state into an action.*

| Glyph | When | Mechanic | What you do | The metaphor |
|---|---|---|---|---|
| 📶 | the spine | **The Connexion Meter** | One hidden 0–100 value tracks real closeness and drives the warm↔cold palette blend in real time. It writes the ending — and it's **harder to raise than to drop.** | *how close you actually are, made visible.* |
| 🏃‍♀️ | ch 1 & 3 | **The Race** | Lou auto-runs; you jump obstacles to keep pace with Elias's ghost. *"Loser admits feelings first."* | *keeping pace with someone who won't slow down.* |
| 🐒 | interludes | **The Monkey Fight** | Gremlins swarm — every *"t'es trop" / "you're too much, too loud, impossible to love."* Punch them back. Your HP is self-worth. | *Lou vs. her own intrusive thoughts.* |
| 🧩 | ch 2 | **Decode Lou** | Translate her implications. *"I'm fine"* = ask again, gently. A 2 a.m. playlist = a confession. **Wrong answers are the point.** | *Elias reading a language he'll never be fluent in.* |
| 📱 | ch 4 | **The Text Duel** | Hold both phones. Type the angry paragraph — then delete it and send the true one instead. The game rewards the messages you *don't* send. | *choosing what actually crosses the distance.* |
| 📞 | finale | **The Phone Call** | It rings. Answer, or let it ring. Waiting isn't idle — every unanswered ring deepens her spiralling monologue. | *the courage to pick up.* |
| 🐵 | recurring | **The "Singe" Beat** | Lou calls Elias *singe* at charged moments. As Elias you choose: let it slide, tease back, or — **once** — ask her to stop. Each nudges the meter and reveals how uneven the love is. | *the small name you swallow for someone.* |
| 🗣️ | always | **Bilingual UI** | French in dusty pink, Swedish in lavender, English in cream. The colour is the emotional register; which language she uses tells you how guarded she is. | *three languages, one she trusts least: sincerity.* |

### The Stream Layer — the streaming world, made mechanical

Lou's audience isn't backdrop; it's a **second force pulling against Elias.** During live scenes the chat scrolls beside the dialogue, reacting to everything — and the game runs **two meters in opposition:**

```
   ▲ AUDIENCE  · Perform · Loupiote          VS          ▼ CONNEXION · Reveal · Lou
   Stay in persona, play to chat,                         Break character, go quiet,
   overshare the drama. Instant love:                     take it to DMs. No applause,
   sub alerts, emote spam, dopamine.                      no reward you can see. The only
   Costs nothing now — and quietly                        person who notices is the one
   tells Elias he's watching a show.                      keeping the real meter.
```

**Why it matters mechanically.** Many beats let Lou feed *only one* meter at the other's expense — the dramatic engine of a streamer in love. Audience love is loud, immediate, addictive; connexion is silent and slow. In **Ch.4 the systems collide**: oversharing the fight on stream spikes **Audience** and craters **Connexion** in the same click. The hidden 9-hour VOD (via Baudelaire) is the one place both meters go quiet and you simply *watch her be a person.*

This is how the brief's hard constraint is honored: the parasocial dynamic is not flavor — it is a literal opposing resource the player must spend against the thing they're trying to build.

---

## 8. Art direction & visual style

*Lo-fi, literary, and lit by a CRT — never slick, always warm static.*

**Two palettes that bleed toward each other.**

- **Warm — Lou:** burnt-orange `#d8693b` · amber `#f2c14e` · dusty-pink `#e0a3a3` · cream `#f4ead5`. In-engine pixels run hotter: hoodie-pink `#E87D9A` + gold `#F5D03B`.
- **Cold — Elias:** nordic-blue `#6e93bd` · snow-gray `#cdd6dd` · lavender `#b8b0cf`.
- **Base:** near-black "paper" `#0d0b12`; raised surfaces `#14101a`; canvas void `#08070c`.

**Central image.** An orange glow (top-left, `12% 6%`) and a blue glow (bottom-right, `88% 96%`) on near-black, converging only as far as the connexion meter allows.

- **Type.** Two families in tension — **JetBrains Mono** for HUD, chat and system chrome (*the terminal*); **Newsreader** serif for narration (*the love letter*); Trebuchet MS for in-engine canvas text. Big titles are all-caps mono with a warm→cold gradient clipped to the glyphs and a blinking `_` cursor.
- **Texture.** CRT scanline overlay (`repeating-linear-gradient` at `mix-blend-mode:multiply`) + radial vignette + a slow 7s flicker on every surface, plus optional lo-fi grain.
- **Characters.** Pixel bodies, real faces off-screen. Lou (pink hoodie, brown curls, necklaces) and Elias (blue hoodie, blond side-swept hair, and his monkey form) are small pixel runners in action; **intimacy is carried by light, snow, and type — never literal portraits.**
- **Iconography.** No SVG set, no icon font. Emoji-as-icon (one per slot, never filler rows) + monospace unicode glyphs (`▲ ▼ ● ↗ _`) + hand-drawn canvas pixel-art.
- **Motifs.** A buzzing Nokia, falling flakes on the cold beats, frog-spam in chat 🐸, the sleeping cat 🐈‍⬛.
- **Colour rule.** Everything sits on near-black; **colour is rationed.** Amber is the single ration of brightness. When colour *floods*, it means something opened up. Gradients are reserved for *meaning* — the connexion blend, meter fills, the reading-spine, the wordmark.

---

## 9. Sound & music direction

*Two themes that learn to share instruments — and silence treated as a playable sound.*

- **Lou's theme — warm.** Lo-fi & chanson: boom-bap drums, a dusty Rhodes, a French vocal sample looped a little too long. Expressive, a little messy, always on.
- **Elias's theme — cold.** Nordic ambient: sparse piano, room tone, a single held synth. Minimal to the point of absence — mostly the space between notes.

**The mix is the relationship.** As connexion rises, the two scores interleave — her drums creep under his piano; his held note surfaces in her loop. **Full blend only plays at the hopeful ending.**

- **Diegetic — the internet, heard.** Discord join-hum, mechanical keyboard clicks, the Twitch alert sting, a Nokia ringtone. The sounds of being online together.
- **Signature — dangerous notifications.** One alert sound recurs at every emotional spike, so that by the bittersweet ending the *player* flinches at it too. Sound as scar tissue.
- **Negative space — silence is a track.** The 3-hour call and the frozen-lake pause are scored with near-nothing — breathing, keyboard, wind. Restraint as intimacy.

---

## 10. Sample scene walkthrough — Ch.2, "the voice note he can't read"

A full annotated beat, showing how a single scene runs the loop, the meters, the palette, and the writing voice together.

**Setup (💬 story beat).** It's 1:54 a.m. Elias's room is dim nordic-blue; on his second monitor, Lou's stream has ended — the *● LIVE* dot is grey now. A Discord notification chimes (the *dangerous* alert sting, low). A four-minute voice note from `@loupiote`. The serif narration, cream: *"She only sends voice when she's too tired to perform the text."* Snow drifts in the window. No chat here — this scene is **private**, so the Audience meter is hidden entirely. Only 📶 Connexion is live, sitting at a quiet warm-cold midpoint.

**The voice note (audio + waveform).** It plays in her register: French slang sliding into clipped English, a joke, a long exhale, a tangent about her cat, then — fast, almost swallowed — *"…whatever lol."* The waveform is drawn in dusty-pink. Elias replays it. Replays it again. (Diegetic: the keyboard click of the replay button.) The narration: *"He has heard it three times. He still does not know what she is asking him for."*

**The decode (🧩 minigame).** Four lines surface from the note, each with three readings. The player picks Elias's interpretation:

| Her words | The trap reading | The true reading |
|---|---|---|
| *"whatever lol"* | "she doesn't care" | **"this matters and I'm scared it doesn't to you"** |
| *"the stream was fine"* | "good night, then" | **"ask again, gently"** |
| *"sorry this is so long"* | "apologise back" | **"please don't go"** |
| *the 2 a.m. playlist link* | "music rec" | **"this is the confession"** |

Wrong answers don't fail you out — they *play out*. Pick "she doesn't care," and Elias types *"ok, sleep well"*; the scene shows Lou's read-receipt, then her typing bubble appearing… and vanishing. **Connexion drops a notch; the room cools a shade bluer.** The lesson is in the cooling, not a game-over. The brief's "you will get it wrong" is literally the design.

**The choice (🔀).** Having decoded (well or badly), Elias gets one move: **call her back**, **send a careful text**, or **send nothing and just stay online so she sees he's awake.** The third — the quietest, least legible option — is the highest connexion gain *if* he decoded "please don't go" correctly. The game keeps rewarding the move no one would clap for.

**The intimacy beat (📶 silent call).** If he calls, Lou answers, talks for ninety seconds, then falls asleep mid-sentence. A prompt: *hang up* / *stay*. Staying triggers the game's quietest spike: three hours rendered as a slow, near-silent passage — her breathing, his keyboard, the held synth surfacing under nothing. The palette warms by degrees as the clock advances. **Nothing romantic is said. It's the closest they've been.** Narration, last line, cream going gold: *"He stayed. That was the sentence."*

**Mechanical job of the scene.** Make Elias's core struggle — reading emotion — into the literal verb of the chapter, then prove the thesis: the unrewarded, illegible act of *presence* is worth more to the real meter than any clever, performed reply.

---

## 11. Comparable titles & the gap we fill

| Lineage | Title | What we take / how we differ |
|---|---|---|
| relationship-as-minigames | **Florence** | Feelings-as-verbs — but we add real failure, real imbalance, and a second person who loves *less*. |
| parasocial streamer sim | **NEEDY STREAMER OVERDOSE** | Meter-driven, multi-ending online-identity tension — aimed *outward*, at one viewer who became real. |
| bilingual VN, cultural heart | **Butterfly Soup** | Cultural specificity + humour + ache. Our French-Maghrebi / Swedish register-switching lives in this lineage. |
| text-interface nostalgia | **Emily is Away** | Romance through a chat window and the things you almost typed — our delete-mechanic is its descendant, with stakes. |
| lo-fi, emotional labour | **VA-11 Hall-A** | Mood, music, conversation over spectacle; "listening is the gameplay." |
| literary, magical-realist tone | **Kentucky Route Zero** | The confidence that quiet, strange, sincere writing *is* the feature. |

**The gap.** None of these put a *volatile, half-invested streamer* and a *quiet, all-in foreigner who can't read her* in the same uneven relationship — and let the mechanics tell the truth about who loves whom more. That asymmetry, plus the bilingual register-switching and the arcade interludes, is the whole pitch.

---

## 12. Production notes (appendix)

- **Engine / build.** Single-file HTML5 canvas in vanilla JS, 900×500 fixed surface, scaled responsively and letterboxed on near-black. localStorage saves; WebAudio for blips and stings. No image assets — all characters/landmarks hand-drawn on canvas.
- **Accessibility.** Touch + keyboard parity; on-screen pad for mobile. Minigames are *expressive, not punishing* — failure routes to story, never to a wall. Subtitles for all diegetic audio; the decode quiz is timing-free.
- **Localization.** EN/FR/SV are first-class and colour-coded; untranslated French/Swedish words are *intentional* and must survive localization (the untranslated word is the point — never translate *singe*, *Loupiote*, *connexion*, *Första resan* away).
- **Replay hooks.** Three endings, the hidden Baudelaire VOD, and a chapter-select; the connexion meter persists per save so a run's history is legible.
- **Content sensitivity.** Lou's heritage and Elias's emotional difference are written as *specific people*, never as cultural shorthand — every trait is paired with a contradiction (see §4). No trait exists to explain a behavior by ethnicity or nationality.

---

> *"What if love is not perfect understanding? What if it is patient translation?"*
> — and what if you do all the translating?
>
> **WHEN YOU CALL ME, SINGE** · LOU — loud, quick to anger, half in it · ELIAS — quiet, all in, can't read her · BAUDELAIRE — the cat, asleep.
