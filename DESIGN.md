# DESIGN.md

## Theme

**Scene:** a recruiter or peer engineer opens Gianfranco's link in daylight, between meetings, on a phone or a laptop, curious and unhurried. Nothing about that forces dark; the earlier dark+glow version read as AI-generated. So the reading surfaces stay **light**: warm paper, ink text, one deep accent. The striking layer moved to the **wallpaper** — the lock and home screens sit on a deep clay-to-apricot gradient field with one warm-magenta bloom, so the first impression is color and type, and every app opens back onto calm paper.

## Color

**Strategy:** Committed. Warm paper neutrals carry the reading surfaces; one deep **clay-red** is the single content accent. The wallpaper extends the same clay family into a saturated field (this is where the 2026 "dopamine" energy lives — one magenta blob, used once). Four harmonized tints exist *only* on app-icon tiles. OKLCH throughout, never `#000`/`#fff`. No glow halos.

```
--stage:        oklch(0.915 0.014 83)  /* warm ecru page behind the mockup */
--surface:      oklch(0.975 0.006 86)  /* app screens, warm white */
--surface-2:    oklch(0.948 0.011 80)  /* raised panels, cards */
--surface-3:    oklch(0.918 0.014 78)  /* chips, inputs */
--line:         oklch(0.85 0.015 76)   /* hairline borders */

--text:         oklch(0.28 0.018 52)   /* warm charcoal ink, primary */
--text-muted:   oklch(0.46 0.020 50)   /* secondary */
--text-faint:   oklch(0.60 0.018 52)   /* metadata */

--accent:       oklch(0.47 0.155 33)   /* deep clay red, AA on paper */
--accent-strong:oklch(0.41 0.160 32)   /* pressed / emphasis */
--accent-ink:   oklch(0.975 0.012 80)  /* paper text on accent/wallpaper */
--mint:         oklch(0.58 0.135 150)  /* tiny: "online" status dot only */

/* wallpaper field (lock + home) */
--wall-deep:    oklch(0.40 0.125 32)
--wall-mid:     oklch(0.50 0.145 38)
--wall-apricot: oklch(0.76 0.115 60)
--wall-magenta: oklch(0.58 0.165 350)  /* one blob, lower-left, the only pop */

/* icon tints (tiles only) */
clay · apricot · moss oklch(0.52 0.095 140) · dusty blue oklch(0.52 0.07 250)
· magenta (Off-code only) · neutral (Settings) · ink (Terminal)
```

Accent budget: clay-red carries the brand (kickers, links, key numbers, toggles, the agent pill). It is kept at L≈0.47 so even small text clears WCAG AA on paper. Mint appears only as the live-status dot. Over the wallpaper, text is always `--accent-ink` (paper, not white).

## Typography

Reflex-reject list respected (no Inter / DM Sans / Space Grotesk / IBM Plex / Geist Sans for UI).

- **Display — Bricolage Grotesque** (700/800). The lock-screen name (kinetic, display scale, allowed to kiss the viewport edge), the giant lock clock, the oversized app titles, widget values. Exaggerated hierarchy is the type story: display-huge vs tiny lowercase labels, almost nothing in between.
- **UI / body — Schibsted Grotesk** (400/500/600). App content, icon labels, settings rows, buttons. The workhorse.
- **Labels — Schibsted Grotesk** (`--font-label`), lowercase, lightly tracked. Kickers, widget keys, panel keys, the status-bar "gianos" brand. Sans, not mono — mono labels were part of the AI-slop tell and stay banned.
- **Mono — Geist Mono** (400/500). *Only* where literally true: the Terminal app and the code-module chips in the agent diagram. Nowhere decorative.

Scale: fluid `clamp()`. Lock name `clamp(2.7rem, 14.5vw, 4.1rem)`; app titles `clamp(2.7rem, 13vw, 3.6rem)`; body ~16.5px; line-length capped ~60ch inside apps.

## Layout

- The page is a **device**: a fixed-height screen stack (`html[data-screen]` = lock | home | app), each screen scrolling internally like a real phone. On desktop ≥1080px it floats as a **framed** mockup on the warm-paper stage (paper-cradle bezel + long warm shadow) with a simulated GianOS status bar and a home-handle button; below that it runs **fullbleed** with no fake chrome (the real device draws its own clock and battery). `js/system.js` mirrors the media query onto `html[data-display]`.
- **Lock:** clock + date up top, the kinetic name and one bio line in the middle band, unlock hint + handle at the bottom.
- **Home:** two glass widgets (dark-tinted blur over the wallpaper), a 4-column icon grid, and a label-free dock pinned at the bottom.
- **Apps:** compact bar (back chevron, tile glyph, name that fades in on scroll) over a scroll area that opens with the oversized title. Content blocks max-width ~56–60ch.
- Desktop grounds the mockup with the oversize low-contrast **wordmark** off the left gutter (pointer-kinetic: a few px of shear) and a vertical "gianos 1.0" tag on the right.

Cards only where they're the right affordance (profile panel, work tile, settings groups, outcome notes). No nested cards. No identical icon-title-text grid *in content* (the home grid is an OS idiom, not a content layout).

## Motion

Two registers, deliberately split:

- **Reading content: ease-out only** (`--ease`, `cubic-bezier(0.16, 1, 0.3, 1)`). Scroll reveals, fades, the collapsing title.
- **OS chrome: spring** (`--spring`, a `linear()` overshoot). Icon press squish, the unlock settle, toast pops, toggle thumbs, share-target presses. This supersedes the old "bounce scoped to the Android skin" rule: the spring is now GianOS's own tactile language, still never applied to prose.

Every duration multiplies `--ms` (`calc(0.45s * var(--ms))`), which is how the Animator-duration-scale developer option slows the whole OS for real. Never animate layout properties (transform/opacity only).

- **Lock entrance:** per-letter clip-rise on the name (staggered ~28ms), clock/date/hint fade in sequence; the handle nudges upward on a slow loop.
- **Unlock:** the lock screen follows the drag, then slides up and fades while home scales 0.93→1.
- **App open/close:** `document.startViewTransition` with a shared element — the icon tile morphs into the app-bar glyph while the app screen rises and settles; reversed on close. Firefox/Safari and reduced motion get a clean instant swap.
- **In-app:** oversized title shrinks via CSS scroll-driven animation (`animation-timeline: scroll()` under `@supports`); content blocks reveal through an IntersectionObserver with a small stagger.
- **Wallpaper:** two layers parallax at different rates with the pointer. Transform only.
- **Haptics:** taps fire a short Vibration-API pulse wherever the browser supports it via `haptic()`; iOS Safari has no web vibration, so it is a no-op there by design, never a thrown error.
- `prefers-reduced-motion`: no kinetic entrance, no parallax, no springs, no morphs, no haptics, no FPS-meter motion; the lock renders fully composed with the unlock button visible; everything else appears in its final state immediately.

## Imagery

No stock photography. The "imagery" is the rendered OS itself plus his profile photo (mirrored to face into the card), the wallpaper field, and an SVG favicon. Typography and the live interaction carry the visual weight.

## Bans honored

OKLCH (no pure black/white) · no gradient text · no `background-clip:text` · no side-stripe borders · blur only as purposeful surface material (widgets/dock over the wallpaper, the translucent app bar), never decorative frost · no glow halos · no hero-metric template · no identical card grid in content · no em dashes in copy · mono only where literally true (the terminal, code-module chips), never as "developer" costume.

## Developer mode (the easter egg)

Authenticity is the joke's engine, so the mechanics are Android's, verbatim: seven taps on Settings → Build number, silent for two, counting down in toasts from four ("You are now N steps away from being a developer."), then "You are now a developer!", persisted, with "No need, you are already a developer." on re-taps.

- **Show layout bounds** — cyan outlines on every box inside the device (the classic).
- **Profile frame rate** — a tiny mono FPS pill, green, amber under 50.
- **Animator duration scale** — cycles 1× → 5× → 10× → 0.5×; sets `--ms` on `:root`. The 10× icon-to-app morph is the payoff.
- **Terminal** — pops onto the grid with a spring. Geist Mono, `gian@gianos:~$`, escaped-text output, `aria-live="polite"`. `cat README` explains the build factually (View Transitions, Web Share, no build step, Cloudflare Pages); `neofetch` does the obligatory ASCII; `open contact` actually navigates.

One more layer for the devtools crowd: a single console line pointing at Settings.
