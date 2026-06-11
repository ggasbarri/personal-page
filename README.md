# GianOS

The personal page of **Gianfranco Gasbarri**, presented as a small fictional mobile OS. The page boots to a **lock screen** (real clock, kinetic display type), unlocks to a **home screen** of apps and widgets, and each app opens full-screen with a shared-element morph (View Transitions). The browser back button / Android back gesture genuinely closes an app, the share sheet is the real Web Share API, and haptics are the real Vibration API.

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

| File | Purpose |
|------|---------|
| `index.html` | Shell markup (status bar, wallpaper, the three screens) + the no-JS fallback content (the bio and facts are real HTML, readable without scripts). |
| `css/base.css` | Design tokens (`:root`, OKLCH), the desktop stage, toast, fallback, global reduced-motion. |
| `css/shell.css` | The device: frame, screen stack (`html[data-screen]`), simulated status bar, home handle, View Transitions choreography, the share sheet — and the **display modes**: `fullbleed` (real phones: no fake clock/battery/handle) vs `framed` (desktop mockup ≥1080px with the full simulated chrome). |
| `css/home.css` | Lock screen (kinetic type, parallax wallpaper) + home screen (widgets, icon grid, dock, press physics). |
| `css/apps.css` | App chrome (collapsing oversized titles, scroll reveals) and the content blocks (profile panel, badges, work tile, forces, kit, timeline, outcome notes, contact CTAs, agent diagram). |
| `css/dev.css` | Settings rows + toggles, the layout-bounds overlay, FPS meter, and the Terminal app. |
| `data.js` | All content (`window.GIAN_OS`): identity, lock copy, widgets, the apps and their authored HTML, the developer-mode strings. **Edit here to change what the page says.** |
| `js/util.js` | Shared helpers (`OSUtil`): DOM builders, `escapeHtml`, reduced-motion flag, the toast, the motion-scale hook. |
| `js/system.js` | The system layer (`OSSystem`): haptics, the real clock, the current screen, the framed/fullbleed display mode (`html[data-display]`), theme-color sync. |
| `js/lock.js` | Lock screen (`OSLock`): kinetic name entrance, swipe-up + button unlock, wallpaper parallax. |
| `js/home.js` | Home screen (`OSHome`): widgets, grid, dock, haptic presses; re-renders when the Terminal unlocks. |
| `js/apps.js` | App router (`OSApps`): shared-element open/close, history/back-gesture integration, `#appid` deep links, collapsing headers, scroll reveals. |
| `js/dev.js` | Developer mode (`OSDev`): the build-number easter egg, the three dev options, the Terminal. |
| `js/sheet.js` | The share sheet (`OSShareSheet`): Web Share API first, drag-to-dismiss, copy/mail/LinkedIn fallbacks. |
| `js/boot.js` | Startup: lock vs home vs deep link, the home handle, the console nudge. |
| `favicon.svg` | Initials mark. |
| `PRODUCT.md` / `DESIGN.md` | The brief and the design rationale. |
| `DEPLOY.md` | Cloudflare Pages deployment notes. |

## Editing content

Open `data.js`. Each app is one object in `GIAN_OS.apps`:

```js
{
  id: "work",            // unique; also the deep-link hash (#work)
  name: "Work",          // icon label + app-bar name
  tint: "apricot",       // icon tile tint: clay | apricot | moss | blue | magenta | neutral | ink
  glyph: "<path …/>",    // 24×24 stroke SVG inner markup for the icon
  kicker: "what kind of work?",  // small label above the big title
  title: "Work",         // the oversized display title
  html: `…authored markup…`,     // blocks with class="reveal" animate in on scroll
  hidden: true           // (Terminal only) kept off the grid until developer mode
}
```

`GIAN_OS.dock` lists the four dock apps; everything else lands on the grid. Widgets and the lock-screen copy live in `GIAN_OS.widgets` / `GIAN_OS.lock`. The bio and facts also exist as plain HTML in `index.html` (the no-JS fallback) — keep the two in sync when editing.

## The easter egg

Settings → tap **Build number** seven times (with the authentic Android countdown toasts) to unlock **Developer options**: *Show layout bounds*, *Profile frame rate*, and *Animator duration scale* (every motion duration routes through `--ms`, so 10× slow-mo morphs actually work). It also adds a **Terminal** app (`gian@gianos:~$`) with working commands — `help`, `whoami`, `neofetch`, `cat README`, `open <app>`. State persists in `localStorage["gianos-dev"]`.

## Deploy

Cloudflare Pages, Git integration: push to `main` and it ships. See [DEPLOY.md](DEPLOY.md).

## Accessibility

The bio and quick facts are real text in `index.html`, so the page is meaningful without JavaScript. Every interactive element is a real `<button>`; the unlock works by keyboard; Escape closes apps and the sheet; focus returns to the opening icon when an app closes; toasts are `role="status"` and the terminal output is `aria-live="polite"`. `prefers-reduced-motion` removes the kinetic entrance, parallax, springs, morphs, and haptics — everything renders in its final state immediately.
