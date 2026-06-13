# PRODUCT.md

## Product

**GianOS** — the personal page of Gianfranco Gasbarri, built as an explorable fake phone OS. Visitors arrive at a lock screen, unlock to a home grid, and open full-screen apps that each cover a different aspect of who he is: career story (Messages), journey (Maps), side study (Ledger), stack (Terminal), contact (Mail), and a theme toy (Settings). A hidden bonus app (Notes) unlocks when all six are visited.

**Register:** brand. Design IS the product. This is a portfolio; the visitor's impression is the deliverable. The content is intentionally light (a bio, a few real work projects, a stack), so the design and the exploration loop carry the weight.

**Signature mechanic (the hook):** the site is a working phone OS — explorable, not scrolled through. The visitor picks iOS or Android; the whole device re-skins (Liquid Glass vs Material 3 Expressive). A collection meta-game (badge dots, Live Activity discovery tracker, completion reward) rewards curiosity. The Messages app preserves the original streaming chat story as the narrative spine. This does double duty: it demonstrates the scope of Gian's work and proves the craft of a senior mobile engineer — because mobile engineers know exactly how these surfaces should look. See **OS-feature layer** below, and DESIGN.md for the visual and navigation spec.

## Users

- **Recruiters, hiring managers, and engineering leaders** evaluating a senior mobile engineer. They scan fast, on a phone or a laptop, often between meetings. They should grasp seniority, scope (cross-org, not just code), and craft within seconds.
- **Peer engineers** (mobile, platform) who land here from LinkedIn or a conference and want to know "is this person legit and interesting." They reward technical specificity and a clever build.
- **Gianfranco himself**, who wants a surface that feels unmistakably his and that he's proud to drop in a bio link.

## Who Gianfranco is

Officially a Senior Mobile Engineer at OLX Group (Motors), based in Aveiro, Portugal (8 years across Flutter and native Android). This is internal context for writing the page; the title itself is **not** printed on the page (see Positioning rules). His work increasingly sits across a large org: he aligns engineering, product, and platform teams, makes architecture trade-offs legible, shapes reusable standards, mentors, and improves how teams work with modern coding tools. Multilingual: Spanish (native), Portuguese (fluent), English (professional). Currently studying economics; keep this as light personal texture, not a new headline.

Signature work, **stated accurately** (see Positioning rules; prefer his honest self-assessment over inflated promotion docs):
- The **Flutter migration** of the Motors apps (3M+ daily launches across Europe): he does **not** own or "lead" it. He helps several teams line up behind a Flutter direction: scope, sequencing, risks, and the tradeoffs everyone has to live with.
- **Longer-term architecture direction:** shaping fast experiments so the next version is easier to reason about and evolve.
- **Modern coding-tool adoption:** Agents.md context so coding agents understand the project map, module boundaries, and decisions they should not rediscover every prompt.
- **Reusable standards:** turning repeated platform and team decisions into patterns people can pick up without reopening the same call.
- Earlier: a **Kotlin Multiplatform** code-sharing initiative across native Android and iOS.

## Positioning rules (stated directly by Gianfranco, treat as hard constraints)

- **Accuracy over impressiveness. Never overstate, never lie, never sound arrogant.** No claim he wouldn't make to a colleague's face. He collaborates, aligns, and makes decisions over time; he does not single-handedly own big initiatives. The Flutter migration is the canonical example: he helps shape and align it, he did not decide or lead it. Sell the *collaboration, strategic thinking, and the decisions* he was able to make.
- **His own promotion / performance docs overstate and can be cringe.** They say "Staff", "led the migration", "secured executive sign-off", "10+ teams". Treat them as raw material, not truth. Prefer his honest FY26 self-assessment for facts.
- **Subtle staff-level signaling, never stated.** He is currently a Senior Mobile Engineer and wants visitors to come away feeling he *deserves staff*. So: **do not print any job title on the page**, and **never use the word "Staff"** (cringe, do not shout it). Let the scope of the work imply the level: cross-team collaboration, architecture trade-offs made legible, prioritizing initiatives by business value, force-multiplying through standards and an interview format others adopt, mentoring. Keep it subtle.
- **Short text.** He worries people won't read at all. Keep copy minimal; lead with visual elements; bold only the words that matter. "Text is for CVs"; this page sells the work visually.
- **No cringe / no slop copy.** Cut marketing filler and self-congratulation (e.g., a "built by hand, not by a template" footer, or an on-the-nose "Architecture & alignment across teams" label). Real facts, plainly.

## Brand voice

Three words, as physical objects: **machined** (a precisely milled aluminum phone), **conversational** (a warm spoken answer, not a brochure), **contemporary** (built with the newest tools, unmistakably 2026).

Tone in copy: first person, as Gian answering directly. Confident and specific, but **understated, never boastful**; never buzzword-padded. Metrics are context, not identity: the 3M+ OLX Motors app-launch metric belongs only in the OLX Motors beat, never in the hero. A little dry wit is welcome; corporate gloss is not.

**Name:** the story uses **"Gian"** where it reads naturally and warm (e.g. "Hey, I'm Gian"). The formal **"Gianfranco Gasbarri"** is reserved for identity surfaces: page title, wordmark, profile name, the contact poster. Both coexist.

## Strategic principles

- The exploration is the hook. The lock screen, badge dots, discovery tracker, and completion reward are the interaction — not just the chat. Every app opened should feel like a reward.
- Specific beats grand. Real work ideas, real metrics where they add context, real tools, stated honestly (see Positioning rules). Avoid internal OLX project names in visible copy.
- Minimal text; the design and the visual modules carry the weight, not paragraphs.
- It must read as hand-built, not generated. The bar is "how was this made?", not "which AI made this?"
- Fast and frictionless. Static, no build step, loads instantly, works on a phone first. Hash router enables deep-linking into any app.
- **The phone must read as a *real* phone.** Platform chrome (status bar, Live Activity, notifications, gesture nav, materials, wallpaper, icon shapes) must resemble the *actual current* OS, iOS 26 Liquid Glass and Android Material 3 Expressive, not a generic approximation. Research the current OS design when unsure: wrong-looking native UI is worse than none, because the audience includes mobile engineers who know exactly how these surfaces should look.
- **Messages:** chips drive the story; no free-text input. Navigation is the suggested-prompt chips plus the per-answer "continue" button. The opening question types itself into the outgoing bubble. The final beat includes a "explore the rest →" CTA back to the home grid.

## OS-feature layer

The site is a phone OS with multiple launchable apps. A platform selector (iOS / Android) reskins the whole device; the reskin touches only chrome (status bar, Live Activity, notifications, icon shapes, materials, wallpaper) — app content keeps the brand type and clay-red accent. Requirements:

- **Platform selector.** iOS / Android, auto-detected from the visitor's device, switchable, and remembered (`localStorage`, key `gg-os-v1`). On desktop it sits *outside* the phone on the right stage; on mobile it lives in Settings.
- **Navigation.** Boot → lock screen (once per session, skipped on deep links) → home grid → app (View Transition zoom-from-icon). Nav indicator always goes home. Hash router (`#m/<appid>`) enables direct deep-linking.
- **Collection meta-game.** Each app icon wears a badge until first open. The Live Activity acts as a discovery tracker outside Messages ("3/6 explored", expand card with checklist). All 6 visited → LA pulses, Notes icon appears on the grid. State in `localStorage`.
- **Live Activity spine (Messages).** Inside Messages the LA reverts to the story-beat role (tracks the chat arc, wakes/expands/shows per-beat state). On Messages close it restores to the discovery tracker.
- **A native feature per Messages beat**, chosen for narrative meaning:
  - hero, the activity *wakes*; challenge, it *starts* (blocked); build, it *expands* (long-press detail).
  - ai, **Apple Intelligence** edge-glow (iOS) / **Circle-to-Search → Gemini** (Android), tied to his AI-tooling work.
  - setback, **Focus / Do Not Disturb** dims the room and silences a notification.
  - conclusion (**the marquee**), a cascade of notifications framed as outcomes: clearer constraints, reusable patterns, fewer bespoke exceptions, decisions that stay decided.
  - contact, **Contact Poster** (iOS) / **Quick Share** sheet (Android).
- **Theme toy (Settings).** A hue slider and preset swatches re-seed `--seed` on `:root`, re-deriving the accent family, M3 tonal palette, and wallpaper tint live via CSS relative color syntax. Per-app committed palettes (Maps blue, Ledger green, Terminal dark) are immune. Hue persists.
- **Fidelity is the point** (see Strategic principles): Liquid Glass vs Material 3 Expressive, real status-bar glyphs per platform, gesture-nav indicators, platform corner radii, wallpaper that animates on switch.
- **Accessible.** Lock screen always has a real button. Every feature has a complete `prefers-reduced-motion` end state (no goo/glow/spring/route-draw/VT; cascade falls back to static chips; Maps route pre-drawn).

## Anti-references

- A generic ChatGPT/Perplexity clone (AI-purple/teal, lavender gradients, the assistant-app default look).
- **The AI-generated dark theme:** dark mode + a single glowing accent + monospace "tech" labels + grain. This was the first version; it read as "AI made this" and was explicitly rejected in favor of the light "paper" theme (see DESIGN.md).
- The editorial-typographic lane (display-serif italic + mono labels + ruled columns).
- The hero-metric SaaS template (big number, small label, gradient accent, identical cards).
- **Overstated or arrogant copy**, job titles, the word "Staff", and cringe footer/marketing lines (see Positioning rules).
- Buzzword bio copy ("passionate, results-driven, synergy").
- Cartoonish or generic OS chrome that doesn't match the real platform; native components that a mobile engineer would clock as fake (see OS-feature layer).
