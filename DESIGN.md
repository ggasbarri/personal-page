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
- **Mono — Geist Mono** (400/500). Kept *only* where it is literally true: the code-module chips in the agent diagram (`auth`, `listings`, ...). Nowhere decorative. (The status-bar clock moved *off* mono onto a system-style sans, weight per platform, so it reads like a real OS clock.)

Scale: fluid `clamp()`, ≥1.25 ratio between steps. Body ~16.5px, line-length capped ~60ch inside the app column.

## Layout

- A centered **app column**, max-width ~460px, is the phone screen. It sits on the warm-paper `--stage` with a soft light bezel and shadow (a "paper-cradle"), plus a faint paper-tooth grain. No glow.
- A sticky, **per-OS status bar** at top: clock (system sans) left, the **Live Activity** (iOS Dynamic Island / Android promoted Live Update status chip) center, platform-specific signal/wifi/battery glyphs right (iOS bars + arc-wifi + horizontal battery pill; Android triangle wifi/signal + `84%` + upright battery). A hairline story-progress fill sits beneath it; Focus mode adds a moon glyph.
- The body is one continuous **chat thread**: the assistant's streamed answers (left, on `--surface-2` bubbles) and the visitor's questions (right, clay-red bubbles). Knowledge panel and answers render as in-thread cards, not a separate grid.
- A sticky **composer** at the bottom: a scroll-snapping row of suggested-prompt chips (clicking a chip centers it), and a **gesture-nav indicator** beneath (iOS home bar / Android handle). There is **no free-text input**; chips plus the per-answer "continue" button drive all navigation. The platform selector lives here on mobile.
- Desktop grounds the floating phone with one oversize, very-low-contrast **wordmark** ("Gianfranco Gasbarri") off the left gutter, the **platform selector** off the right gutter (out of the phone), and a **per-OS wallpaper** behind the phone (cool gradient for iOS, warm Material You gradient for Android) that crossfades on switch. Mobile drops the stage and goes full-bleed: the app IS the viewport, and the OS reads through the chrome.

Cards used only where they're the right affordance (knowledge panel, project entries, stack groups). No nested cards. No identical icon-title-text grid.

## Motion

Ease-out only, exponential curves (`cubic-bezier(0.16, 1, 0.3, 1)` / ease-out-expo). No bounce, no elastic. Never animate layout properties (animate transform/opacity; for thread height use `grid-template-rows`). **One deliberate exception:** the Android Material 3 Expressive *chrome* uses authentic spring overshoot (`--m3-spatial`), because flat ease-out would read as fake Material to an Android engineer. The brand content (thread, answers, CTAs) stays ease-out only; the bounce is scoped to `body[data-os="android"]` platform UI.

- **Hero:** the first question types itself into the composer, "sends", a 3-dot typing indicator appears, then the answer **streams** in token-by-token with a clay block cursor; visual modules pop in staggered.
- **Story arc:** the thread is sequenced (hook, challenge, development, setback, payoff). Each answer ends with a single "continue" button that **morphs into the question bubble** it becomes (View Transitions). A hairline progress bar fills; the paper's temperature shifts subtly per beat (cooler at the challenge, dimmer at the setback, warmer at the payoff).
- **Idle:** the online dot has a slow pulse. Restrained, not busy.
- **OS chrome:** the Live Activity wakes (spring-settle), the Dynamic Island merges via an SVG goo filter on state change and expands a detail card on the build beat; notifications cascade in staggered (ease-out, no bounce); the AI beat plays a transient Apple Intelligence edge-glow (iOS) / Circle-to-Search lasso + Gemini sheet (Android); the per-OS wallpaper and platform corner radius crossfade/morph on switch. On Android, press interactions add Expressive spring + shape-morph (see Platform chrome). The share sheet slides up / drags to dismiss.
- **Haptics:** taps fire a short Vibration-API pulse on supporting devices (Android Chrome) via `haptic()`; iOS Safari has no web vibration, so it is a no-op there by design, never a thrown error.
- `prefers-reduced-motion`: no typewriter/streaming/morph, no count-up, no goo/glow/spring/squish, no haptics; everything renders in its final state immediately (the conclusion cascade falls back to static chips; the share sheet appears without the slide). The static **refraction** is kept, since it is a still material effect, not motion.

## Imagery

No stock photography (this is a tech/personal brand, not a place/food brief). The "imagery" is the rendered app UI itself plus his profile photo (mirrored to face into the card), the animated numerics, and an SVG favicon. Typography and the live interaction carry the visual weight.

## Bans honored

OKLCH (no pure black/white) · no gradient text · no `background-clip:text` · no side-stripe borders · glass **only** as purposeful, refractive Liquid Glass for iOS platform chrome (a real material with a lens + dual edge-light, not decorative frost), never elsewhere · no glow halos (except the transient, literal Apple Intelligence edge-glow) · no hero-metric template · no identical card grid · no em dashes in copy · mono only where literally true (code modules; the clock is system sans), never as "developer" costume.

## Platform chrome (OS-feature layer)

The device behaves like a real OS, skinned by `body[data-os="ios" | "android"]`. The skin touches *only* the chrome (status bar, Live Activity, notifications, composer, gesture nav, wallpaper); the chat content keeps the brand type and clay-red accent. Reference: iOS 26 **Liquid Glass** vs Android **Material 3 Expressive**.

- **iOS, Liquid Glass.** A real glass *material*, built in two tiers so it is correct on every engine and refractive where it can be.
  - **Base (all browsers, incl. iOS Safari):** translucent warm-neutral fill (hue ~80, not the old arbitrary blue), `backdrop-filter: blur() var(--glass-fx)` where `--glass-fx` is `saturate(1.8) brightness(1.07) contrast(1.04)` (glass *lightens and crisps* the backdrop, not only blurs it), a diagonal specular sheen, a bright top inner edge plus a faint lower inner edge (`--glass-hi` / `--glass-edge-lo`), and a soft shadow. Both `-webkit-` and standard `backdrop-filter` are set. An `@supports not (backdrop-filter)` fallback raises fill opacity so text stays legible on old engines.
  - **Refraction (geometry-aware, `glass.js`):** instead of one static map, `glass.js` builds a **displacement map per surface from its real rounded-rectangle geometry** — a rounded-rect signed-distance field whose bend is flat in the centre and ramps up steeply at the rim (`f = 1 - sqrt(1 - t²)`), so it reads as a true convex lens rather than the old uniform shift (the approach in Aave's *Building Glass for the Web*). The map encodes the outward edge-normal into R/G with a faint red-vs-green chromatic split, is padded with a neutral margin (so the Safari/Firefox element-`filter` path can't clip drop shadows), computed over one quadrant and mirrored (four-fold symmetry), and **cached by size** so a row of equal chips shares one filter. Each surface gets its own injected `<filter id="lq-glass-N">` and a `--lq` custom property pointing at it; maps are immutable per id (no stale-cache problem). Maps regenerate on resize / orientation change and when the iOS skin (re)appears.
  - **Where it applies (capability-detected, no UA sniff):** only Chromium supports an SVG filter inside `backdrop-filter`, which is the one way to bend the **live backdrop**, so `--lq` is routed there (`html.refract`) — the real deal. Safari/Firefox can't reference an SVG filter from `backdrop-filter` (and routing it through element `filter` makes Safari drop the backdrop blur, washing the glass out), so they keep the blurred **frosted base**. If `glass.js` never runs, `var(--lq, none)` collapses to `none` and every surface keeps that frosted base too. The refraction never breaks any engine.
  - Applied to the composer (on a `::before` layer, so the composer itself stays filter-free and doesn't trap the fixed selector), notifications, chips, and the share sheet. Dynamic Island stays opaque near-black; its expanded card is dark liquid glass. Larger device corner radius (~3rem). Home-bar gesture indicator.
- **Android, Material 3 Expressive.** Opaque tonal surfaces, larger/pill shapes, a hair of elevation. The Material You tonal palette (`--m3-primary`, `--m3-primary-container`, `--m3-surface-container`, ...) is **seeded from the clay-red** (hue ~33) so dynamic color stays on-brand. Promoted Live Update status chip, progress notification card, heads-up notifications with round icons, Quick Share sheet. Tighter device corner radius (~2rem). Wider/shorter handle gesture indicator.
  - **Expressive motion + shape (the M3 2025 signatures).** Spring motion is encoded as CSS `linear()` easings (`--m3-spatial` overshoots like a spatial spring; `--m3-effects` settles flat). Chips, the continue button, and contact tiles **morph shape on press** (corner radius eases from round toward squarer) and squish (`scale`), then spring back on release. The OS switch is a **connected button group**: pressing one segment swells it (`is-pressing`) while its neighbour squishes (`is-squished`), set by `js/os.js`. The springy thumb uses `--m3-spatial`. These bounce only under the Android skin; the brand content keeps ease-out.
- **Live Activity spine.** One persistent activity tracks the broader story path (`.liveact`): compact in the status bar, expandable, progress as a ring (iOS) / bar (Android). Per-beat states live in `data.js` (`activity: {state, label, progress}`). It should read as "work in motion" or "clear path", not as one specific workstream.
- **Per-beat features** (`feature` in `data.js`): `ai` (Apple Intelligence edge-glow / Circle-to-Search + Gemini), `focus` (Do Not Disturb dim + silenced notification), `cascade` (the marquee, a staggered stack of notifications crediting other people), `poster` (Contact Poster / Quick Share, which now **raises a real share sheet**, see below). Transient AI-feature colors are the only non-clay moments and resolve back to brand surfaces.
- **Share sheet** (`.sheet`, contact beat). The Contact Poster / Quick Share is a working bottom sheet, not a static card: it slides up over the phone, supports **drag-to-dismiss**, is a focus-managed `role="dialog"` with Escape/scrim close, and its primary action calls the **Web Share API** (`navigator.share`) when present, falling back to copy-link (Clipboard API), `mailto:`, and LinkedIn targets. It is confined to the `.device` on desktop and fixed to the viewport on mobile, skinned per-OS (Liquid Glass sheet vs Quick Share). The poster doubles as the trigger.
- **Per-OS wallpaper** (`.stage-os--ios` / `.stage-os--android`): two fixed gradient layers behind the phone that crossfade by opacity on switch (cool blue/lavender for iOS, warm clay/peach for Android). Visible on desktop around the floating phone; under the full-bleed device on mobile.
- **Selector** (`.os-switch`): auto-detected (UA), persisted (`localStorage["ask-os"]`). Equal-width segmented buttons so the thumb aligns. Inside the composer on mobile; `position: fixed` on the right stage at ≥1080px.
- **Accessibility:** every component rests in a complete, visible state under `prefers-reduced-motion`; the gesture indicators and status glyphs are `aria-hidden`; the selector is keyboard-focusable with `aria-pressed`.
