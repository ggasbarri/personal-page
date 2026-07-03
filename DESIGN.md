# DESIGN.md

## Theme

**Scene:** a recruiter or peer engineer opens Gianfranco's link in daylight, between meetings, on a phone or a laptop, curious and unhurried. Nothing about that forces dark; the earlier dark+glow version read as AI-generated. So this is **light**: a warm paper surface, ink text, one deep accent. The mood is editorial and human, like a well-set printed page, not a glowing app.

## Color

**Strategy:** Two-tier — fixed warm neutrals for the paper identity, one seed-derived accent family for everything interactive.

**Fixed tokens (never re-seed):** warm paper neutrals carry the identity and guarantee contrast regardless of hue.

```
--stage:        oklch(0.915 0.014 83)  /* warm ecru page behind the app */
--surface:      oklch(0.975 0.006 86)  /* app screen, warm white */
--surface-2:    oklch(0.948 0.011 80)  /* raised: incoming bubbles, panels */
--surface-3:    oklch(0.918 0.014 78)  /* chips, inputs */
--line:         oklch(0.85 0.015 76)   /* hairline borders */

--text:         oklch(0.28 0.018 52)   /* warm charcoal ink, primary */
--text-muted:   oklch(0.46 0.020 50)   /* secondary */
--text-faint:   oklch(0.55 0.018 52)   /* metadata */

--mint:         oklch(0.58 0.135 150)  /* tiny: "online" status dot only */
```

**Seed-derived tokens (recolor via Settings theme toy):** Settings writes `--seed` on `:root`; CSS relative color syntax derives the whole accent family without JS color math. Literal fallbacks ship first so pre-supporting browsers keep clay-red.

```css
--seed: oklch(0.47 0.155 33);                   /* Settings writes this */
--accent: oklch(0.47 0.155 33);                  /* fallback */
--accent: oklch(from var(--seed) l c h);         /* supported: mirrors seed */
--accent-strong: oklch(from var(--seed) calc(l - 0.06) calc(c + 0.005) h);
--accent-ink:   oklch(0.975 0.012 80);           /* fixed: paper text on fills */
--accent-soft:  oklch(from var(--seed) l c h / 0.13);
```

Seed-recolored surfaces: `--accent*` family, entire `--m3-*` tonal palette (authentic Material You mechanic — L/C fixed, hue follows seed), Live Activity ring/bar fill, home/lock wallpaper tint, chips/CTAs/outgoing bubbles. The hue is persisted to `localStorage`.

**Per-app committed palettes** (scoped to `.app-screen[data-app=...]`) are art-directed and immune to the seed: Maps (cool blue), Ledger (green-tinted), Terminal (dark terminal green/amber), Mail/Settings (neutral). These never recolor.

**Status-bar ink tokens:** `--statusbar-ink` and `--statusbar-bg` are overridden per `body[data-app]`. Terminal, being a dark app, sets these to light values so the shared status bar (clock, glyphs, Live Activity) stays legible. JS updates `<meta name="theme-color">` on app open/close to match.

Accent budget: clay-red (default seed) carries Messages — chat bubbles, cursor, links, key numbers, send button, continue CTA. L≈0.47 clears WCAG AA on paper. Mint appears only as the live-status dot. AI transient colors (Apple Intelligence / Gemini) are the only non-seed moments and resolve back to brand surfaces.

## Typography

Reflex-reject list respected (no Inter / DM Sans / Space Grotesk / IBM Plex / Geist Sans for UI).

- **Display — Bricolage Grotesque** (700/800). Characterful grotesque for the hero name, the big "People also ask"-style section breaks, and oversize numbers. Allowed to break out past the app column at section moments.
- **UI / body — Schibsted Grotesk** (400/500/600). Friendly, slightly warm grotesque for the chat thread, answers, labels, buttons. This is the workhorse.
- **Labels — Schibsted Grotesk** (`--font-label`), lowercase, lightly tracked. The small UI labels (chapter kickers, panel keys, tile orgs, kit rows) are sans, not mono. Lowercase throughout, matching the quiet "ask gianfranco" voice. Using mono for labels was part of the AI-slop tell and was removed. Per-app genre exceptions are deliberate: Ledger's uppercase banking-row headers and Settings' platform-accurate iOS table headers.
- **Mono — Geist Mono** (400/500). Kept *only* where it is literally true: the code-module chips in the agent diagram (`auth`, `listings`, ...). Nowhere decorative. (The status-bar clock moved *off* mono onto a system-style sans, weight per platform, so it reads like a real OS clock.)

Scale: fluid `clamp()`, ≥1.25 ratio between steps. Body ~16.5px, line-length capped ~60ch inside the app column.

## Navigation model

The experience is an OS, not a single view. Three layers stack inside `.device`:

1. **Lock screen** (`z70`) — shown once per session to fresh visitors (skipped on deep links, skip-able via button for no-JS/reduced-motion). Wallpaper mirrors the home-screen gradients; a notification stack teases unvisited apps; clock live-updates. Per-OS unlock affordance (iOS home bar / Android lock-glyph button), always a real `<button>`.
2. **Home screen** (`z10`) — app icon grid. iOS squircles vs Material circles, label casing per platform. Unvisited apps wear a badge dot that clears on first open. The Live Activity here acts as the global **discovery tracker** ("3/6 explored"), not a per-story spine.
3. **App screens** (`z30`) — each a full-screen takeover with `position:absolute; inset:0; overflow-y:auto`. Apps stay mounted after close (state restores free; `hidden` toggle). A hash router (`#m/<appid>`) handles open/close so browser Back works; `startViewTransition` runs the zoom-from-icon animation (`viewTransitionName: "app-zoom"` set on the icon + screen pair, cleared on finish; fallback: instant toggle + opacity).

The **nav indicator** (iOS home bar / Android handle) lives at device level and always navigates home. Escape key also closes the current app.

## Layout

### Device tiers

The device chrome matches the viewport; `--dev-w` is the single width source.

- **Phone** (≤739px): full-bleed phone, the original ~460px app column (`--col`).
- **Floating phone** (740–1023px): the same phone floats centered with full bezel, corner radius, and shadow on the wallpaper stage.
- **Tablet** (≥1024px): the device becomes a **landscape tablet** (up to 1100×760, clamped to never overflow; landscape aspect enforced). iOS drops the Dynamic Island for iPadOS status chrome (clock + date left, glyphs + Live Activity pill right); Android keeps the Live Update chip. Home gains iPadOS-style **widgets** (profile card, discovery-progress card), the full app grid (dock favorites duplicated, authentic iPadOS), and a centered dock. Apps switch to split-view layouts via `@container device (min-width: 700px)` queries (`container-type: inline-size` on `.device`), so phone rendering is untouched below the threshold.

A **dock** (iOS Liquid-Glass slab / Android tonal pill) holds Messages, Mail, Terminal, Settings on all tiers; on phone tiers those apps live only in the dock (iPhone-authentic), on tablet they also appear in the grid.

### Shell

- The phone column sits on the warm-paper `--stage` with a soft light bezel and shadow (a "paper-cradle"), plus a faint paper-tooth grain. No glow.
- A sticky, **per-OS status bar** at top: clock (system sans) left, the **Live Activity** center (phone) or right cluster (tablet), platform-specific signal/wifi/battery glyphs right. The collapsed discovery Live Activity is a **segmented 6-tick arc** plus an "N/6" count (no reload-arrow connotations); the expand card closes via ✕, Escape, or click-outside. In the **Messages** app, a hairline story-progress bar sits beneath the status bar; Focus mode adds a moon glyph.
- **Messages:** chat thread (streamed answers left, clay-red questions right; chips + "continue" drive navigation; no free-text input). Tablet: iPad-Messages split view — conversation sidebar + thread pane capped ~43rem.
- **Other apps** own their screens; on tablet each uses its platform's split-view idiom: Maps (full-bleed canvas + floating glass side panel), Ledger (sticky balance rail + transactions pane), Terminal (~88ch scrollback + tmux-style kv info pane), Settings (sidebar + detail pane), Mail (mailbox rail + compose sheet), Notes (notes list + reading column).
- **App icons** carry per-app committed colors (Maps blue, Ledger green, Terminal phosphor-dark, Mail sky, Notes yellow, Settings gray; Messages keeps the seed accent) — fixed, not seed-derived, so the home grid reads like a real springboard. Lock-screen notifications reuse the same glyph + color per app.
- Desktop grounds the device with one very-low-contrast vertical **wordmark** in the left gutter (rotated, never clipped), the **platform selector** (vertical segmented control, sliding thumb) in the right gutter, and a **per-OS wallpaper** that crossfades on switch. Mobile goes full-bleed.

Cards used only where they're the right affordance. No nested cards. No identical icon-title-text grid.

## Motion

Ease-out only, exponential curves (`cubic-bezier(0.16, 1, 0.3, 1)` / ease-out-expo). No bounce, no elastic. Never animate layout properties (animate transform/opacity; for thread height use `grid-template-rows`).

- **App launch / close:** icons zoom into their full-screen app via View Transitions API (`viewTransitionName: "app-zoom"` on the icon + screen pair; `startViewTransition`; name cleared on finish). Baseline support: Chrome 111+, Safari 18+, Firefox 144+. `canMorph()` check covers the rest with instant toggle + opacity fallback.
- **Lock → home:** the lock screen dismisses and home icons stagger in (`.pop` pattern, ease-out-expo, no bounce).
- **Messages — hero:** the first question types itself into the composer, "sends", a 3-dot typing indicator appears, then the answer **streams** in token-by-token with a clay block cursor; visual modules pop in staggered.
- **Messages — story arc:** the thread is sequenced (hook, challenge, development, setback, payoff). Each answer ends with a single "continue" button that **morphs into the question bubble** it becomes (View Transitions). A hairline progress bar fills; the paper's temperature shifts subtly per beat (cooler at the challenge, dimmer at the setback, warmer at the payoff).
- **Maps:** the SVG route draws itself via `stroke-dasharray` / `stroke-dashoffset`; pins pop in sequence. Reduced motion: pre-drawn.
- **Ledger:** balance count-up via `animateCount`.
- **Terminal:** text autotypes via `typeInto`; blinking block cursor.
- **Idle:** the online dot has a slow pulse. Restrained, not busy.
- **OS chrome:** the Live Activity wakes (spring-settle), the Dynamic Island merges via an SVG goo filter on state change; notifications cascade in staggered (ease-out, no bounce); the AI beat plays a transient Apple Intelligence edge-glow (iOS) / Circle-to-Search lasso + Gemini sheet (Android); the per-OS wallpaper crossfades on switch.
- `prefers-reduced-motion`: no typewriter/streaming/morph/route-draw/VT zoom, no count-up, no goo/glow/spring; everything renders in its final state immediately (the conclusion cascade falls back to static chips; the Maps route is pre-drawn).

## Imagery

No stock photography (this is a tech/personal brand, not a place/food brief). The "imagery" is the rendered app UI itself plus his profile photo (mirrored to face into the card), the animated numerics, and an SVG favicon. Typography and the live interaction carry the visual weight.

## Bans honored

OKLCH (no pure black/white) · no gradient text · no `background-clip:text` · no side-stripe borders · glassmorphism **only** as purposeful Liquid Glass for iOS platform chrome, never decorative elsewhere · no glow halos (except the transient, literal Apple Intelligence edge-glow) · no hero-metric template · no identical card grid · no em dashes in copy · mono only where literally true (code modules; the clock is system sans), never as "developer" costume.

## Platform chrome (OS-feature layer)

The device behaves like a real OS, skinned by `body[data-os="ios" | "android"]`. The skin touches *only* the chrome (status bar, Live Activity, notifications, composer, gesture nav, wallpaper); the chat content keeps the brand type and clay-red accent. Reference: iOS 26 **Liquid Glass** vs Android **Material 3 Expressive**.

- **iOS, Liquid Glass.** Translucent frosted surfaces: `backdrop-filter: blur(~22px) saturate(1.8)`, a low-opacity fill, a bright semi-transparent top edge (specular highlight via `inset 0 1px 0`), soft shadow. Applied to the composer (on a `::before` layer, so the composer itself stays filter-free and doesn't trap the fixed selector), notifications, and chips. Dynamic Island stays opaque near-black; its expanded card is dark liquid glass. Larger device corner radius (~3rem). Home-bar gesture indicator.
- **Android, Material 3 Expressive.** Opaque tonal surfaces, larger/pill shapes, a hair of elevation. The Material You tonal palette (`--m3-primary`, `--m3-primary-container`, `--m3-surface-container`, ...) is **seeded from the clay-red** (hue ~33) so dynamic color stays on-brand. Promoted Live Update status chip, progress notification card, heads-up notifications with round icons, Quick Share sheet. Tighter device corner radius (~2rem). Wider/shorter handle gesture indicator.
- **Live Activity spine.** Outside Messages the LA is the **discovery tracker**: ring/bar fills as apps are visited ("3/6 explored"); expand card shows a per-app checklist. Inside Messages the LA reverts to the story-beat spine (per-beat `activity` state from `data.js`), then restores to discovery on close. It should read as "work in motion" or "clear path", not as one specific workstream.
- **Per-beat features** (`feature` in `data.js`): `ai` (Apple Intelligence edge-glow / Circle-to-Search + Gemini), `focus` (Do Not Disturb dim + silenced notification), `cascade` (the marquee, a staggered stack of notifications crediting other people), `poster` (Contact Poster / Quick Share). Transient AI-feature colors are the only non-clay moments and resolve back to brand surfaces.
- **Per-OS wallpaper** (`.stage-os--ios` / `.stage-os--android`): two fixed gradient layers behind the phone that crossfade by opacity on switch (cool blue/lavender for iOS, warm clay/peach for Android). The wallpaper tint is also derived from `--seed` so it shifts with the theme toy.
- **Selector** (`.os-switch`): auto-detected (UA), persisted in `localStorage` (`gg-os-v1`). Equal-width segmented buttons so the thumb aligns. On mobile lives in Settings (relocated from the composer); `position: fixed` on the right stage at ≥1080px.
- **Status-bar ink adaptation.** `--statusbar-ink` and `--statusbar-bg` tokens are overridden per `body[data-app]`. Dark apps (Terminal) set these to light values; JS updates `<meta name="theme-color">` on app open/close.
- **Accessibility:** every component rests in a complete, visible state under `prefers-reduced-motion`; the gesture indicators and status glyphs are `aria-hidden`; the selector is keyboard-focusable with `aria-pressed`; the lock screen always exposes a real `<button>` unlock affordance.
