# Ask Gianfranco

The personal page of **Gianfranco Gasbarri**, Senior Mobile Engineer (OLX Group · Motors), framed as a personal AI app: ask a question, an answer streams back, suggested prompts walk you through his work.

A hand-authored static site. No build step, no dependencies, no framework.

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
| `styles.css` | The whole design system. OKLCH colors, fluid type, motion. Tokens live in `:root`. |
| `data.js` | All content: the bio, the suggested prompts, and each answer (authored HTML). **Edit here to change what the page says.** |
| `main.js` | The interaction: streaming answers, suggested-prompt navigation, count-ups, scroll reveals. |
| `favicon.svg` | Initials mark. |
| `PRODUCT.md` / `DESIGN.md` | The brief and the design rationale (for the `impeccable` workflow). |

## Editing content

Open `data.js`. Each suggested prompt is one object:

```js
{
  id: "build",                       // unique, also used as the anchor id
  chip: "What does he actually build?",  // text on the suggestion chip
  question: "what does he actually build?", // the user bubble when asked
  html: `…authored answer markup…`   // streamed into the thread
}
```

The opening bio lives in `index.html` (`#hero-answer`) so it renders even with JavaScript disabled.

## Deploy

Any static host. Two easy paths:

- **GitHub Pages:** push to GitHub, then Settings → Pages → deploy from `main` / root. Add a `CNAME` file with `ggasbarri.com` if pointing the custom domain.
- **Vercel / Netlify:** import the repo, framework preset "Other", no build command, output directory `.`.

## Accessibility

The bio and quick facts are real text in `index.html`, so the page is meaningful without JavaScript. `prefers-reduced-motion` disables the typewriter, streaming, and count-ups and renders everything immediately.
