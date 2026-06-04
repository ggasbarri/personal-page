# DESIGN.md

## Theme

**Scene:** a recruiter or peer engineer opens Gianfranco's link at night, on the couch, thumb-scrolling a glowing premium app; or on a laptop in a dim office between meetings. The mood is curious and calm, the device is the light source. This forces a **dark** UI, warm-tinted, with a single electric glow. Not dark "because dev tools are dark", dark because the app is the light in the room.

## Color

**Strategy:** Committed. One saturated accent (electric tangerine) carries the surface; warm-tinted neutrals everywhere else. Reference point: a confident consumer app at night, warm Iberian electric orange instead of the AI-assistant lavender reflex. All neutrals tinted toward warm hue ~60. OKLCH throughout, never `#000`/`#fff`.

```
--stage:        oklch(0.15 0.012 55)   /* ambient page behind the app */
--surface:      oklch(0.20 0.014 58)   /* app screen */
--surface-2:    oklch(0.24 0.016 58)   /* raised: incoming chat bubbles, panels */
--surface-3:    oklch(0.28 0.018 58)   /* chips, inputs */
--line:         oklch(0.34 0.014 58)   /* hairline borders */

--text:         oklch(0.95 0.008 75)   /* warm cream, primary */
--text-muted:   oklch(0.72 0.012 70)   /* secondary */
--text-faint:   oklch(0.56 0.012 68)   /* metadata, timestamps */

--accent:       oklch(0.74 0.175 52)   /* electric tangerine, primary accent */
--accent-strong:oklch(0.68 0.205 45)   /* pressed / emphasis */
--accent-soft:  oklch(0.74 0.175 52 / 0.14) /* tinted fills, glows */
--mint:         oklch(0.84 0.13 168)   /* tiny: "online" status dot only */
```

Accent budget: tangerine carries the brand (the user's own chat bubbles, the cursor, links, key numbers, the send button). Mint appears only as the live-status dot. Text is warm cream on warm dark.

## Typography

Reflex-reject list respected (no Inter / DM Sans / Space Grotesk / IBM Plex / Geist Sans for UI).

- **Display — Bricolage Grotesque** (700/800). Characterful grotesque for the hero name, the big "People also ask"-style section breaks, and oversize numbers. Allowed to break out past the app column at section moments.
- **UI / body — Schibsted Grotesk** (400/500/600). Friendly, slightly warm grotesque for the chat thread, answers, labels, buttons. This is the workhorse.
- **Mono — Geist Mono** (400/500). Used *only* for legitimately-technical chat chrome: citation tags `[1]`, timestamps, the typing indicator, status-bar clock, and the model/footer line. Not decorative.

Scale: fluid `clamp()`, ≥1.25 ratio between steps. Body 16–17px, line-length capped ~60ch inside the app column. Light-on-dark, so add ~0.06 to line-heights.

## Layout

- A centered **app column**, max-width ~460px, is the phone screen. It sits on the ambient `--stage` with a soft tangerine glow and a fine grain/noise overlay.
- A sticky **status bar** at top (mono clock `9:41`, signal/wifi/battery glyphs, app title "ask gianfranco" with mint online dot).
- The body is one continuous **chat thread**: the assistant's streamed answers (left, on `--surface-2` bubbles) and the visitor's questions (right, tangerine bubbles). Knowledge-panel and stack render as in-thread cards, not a separate grid.
- A sticky **composer** at the bottom: a row of suggested-prompt chips above a fake input ("Ask anything about Gianfranco…") with a tangerine send button. Chips drive navigation.
- **Break-out moments:** at major section transitions, a Bricolage display line ("people also ask", a huge metric, his name) extends to the full stage width behind/over the column for poster-scale punch. This is the "maximalist" seasoning on the app structure.
- Desktop adds ambient detail flanking the column (floating metric tickers, a faint dotted grid) so the phone reads as a deliberate object on a stage, not a narrow column on emptiness. Mobile drops the stage and goes full-bleed: the app IS the viewport.

Cards used only where they're the right affordance (knowledge panel, project entries, stack groups). No nested cards. No identical icon-title-text grid.

## Motion

Ease-out only, exponential curves (`cubic-bezier(0.16, 1, 0.3, 1)` / ease-out-expo). No bounce, no elastic. Never animate layout properties (animate transform/opacity; for thread height use `grid-template-rows`).

- **Hero:** the first question types itself into the composer, "sends" (slides up into the thread), a 3-dot typing indicator appears, then the answer **streams** in token-by-token with a tangerine block cursor.
- **On scroll:** each thread message reveals with a short translateY + fade, staggered. Knowledge-panel numbers count up once when in view.
- **Suggested chips:** tapping one "asks" it (chip animates into a user bubble), scrolls, and streams that section's answer if not already revealed.
- **Idle:** the composer cursor blinks; the online dot has a slow pulse. Restrained, not busy.
- `prefers-reduced-motion`: no typewriter/streaming, no count-up; everything renders immediately, scroll reveals become instant.

## Imagery

No stock photography (this is a tech/personal brand, not a place/food brief). The "imagery" is the rendered app UI itself: the device chrome, chat bubbles, the knowledge panel, animated numerics, an SVG favicon of his initials in tangerine. Typography and the live interaction carry the visual weight.

## Bans honored

OKLCH (no pure black/white) · no gradient text · no `background-clip:text` · no side-stripe borders · no glassmorphism-by-default · no hero-metric template · no identical card grid · no em dashes in copy · mono used only as legitimate chat chrome, never as "developer" costume.
