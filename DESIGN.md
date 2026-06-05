# DESIGN.md

## Theme

**Scene:** a recruiter or peer engineer opens Gianfranco's link in daylight, between meetings, on a phone or a laptop, curious and unhurried. Nothing about that forces dark; the earlier dark+glow version read as AI-generated. So this is **light**: a warm paper surface, ink text, one deep accent. The mood is editorial and human, like a well-set printed page, not a glowing app.

## Color

**Strategy:** Committed. Warm paper neutrals carry the page; one deep **clay-red** is the single accent (the visitor's own chat bubbles, the continue button, links, key numbers). Reference point: a confident printed specimen, warm Iberian clay instead of the dark-mode-with-neon-accent reflex. All neutrals tinted warm (~hue 50-86). OKLCH throughout, never `#000`/`#fff`. No glow halos.

```
--stage:        oklch(0.915 0.014 83)  /* warm ecru page behind the app */
--surface:      oklch(0.975 0.006 86)  /* app screen, warm white */
--surface-2:    oklch(0.948 0.011 80)  /* raised: incoming bubbles, panels */
--surface-3:    oklch(0.918 0.014 78)  /* chips, inputs */
--line:         oklch(0.85 0.015 76)   /* hairline borders */

--text:         oklch(0.28 0.018 52)   /* warm charcoal ink, primary */
--text-muted:   oklch(0.46 0.020 50)   /* secondary */
--text-faint:   oklch(0.60 0.018 52)   /* metadata */

--accent:       oklch(0.47 0.155 33)   /* deep clay red, AA on paper */
--accent-strong:oklch(0.41 0.160 32)   /* pressed / emphasis */
--accent-ink:   oklch(0.975 0.012 80)  /* paper text on accent fills */
--accent-soft:  oklch(0.47 0.155 33 / 0.13) /* tinted fills */
--mint:         oklch(0.58 0.135 150)  /* tiny: "online" status dot only */
```

Accent budget: clay-red carries the brand (the visitor's chat bubbles, the cursor, links, key numbers, the send button, the continue CTA). It is kept at L≈0.47 so even small text clears WCAG AA on paper. Mint appears only as the live-status dot. Ink is warm charcoal on paper.

## Typography

Reflex-reject list respected (no Inter / DM Sans / Space Grotesk / IBM Plex / Geist Sans for UI).

- **Display — Bricolage Grotesque** (700/800). Characterful grotesque for the hero name, the big "People also ask"-style section breaks, and oversize numbers. Allowed to break out past the app column at section moments.
- **UI / body — Schibsted Grotesk** (400/500/600). Friendly, slightly warm grotesque for the chat thread, answers, labels, buttons. This is the workhorse.
- **Labels — Schibsted Grotesk** (`--font-label`), lowercase, lightly tracked. The small UI labels (chapter kickers, panel keys, tile orgs, kit rows) are sans, not mono. Lowercase throughout, matching the quiet "ask gianfranco" voice. Using mono for labels was part of the AI-slop tell and was removed.
- **Mono — Geist Mono** (400/500). Kept *only* where it is literally true: the status-bar clock, and the code-module chips in the agent diagram (`auth`, `listings`, ...). Nowhere decorative.

Scale: fluid `clamp()`, ≥1.25 ratio between steps. Body ~16.5px, line-length capped ~60ch inside the app column.

## Layout

- A centered **app column**, max-width ~460px, is the phone screen. It sits on the warm-paper `--stage` with a soft light bezel and shadow (a "paper-cradle"), plus a faint paper-tooth grain. No glow.
- A sticky **status bar** at top (mono clock `9:41`, signal/wifi/battery glyphs, app title "ask gianfranco" with mint online dot) with a hairline story-progress fill beneath it.
- The body is one continuous **chat thread**: the assistant's streamed answers (left, on `--surface-2` bubbles) and the visitor's questions (right, clay-red bubbles). Knowledge panel and answers render as in-thread cards, not a separate grid.
- A sticky **composer** at the bottom: a row of suggested-prompt chips above a **real** input. A typed question routes to its closest topic (keyword match) or to contact; chips and the continue button also drive navigation.
- Desktop grounds the floating phone with one oversize, very-low-contrast **wordmark** ("Gianfranco Gasbarri") bleeding off the left gutter; the stage is otherwise open paper. Mobile drops the stage and goes full-bleed: the app IS the viewport.

Cards used only where they're the right affordance (knowledge panel, project entries, stack groups). No nested cards. No identical icon-title-text grid.

## Motion

Ease-out only, exponential curves (`cubic-bezier(0.16, 1, 0.3, 1)` / ease-out-expo). No bounce, no elastic. Never animate layout properties (animate transform/opacity; for thread height use `grid-template-rows`).

- **Hero:** the first question types itself into the composer, "sends", a 3-dot typing indicator appears, then the answer **streams** in token-by-token with a clay block cursor; visual modules pop in staggered.
- **Story arc:** the thread is sequenced (hook, challenge, development, setback, payoff). Each answer ends with a single "continue" button that **morphs into the question bubble** it becomes (View Transitions). A hairline progress bar fills; the paper's temperature shifts subtly per beat (cooler at the challenge, dimmer at the setback, warmer at the payoff).
- **Idle:** the online dot has a slow pulse. Restrained, not busy.
- `prefers-reduced-motion`: no typewriter/streaming/morph, no count-up; everything renders immediately.

## Imagery

No stock photography (this is a tech/personal brand, not a place/food brief). The "imagery" is the rendered app UI itself plus his profile photo (mirrored to face into the card), the animated numerics, and an SVG favicon. Typography and the live interaction carry the visual weight.

## Bans honored

OKLCH (no pure black/white) · no gradient text · no `background-clip:text` · no side-stripe borders · no glassmorphism · no glow halos · no hero-metric template · no identical card grid · no em dashes in copy · mono only where literally true (clock, code modules), never as "developer" costume.
