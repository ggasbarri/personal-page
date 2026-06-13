# GianOS

The personal page of **Gianfranco Gasbarri**, built as a fake phone OS you can actually explore. Boot → lock screen → home screen grid → launchable full-screen apps, each covering a different slice of who he is. The OS is skinned iOS or Android (auto-detected, switchable), and each app has its own committed palette and personality.

A hand-authored static site. No build step, no dependencies, no framework.

> **Before editing any copy, read the Positioning rules in [PRODUCT.md](PRODUCT.md):** accuracy over impressiveness (no overstating specific work examples), no job title and never the word "Staff" on the page, staff-level implied only through scope, and keep text short.

## Run locally

It's plain HTML/CSS/JS, so any static server works:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly works too, but a server is closer to production.

## Structure

| File / folder | Purpose |
|---------------|---------|
| `index.html` | All static markup: stage, device shell, lock screen, home grid, app screen shells, no-JS fallback (Messages content readable without JS). |
| `data.js` | All content: `ASK_DATA` (the Messages chat story — bio, prompts, answers, per-beat OS features) + `APP_DATA` (lock-screen notifications, Maps stops, Ledger transactions, Terminal commands, Notes content). **Edit here to change what the page says.** |
| `js/os.js` | The OS brain — `GG` namespace: `Util`, `Platform` (iOS/Android detection + switch), `Theme` (seed/hue), `LA` (Live Activity), `Collection` (visited-apps state, badge clearing, reward), `Apps` (registry), `Shell` (boot, lock, home, hash router, View Transition zoom). |
| `js/apps/messages.js` | The chat story: streaming engine, suggestion chips, per-beat features (ai/focus/cascade/poster), mood overlays. |
| `js/apps/maps.js` | Venezuela→Portugal journey as an SVG route that draws itself. |
| `js/apps/ledger.js` | Economics degree framed as a banking app (courses as transactions). |
| `js/apps/terminal.js` | Work and stack as a fake interactive shell. |
| `js/apps/settings.js` | Theme toy (hue slider + swatches), iOS/Android switch, About pane. |
| `js/apps/mail.js` | Pre-drafted mailto composer. |
| `js/apps/notes.js` | Hidden completion reward — unlocks onto the grid after all 6 apps are visited. |
| `styles/base.css` | Design tokens (seed-derived accent family + fixed warm neutrals), stage, device, status bar, Live Activity, reduced-motion. |
| `styles/shell.css` | Lock screen, home grid, app-screen chrome, badges, navind. |
| `styles/apps/*.css` | Per-app committed palettes + UI (messages, maps, ledger, terminal, settings, mail, notes). |
| `favicon.svg` | Initials mark. |
| `PRODUCT.md` / `DESIGN.md` | The brief and the design rationale (for the `impeccable` workflow). |

## Editing content

Open `data.js`. It has two sections:

**`ASK_DATA`** — the Messages chat story. `ASK_DATA.story` lists the beat order; each beat is one object:

```js
{
  id: "motors",
  chip: "Where does it show up?",
  question: "where does that show up now?",
  kicker: "OLX Motors",
  mood: "build",
  next: "system",
  hook: "And beyond that?",
  html: `…authored answer markup…`,   // streamed in; .pop elements reveal staggered

  // OS-feature layer (optional per beat):
  activity: { kind: "work", state: "planning", label: "teams aligning", progress: 0.4, expand: true },
  feature: "cascade",   // ai | focus | cascade | poster
  notes: [ /* notifications for the conclusion cascade */ ],
  silenced: { /* muted notification for the focus beat */ }
}
```

**`APP_DATA`** — content for every other app: lock-screen notification teasers, Maps stops (x/y coords + card copy), Ledger transactions, Terminal commands, Notes content. Edit here to change what those apps say.

The opening bio lives in `index.html` (inside the Messages app shell) and renders even without JavaScript. Navigation is chips + the per-beat "continue" button; there is no free-text input.

## How it works

**Boot → lock → home → app.** On a fresh session, visitors see the lock screen (wallpaper, big clock, notification teasers from unvisited apps). Unlock reveals the home screen grid. Tapping an icon zoom-transitions into that full-screen app (View Transition API; falls back to instant toggle). The nav indicator at the bottom always goes home; browser Back also closes the current app.

**Collection meta-game.** Each app carries a badge that clears on first open. The Live Activity in the status bar repurposes as a global discovery tracker ("3/6 explored") with an expand card checklist. Opening all 6 apps triggers a reward: the hidden Notes icon wakes onto the grid. State lives in `localStorage` (`gg-os-v1`).

**Theme toy.** Settings has a hue slider and preset swatches that write `--seed` on `:root`, re-deriving the entire accent family (outgoing bubbles, CTAs, Live Activity ring/bar, Material You tonal palette) via CSS relative color syntax. Warm neutrals and per-app palettes are fixed and immune to the seed. The hue persists across reloads.

**iOS / Android duality.** `body[data-os]` drives squircle vs circle icons, status-bar glyphs, iOS Liquid Glass vs Material 3 Expressive surfaces, corner radii, gesture-nav indicators. The selector is auto-detected, switchable, persisted. See DESIGN.md for the full platform spec.

## Deploy

Any static host (currently Cloudflare Pages). Two other easy paths:

- **GitHub Pages:** push to GitHub, then Settings → Pages → deploy from `main` / root. Add a `CNAME` file with `ggasbarri.com` if pointing the custom domain.
- **Vercel / Netlify:** import the repo, framework preset "Other", no build command, output directory `.`.

## Accessibility

The Messages content (bio, story) is real HTML in `index.html` and renders without JavaScript. `prefers-reduced-motion` disables the typewriter, streaming, SVG route draw, View Transition zoom, and count-ups — everything renders in its final state immediately. The lock screen always exposes a real unlock button (never gesture-only). The hash router (`#m/<appid>`) allows deep-linking directly into any app, skipping the lock screen.
