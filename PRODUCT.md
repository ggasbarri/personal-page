# PRODUCT.md

## Product

**Ask Gianfranco** — the personal page of Gianfranco Gasbarri, presented as a personal AI app. A single-page showcase site framed as "a search summary about me": a mobile app interface where an AI assistant answers questions about Gianfranco, streaming responses with citations to his real career while suggested-prompt chips walk a visitor through his story.

**Register:** brand. Design IS the product. This is a portfolio; the visitor's impression is the deliverable. The content is intentionally light (a bio, a few real work projects, a stack), so the design and interaction carry the weight.

**Signature mechanic (the hook):** the page is a working phone, and it behaves like a real OS. The visitor picks the platform (iOS or Android) and each beat of the story demonstrates a genuine native feature of that OS, recreated by hand in the browser. This does double duty: it advances the narrative and proves the craft of a senior mobile engineer. See **OS-feature layer** below, and DESIGN.md for the visual spec.

## Users

- **Recruiters, hiring managers, and engineering leaders** evaluating a senior mobile engineer. They scan fast, on a phone or a laptop, often between meetings. They should grasp seniority, scope (cross-org, not just code), and craft within seconds.
- **Peer engineers** (mobile, platform) who land here from LinkedIn or a conference and want to know "is this person legit and interesting." They reward technical specificity and a clever build.
- **Gianfranco himself**, who wants a surface that feels unmistakably his and that he's proud to drop in a bio link.

## Who Gianfranco is

Officially a Senior Mobile Engineer at OLX Group (Motors), based in Aveiro, Portugal (8 years across Flutter and native Android). This is internal context for writing the page; the title itself is **not** printed on the page (see Positioning rules). His work increasingly sits across a large org: he aligns engineering, product, and platform teams, makes architecture trade-offs legible, authors cross-team standards, mentors, and interviews. Early, deliberate adopter of AI tooling in the engineering practice (Claude Code, Cursor, Copilot, Agents.md context for agents on multi-module codebases). Multilingual: Spanish (native), Portuguese (fluent), English (professional).

Signature work, **stated accurately** (see Positioning rules; prefer his honest self-assessment over his inflated promotion docs):
- The **Flutter migration** of the Motors apps (3M+ daily launches across Europe): he does **not** own or "lead" it. He co-writes the execution plan with the EM and PM (scope, effort, risks such as the Auth0 deadline) and aligns the teams who have to commit to it.
- **Video2Ad** (GenAI: video to a car listing): a team delivery. His specific contribution is the long-term **architecture vision** document that gave the platform team a concrete direction to evolve it.
- **AI-tooling adoption:** Agents.md context so coding agents stay architecturally correct on a multi-module codebase; co-redesigned the mobile interview for the AI era (adopted as the standard, then a wider reference).
- **Cross-team standards:** co-authored the Webview guidelines for the failure-prone web/native boundary (presented at the Frontend Guild); represented Motors in cross-CU Chat SDK dependency alignment.
- Earlier: a **Kotlin Multiplatform** code-sharing initiative across native Android and iOS (Altice Smart WiFi).

## Positioning rules (stated directly by Gianfranco, treat as hard constraints)

- **Accuracy over impressiveness. Never overstate, never lie, never sound arrogant.** No claim he wouldn't make to a colleague's face. He collaborates, aligns, and makes decisions over time; he does not single-handedly own big initiatives. The Flutter migration is the canonical example: he helps shape and align it, he did not decide or lead it. Sell the *collaboration, strategic thinking, and the decisions* he was able to make.
- **His own promotion / performance docs overstate and can be cringe.** They say "Staff", "led the migration", "secured executive sign-off", "10+ teams". Treat them as raw material, not truth. Prefer his honest FY26 self-assessment for facts.
- **Subtle staff-level signaling, never stated.** He is currently a Senior Mobile Engineer and wants visitors to come away feeling he *deserves staff*. So: **do not print any job title on the page**, and **never use the word "Staff"** (cringe, do not shout it). Let the scope of the work imply the level: cross-team collaboration, architecture trade-offs made legible, prioritizing initiatives by business value, force-multiplying through standards and an interview format others adopt, mentoring. Keep it subtle.
- **Short text.** He worries people won't read at all. Keep copy minimal; lead with visual elements; bold only the words that matter. "Text is for CVs"; this page sells the work visually.
- **No cringe / no slop copy.** Cut marketing filler and self-congratulation (e.g., a "built by hand, not by a template" footer, or an on-the-nose "Architecture & alignment across teams" label). Real facts, plainly.

## Brand voice

Three words, as physical objects: **machined** (a precisely milled aluminum phone), **conversational** (a warm spoken answer, not a brochure), **contemporary** (built with the newest tools, unmistakably 2026).

Tone in copy: first-person-adjacent but written as an assistant answering *about* him. Confident and specific, but **understated, never boastful**; never buzzword-padded. Numbers over adjectives ("3M+ OLX Motors app launches daily" beats "high-scale"). A little dry wit is welcome; corporate gloss is not.

**Name:** the assistant refers to him as **"Gian"** where it reads naturally and warm (e.g. "Gian co-wrote the execution plan"). The formal **"Gianfranco Gasbarri"** is reserved for identity surfaces: page title, wordmark, profile name, the contact poster. Both coexist.

## Strategic principles

- The interaction is the hook. Asking, streaming, and tapping prompts must feel alive on first load.
- Specific beats grand. Real project names, real metrics, real tools, stated honestly (see Positioning rules).
- Minimal text; the design and the visual modules carry the weight, not paragraphs.
- It must read as hand-built, not generated. The bar is "how was this made?", not "which AI made this?"
- Fast and frictionless. Static, no build step, loads instantly, works on a phone first.
- **The phone must read as a *real* phone.** Platform chrome (status bar, Live Activity, notifications, gesture nav, materials, wallpaper) must resemble the *actual current* OS, iOS 26 Liquid Glass and Android Material 3 Expressive, not a generic approximation. Research the current OS design when unsure: wrong-looking native UI is worse than none, because the audience includes mobile engineers who know exactly how these surfaces should look.
- **Chips drive the story; no free-text input.** Navigation is the suggested-prompt chips plus the per-answer "continue" button. The earlier free-text composer input was removed (read as crowded/useless); the opening question now types itself into the outgoing bubble.

## OS-feature layer (overdrive)

The page is a phone that behaves like a real OS. A platform selector (iOS / Android) reskins the whole device, and each story beat fires that platform's signature native surface as a *diegetic* storytelling device, never a gratuitous demo. Requirements:

- **Platform selector.** iOS / Android, auto-detected from the visitor's device, switchable, and remembered (localStorage). On desktop it sits *outside* the phone, on the stage (mirrors the wordmark); on mobile it stays a compact control in the composer.
- **One continuity spine.** A persistent **Live Activity** (iOS Dynamic Island / Android promoted Live Update status chip) tracks the Flutter migration through the entire arc, so the per-beat features never read as a disconnected reel. States stay accurate: the migration is *in progress / direction set*, never "shipped".
- **A native feature per beat**, chosen for narrative meaning:
  - hero, the activity *wakes*; challenge, it *starts* (blocked); build, it *expands* (long-press detail).
  - ai, **Apple Intelligence** edge-glow (iOS) / **Circle-to-Search → Gemini** (Android), tied to his AI-tooling work.
  - setback, **Focus / Do Not Disturb** dims the room and silences a notification (the quiet work that rarely demos).
  - conclusion (**the marquee**), a cascade of notifications from *other people* (guidelines adopted, interview now the reference, a mentee shipped). Impact arriving in other people's work.
  - contact, **Contact Poster** (iOS) / **Quick Share** sheet (Android).
- **Fidelity is the point** (see Strategic principles): Liquid Glass vs Material 3 Expressive, real status-bar glyphs per platform, gesture-nav indicators, platform corner radii, and a per-OS wallpaper that animates on switch.
- **On-brand, not cartoonish.** The OS skin reskins only the *chrome*; the chat content keeps the brand type and clay-red accent. Android's Material You tonal palette is **seeded from the clay-red** so dynamic color stays on-brand. The transient AI-feature colors (Apple Intelligence / Gemini) are the only non-clay moments and resolve back to brand surfaces.
- **Accessible.** Every feature has a still, complete `prefers-reduced-motion` end state (no goo/glow/spring; the cascade falls back to static chips).

## Anti-references

- A generic ChatGPT/Perplexity clone (AI-purple/teal, lavender gradients, the assistant-app default look).
- **The AI-generated dark theme:** dark mode + a single glowing accent + monospace "tech" labels + grain. This was the first version; it read as "AI made this" and was explicitly rejected in favor of the light "paper" theme (see DESIGN.md).
- The editorial-typographic lane (display-serif italic + mono labels + ruled columns).
- The hero-metric SaaS template (big number, small label, gradient accent, identical cards).
- **Overstated or arrogant copy**, job titles, the word "Staff", and cringe footer/marketing lines (see Positioning rules).
- Buzzword bio copy ("passionate, results-driven, synergy").
- Cartoonish or generic OS chrome that doesn't match the real platform; native components that a mobile engineer would clock as fake (see OS-feature layer).
