# Ask Gianfranco

The personal page of **Gianfranco Gasbarri**: a short first-person chat about mobile systems, cross-team architecture, tooling, economics, and the kind of work he likes most. The page is a working phone that **behaves like a real OS** (an iOS / Android selector reskins it), and each story beat demonstrates a native mobile feature of the chosen platform.

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
| `index.html` | Markup + the no-JS fallback content (the bio and facts are real HTML, readable without scripts). |
| `css/base.css` | Design tokens (`:root`, OKLCH), stage/wallpaper/mood, the chat thread and story components, composer + chip layout, global reduced-motion. |
| `css/device.css` | The simulated phone: device frame, status bar, Live Activity structure, OS switch, notification/poster/share-sheet structure — and the **display modes**: `fullbleed` (real phones: no fake clock/battery/home-bar, slim header with the Live Activity) vs `framed` (desktop mockup ≥1080px with the full simulated status bar). |
| `css/ios.css` | iOS skin: Liquid Glass tokens + surfaces (frosted base with CSS edge-lensing everywhere; real refraction on Chromium via `html.refract`), Dynamic Island, Apple Intelligence, iOS share sheet. |
| `css/android.css` | Android skin: Material 3 Expressive tokens + springs, Live Update chip, Gemini/Circle-to-Search, Quick Share poster, Android share sheet. |
| `data.js` | All content: the bio, the suggested prompts, and each answer (authored HTML). **Edit here to change what the page says.** Per-beat OS features (`activity`, `feature`, `notes`) live here too. |
| `js/util.js` | Shared helpers (`AskUtil`): DOM builders, `escapeHtml`, reduced-motion flag, inline SVG icons. |
| `js/os.js` | The OS layer (`AskOS`): platform selector + persistence, haptics, the simulated clock, the framed/fullbleed display mode (`html[data-display]`), and theme-color sync. |
| `js/live-activity.js` | The Live Activity spine (`AskLA`): compact states and the expanded card that grows out of the pill. |
| `js/sheet.js` | The share sheet (`AskShareSheet`): Web Share API first, drag-to-dismiss, per-OS layouts. |
| `js/features.js` | Per-beat native features (`AskFeatures`): Focus, notification cascade, AI moments, contact poster. |
| `js/app.js` | The chat/story orchestrator: streaming answers, suggested-prompt navigation, count-ups, scroll reveals, per-beat dispatch. |
| `js/glass.js` | Liquid Glass refraction engine (`LiquidGlass`): geometry-aware displacement filters, Chromium-only refraction tier. |
| `favicon.svg` | Initials mark. |
| `PRODUCT.md` / `DESIGN.md` | The brief and the design rationale (for the `impeccable` workflow). |

## Editing content

Open `data.js`. The thread is a sequenced story (`ASK_DATA.story` lists the beat order). Each prompt is one object:

```js
{
  id: "motors",                // unique; also the answer's anchor id
  chip: "Where does it show up?",           // label on the suggestion chip
  question: "where does that show up now?", // the visitor's bubble when asked
  kicker: "OLX Motors",        // chapter label shown atop the answer
  mood: "build",               // shifts the page's temperature for this beat
  next: "system",              // the next story beat
  hook: "And beyond that?",     // cliffhanger on the continue button
  html: `…authored answer markup…`,         // streamed in; elements with
                                            // class="pop" reveal staggered

  // OS-feature layer (optional per beat) — see PRODUCT.md / DESIGN.md:
  activity: { kind: "work", state: "planning",
              label: "teams aligning", progress: 0.4, expand: true },
  feature: "cascade",   // ai | focus | cascade | poster — the native feature this beat fires
  notes: [ /* notifications for the conclusion cascade */ ],
  silenced: { /* the one muted notification for the setback/focus beat */ }
}
```

Beats flagged `extra: true` (toolkit, timeline) sit off the story rail as ask-anything extras. The opening bio lives in `index.html` (`#hero-answer`) so it renders even with JavaScript disabled. **Navigation is chips + the per-answer "continue" button; there is no free-text input** (the opening question types itself into the outgoing bubble).

## OS-feature layer

The phone behaves like a real OS, selectable between **iOS** and **Android** (auto-detected, remembered in `localStorage`; on desktop the selector sits on the stage beside the phone). On desktop the page is a **framed** phone mockup that draws its own simulated status bar; on real phones and narrow windows it runs **fullbleed** and the simulated chrome stays hidden — the real device already has a clock and battery — leaving a slim header with just the Live Activity and the story progress. A persistent **Live Activity** (iOS Dynamic Island / Android promoted Live Update status chip) tracks the broader story path, and each beat fires a native feature: Apple Intelligence / Circle-to-Search (`ai`), Focus / Do Not Disturb (`focus`), a notification cascade of outcomes (`cascade`, the marquee), and a Contact Poster / Quick Share sheet (`poster`). Chrome only: the chat content keeps the brand. Android's Material You palette is seeded from the clay-red. Full `prefers-reduced-motion` fallbacks. **Fidelity matters** (the audience is mobile engineers): match the *actual* current OS, see PRODUCT.md / DESIGN.md.

## Deploy

Any static host. Two easy paths:

- **GitHub Pages:** push to GitHub, then Settings → Pages → deploy from `main` / root. Add a `CNAME` file with `ggasbarri.com` if pointing the custom domain.
- **Vercel / Netlify:** import the repo, framework preset "Other", no build command, output directory `.`.

## Accessibility

The bio and quick facts are real text in `index.html`, so the page is meaningful without JavaScript. `prefers-reduced-motion` disables the typewriter, streaming, and count-ups and renders everything immediately.
