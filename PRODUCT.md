# PRODUCT.md

## Product

**GianOS** — the personal page of Gianfranco Gasbarri, presented as a small fictional mobile OS. A single-page showcase site framed as a phone you're handed: a lock screen with his name in kinetic display type, a home screen of apps and widgets, and full-screen apps that each tell one slice of his story (work, system thinking, tools, outcomes, the off-code texture, contact).

**Register:** brand. Design IS the product. This is a portfolio; the visitor's impression is the deliverable. The content is intentionally light (a bio, a few real work projects, a stack), so the design and interaction carry the weight.

**Signature mechanic (the hook):** the page doesn't *mimic* iOS or Android — it IS its own OS, and it behaves like a real one. Apps open with genuine shared-element morphs (View Transitions), the browser back button / Android back gesture actually closes an app, `#appid` deep links open straight into one, the share sheet is the real Web Share API, haptics are the real Vibration API. The craft argument moved from "can he recreate Apple's chrome" to "can he design and build an OS-grade interaction model" — which is the actual job of a senior mobile engineer.

**The easter egg:** Settings → tap Build number seven times — Android's own developer-mode ritual, countdown toasts included. It unlocks Developer options (layout bounds, an FPS meter, animator duration scale) and a working Terminal app. It rewards exactly the audience this page is for.

## Users

- **Recruiters, hiring managers, and engineering leaders** evaluating a senior mobile engineer. They scan fast, on a phone or a laptop, often between meetings. They should grasp seniority, scope (cross-org, not just code), and craft within seconds.
- **Peer engineers** (mobile, platform) who land here from LinkedIn or a conference and want to know "is this person legit and interesting." They reward technical specificity and a clever build — they are the ones who will find the easter egg.
- **Gianfranco himself**, who wants a surface that feels unmistakably his and that he's proud to drop in a bio link.

## Who Gianfranco is

Officially a Senior Mobile Engineer at OLX Group (Motors), based in Aveiro, Portugal (8 years across Flutter and native Android). This is internal context for writing the page; the title itself is **not** printed on the page (see Positioning rules). His work increasingly sits across a large org: he aligns engineering, product, and platform teams, makes architecture trade-offs legible, shapes reusable standards, mentors, and improves how teams work with modern coding tools. Multilingual: Spanish (native), Portuguese (fluent), English (professional). Currently studying economics; keep this as light personal texture, not a new headline.

Signature work, **stated accurately** (see Positioning rules; prefer his honest self-assessment over inflated promotion docs):
- The **Flutter migration** of the Motors apps (3M+ daily launches across Europe): he does **not** own or "lead" it. He helps several teams line up behind a Flutter direction: scope, sequencing, risks, and the tradeoffs everyone has to live with.
- **Longer-term architecture direction:** shaping fast experiments so the next version is easier to reason about and evolve.
- **Modern coding-tool adoption:** Agents.md context so coding agents understand the project map, module boundaries, and decisions they should not rediscover every prompt.
- **Reusable standards:** turning repeated platform and team decisions into patterns people can pick up without reopening the same call.
- Earlier: a **Kotlin Multiplatform** code-sharing initiative across native Android and iOS.

## Positioning rules (stated directly by Gianfranco, treat as hard constraints)

- **Accuracy over impressiveness. Never overstate, never lie, never sound arrogant.** No claim he wouldn't make to a colleague's face. He collaborates, aligns, and makes decisions over time; he does not single-handedly own big initiatives. The Flutter migration is the canonical example: he helps shape and align it, he did not decide or lead it. Sell the *collaboration, strategic thinking, and the decisions* he was able to make.
- **His own promotion / performance docs overstate and can be cringe.** They say "Staff", "led the migration", "secured executive sign-off", "10+ teams". Treat them as raw material, not truth. Prefer his honest FY26 self-assessment for facts.
- **Subtle staff-level signaling, never stated.** He is currently a Senior Mobile Engineer and wants visitors to come away feeling he *deserves staff*. So: **do not print any job title on the page**, and **never use the word "Staff"** (cringe, do not shout it). Let the scope of the work imply the level: cross-team collaboration, architecture trade-offs made legible, prioritizing initiatives by business value, force-multiplying through standards and an interview format others adopt, mentoring. Keep it subtle.
- **Short text.** He worries people won't read at all. Keep copy minimal; lead with visual elements; bold only the words that matter. "Text is for CVs"; this page sells the work visually.
- **No cringe / no slop copy.** Cut marketing filler and self-congratulation (e.g., a "built by hand, not by a template" footer, or an on-the-nose "Architecture & alignment across teams" label). Real facts, plainly. (The terminal's `cat README` is the one place the build is described — factually, because the visitor asked.)

## Brand voice

Three words, as physical objects: **machined** (a precisely milled aluminum phone), **conversational** (a warm spoken answer, not a brochure), **contemporary** (built with the newest tools, unmistakably 2026).

Tone in copy: first person, as Gian answering directly. Confident and specific, but **understated, never boastful**; never buzzword-padded. Metrics are context, not identity: the 3M+ OLX Motors app-launch metric belongs only in the Work app, never on the lock or home screen. A little dry wit is welcome (the terminal has some); corporate gloss is not.

**Name:** the copy uses **"Gian"** where it reads naturally and warm (e.g. "Hey, I'm Gian", the About app's icon label). The formal **"Gianfranco Gasbarri"** is reserved for identity surfaces: page title, the lock-screen name, wordmark, profile name, the share sheet. Both coexist.

## Strategic principles

- The interaction is the hook. Unlocking, the icon-to-app morph, and the tactile presses must feel alive on first load.
- Specific beats grand. Real work ideas, real metrics where they add context, real tools, stated honestly (see Positioning rules). Avoid internal OLX project names in visible copy.
- Minimal text; the design and the visual modules carry the weight, not paragraphs.
- It must read as hand-built, not generated. The bar is "how was this made?", not "which AI made this?"
- Fast and frictionless. Static, no build step, loads instantly, works on a phone first.
- **The OS must behave like a real OS, not look like someone else's.** GianOS has one original design language; the fidelity budget goes into *mechanics* a mobile engineer will clock: real history/back-gesture integration, deep links, focus management, a working share sheet, honest haptics, authentic developer-mode mechanics. Where the platform exposes a real capability, use it rather than faking it.
- **No dead ends.** Every screen has an obvious way forward (unlock hint, back chevron, home handle, Escape) and the browser's own controls always work.

## The OS layer

- **Lock screen** — the hero moment: a real clock, the name as oversized kinetic type (staggered per-letter rise), one bio line, swipe-up or button unlock. Skipped for returning visitors (sessionStorage) and deep links.
- **Home screen** — widgets (now @ OLX Motors, languages), a tinted icon grid, a dock (Gian, Work, Contact, Settings). Icons squish on press with a spring and a haptic tap.
- **Apps** — full-screen views with an oversized collapsing title and scroll-revealed content blocks. Open/close is a shared-element morph (icon tile ↔ app-bar glyph) where View Transitions exist, a clean swap elsewhere and under reduced motion.
- **Contact** — email/LinkedIn CTAs plus a *working* share sheet: drag-to-dismiss, Web Share API first, copy-link / mailto / LinkedIn fallbacks.
- **Settings + developer mode (the easter egg)** — factual rows (version, build, engine, host) and the 7-tap build-number unlock with Android's real toast copy. Developer options: Show layout bounds, Profile frame rate, Animator duration scale (0.5×/1×/5×/10× — all durations route through one token). Unlocking adds the **Terminal** app: `help`, `whoami`, `uname -a`, `ls /apps`, `open <app>` (really navigates), `cat README`, `neofetch`, `clear`, `exit`.
- **Accessible.** Every control is a real `<button>`; unlock works by keyboard; Escape closes; focus returns to the opening icon; complete `prefers-reduced-motion` end states (no kinetic entrance, parallax, springs, morphs, or haptics).

## Anti-references

- A generic ChatGPT/Perplexity clone (AI-purple/teal, lavender gradients, the assistant-app default look).
- **The AI-generated dark theme:** dark mode + a single glowing accent + monospace "tech" labels + grain. This was the first version; it read as "AI made this" and was explicitly rejected in favor of the light "paper" theme (see DESIGN.md).
- The editorial-typographic lane (display-serif italic + mono labels + ruled columns).
- The hero-metric SaaS template (big number, small label, gradient accent, identical cards).
- **Overstated or arrogant copy**, job titles, the word "Staff", and cringe footer/marketing lines (see Positioning rules).
- Buzzword bio copy ("passionate, results-driven, synergy").
- Imitation platform chrome: recreating Apple's or Google's actual UI invites "spot the fake" from the exact audience this page targets. GianOS is original on purpose; only the *mechanics* (back gesture, share, haptics, dev mode) borrow from real OS behavior, because there they are real.
