# Ask Gianfranco

The personal page of **Gianfranco Gasbarri** — mobile engineering, cross-team architecture, and AI-augmented engineering at OLX Motors — framed as a personal AI app: ask a question, an answer streams back, and a guided story walks you through his work. The page is a working phone that **behaves like a real OS** (an iOS / Android selector reskins it), and each story beat demonstrates a native mobile feature of the chosen platform.

A hand-authored static site. No build step, no dependencies, no framework.

> **Before editing any copy, read the Positioning rules in [PRODUCT.md](PRODUCT.md):** accuracy over impressiveness (no overstating; he collaborates on and aligns the Flutter migration, he does not own it), no job title and never the word "Staff" on the page, staff-level implied only through scope, and keep text short.

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
| `styles.css` | The whole design system. OKLCH colors, fluid type, motion. Tokens live in `:root`. Per-OS chrome (iOS Liquid Glass / Android Material 3 Expressive) under `body[data-os]`. |
| `data.js` | All content: the bio, the suggested prompts, and each answer (authored HTML). **Edit here to change what the page says.** Per-beat OS features (`activity`, `feature`, `notes`) live here too. |
| `main.js` | The interaction: streaming answers, suggested-prompt navigation, count-ups, scroll reveals. Plus the **OS layer**: platform selector (`OS`), the Live Activity spine (`LA`), notifications, and per-beat native features. |
| `favicon.svg` | Initials mark. |
| `PRODUCT.md` / `DESIGN.md` | The brief and the design rationale (for the `impeccable` workflow). |

## Editing content

Open `data.js`. The thread is a sequenced story (`ASK_DATA.story` lists the beat order). Each prompt is one object:

```js
{
  id: "build",                 // unique; also the answer's anchor id
  chip: "What does he work on?",            // label on the suggestion chip
  question: "so what does he do about it?", // the visitor's bubble when asked
  kicker: "development",       // chapter label shown atop the answer
  mood: "build",               // shifts the page's temperature for this beat
  next: "ai",                  // the next story beat
  hook: "The bigger shift: how they build", // cliffhanger on the continue button
  html: `…authored answer markup…`,         // streamed in; elements with
                                            // class="pop" reveal staggered

  // OS-feature layer (optional per beat) — see PRODUCT.md / DESIGN.md:
  activity: { kind: "migration", state: "planning",
              label: "execution plan aligned", progress: 0.4, expand: true },
  feature: "cascade",   // ai | focus | cascade | poster — the native feature this beat fires
  notes: [ /* notifications for the conclusion cascade */ ],
  silenced: { /* the one muted notification for the setback/focus beat */ }
}
```

Beats flagged `extra: true` (toolkit, timeline) sit off the story rail as ask-anything extras. The opening bio lives in `index.html` (`#hero-answer`) so it renders even with JavaScript disabled. **Navigation is chips + the per-answer "continue" button; there is no free-text input** (the opening question types itself into the outgoing bubble).

## OS-feature layer

The phone behaves like a real OS, selectable between **iOS** and **Android** (auto-detected, remembered in `localStorage`; on desktop the selector sits on the stage beside the phone). A persistent **Live Activity** (iOS Dynamic Island / Android promoted Live Update status chip) tracks the Flutter migration through the whole story, and each beat fires a native feature: Apple Intelligence / Circle-to-Search (`ai`), Focus / Do Not Disturb (`focus`), a notification cascade of others' wins (`cascade`, the marquee), and a Contact Poster / Quick Share sheet (`poster`). Chrome only: the chat content keeps the brand. Android's Material You palette is seeded from the clay-red. Full `prefers-reduced-motion` fallbacks. **Fidelity matters** (the audience is mobile engineers): match the *actual* current OS, see PRODUCT.md / DESIGN.md.

## Deploy

Any static host. Two easy paths:

- **GitHub Pages:** push to GitHub, then Settings → Pages → deploy from `main` / root. Add a `CNAME` file with `ggasbarri.com` if pointing the custom domain.
- **Vercel / Netlify:** import the repo, framework preset "Other", no build command, output directory `.`.

## Accessibility

The bio and quick facts are real text in `index.html`, so the page is meaningful without JavaScript. `prefers-reduced-motion` disables the typewriter, streaming, and count-ups and renders everything immediately.
