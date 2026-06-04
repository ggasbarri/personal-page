/* Content for "Ask Gianfranco". Each entry is a suggested prompt that, when
   asked, streams an answer into the thread. Answers are authored HTML so the
   streaming reveal can keep markup (citations, highlights, cards) intact. */

window.ASK_DATA = {
  // The question that auto-asks itself on first load (hero is already in the DOM).
  hero: "who is gianfranco gasbarri?",

  prompts: [
    {
      id: "build",
      chip: "What does he actually build?",
      question: "what does he actually build?",
      html: `
        <p class="answer-lead">Apps a lot of people use, and the architecture under them. A few that matter:</p>
        <div class="work">
          <article class="work__item">
            <div class="work__top"><span class="work__org">OLX Group · Motors</span><span class="work__when">2021 → now</span></div>
            <h3 class="work__title">Consolidating Motors onto Flutter</h3>
            <p>Co-leading the strategy and roadmap to unify the Motors classifieds apps across European markets on a single Flutter codebase, aligning engineering, product, and platform teams to get there.</p>
          </article>
          <article class="work__item">
            <div class="work__top"><span class="work__org">OLX Group · GenAI</span><span class="work__when">shipped</span></div>
            <h3 class="work__title">Video → a finished listing</h3>
            <p>Shipped a GenAI listing-creation flow for professional sellers: point a camera at a car, get a structured ad back. Then defined the long-term architecture the platform team adopted to scale it.</p>
          </article>
          <article class="work__item">
            <div class="work__top"><span class="work__org">GFI · Altice Labs</span><span class="work__when">2020 → 21</span></div>
            <h3 class="work__title">Smart WiFi, shared across platforms</h3>
            <p>Led a Kotlin Multiplatform initiative across native Android and iOS, unifying networking and WiFi logic for telecom operators in the Altice group, and across market-specific builds.</p>
          </article>
        </div>`
    },
    {
      id: "ai",
      chip: "How does he use AI tooling?",
      question: "how does he use ai in the engineering practice?",
      html: `
        <p>Not as a demo, as a way the team ships. He drove AI-tooling adoption across the mobile org:<a class="cite" href="#ai">·</a></p>
        <ul class="list">
          <li>Designed how coding agents operate <strong>safely</strong> against a large multi-module Flutter codebase, context engineering, guardrails, the boring parts that make agents trustworthy.</li>
          <li>Co-led the redesign of the mobile engineering <strong>interview</strong> for AI-augmented candidates. It is now the standard format.</li>
          <li>Daily driver of Claude Code, Cursor, and Copilot, with a real point of view on where they help and where they don't.</li>
        </ul>`
    },
    {
      id: "teams",
      chip: "How does he work across teams?",
      question: "how does he work across teams?",
      html: `
        <p>His scope stopped being a single app a while ago. Across the org he:</p>
        <ul class="list">
          <li>Authored cross-team technical <strong>standards</strong> for architecture, native/web interop, and production monitoring, now adopted across multiple product teams.</li>
          <li>Works in <strong>RFCs and ADRs</strong>, so decisions are written down and arguable, not tribal.</li>
          <li>Mentors in the formal mentorship programme and runs <strong>system-design interviews</strong> for mobile hiring.</li>
        </ul>
        <p class="answer-aside">Translation: he's the engineer other engineers' decisions route through.</p>`
    },
    {
      id: "stack",
      chip: "What's his stack?",
      question: "what's in his toolbox?",
      html: `
        <div class="stack">
          <div class="stack__group">
            <p class="stack__k">mobile</p>
            <p class="stack__v">Flutter / Dart · Kotlin / Android · Jetpack Compose · Swift · Kotlin Multiplatform</p>
          </div>
          <div class="stack__group">
            <p class="stack__k">ai tools</p>
            <p class="stack__v">Claude Code · Cursor · GitHub Copilot · context engineering for agents on multi-module codebases</p>
          </div>
          <div class="stack__group">
            <p class="stack__k">practice</p>
            <p class="stack__v">Domain-Driven Design · RFCs &amp; ADRs · monitoring · analytics · A/B testing · feature rollouts</p>
          </div>
          <div class="stack__group">
            <p class="stack__k">languages</p>
            <p class="stack__v">Spanish (native) · Portuguese (fluent) · English (full professional)</p>
          </div>
        </div>`
    },
    {
      id: "path",
      chip: "Where has he been?",
      question: "what's the path so far?",
      html: `
        <ol class="timeline">
          <li class="timeline__item"><span class="timeline__when">2021 — now</span><span class="timeline__what"><strong>Senior Mobile Engineer</strong>, OLX Group · Motors</span></li>
          <li class="timeline__item"><span class="timeline__when">2020 — 21</span><span class="timeline__what"><strong>Mobile Engineer</strong>, GFI / Altice Labs</span></li>
          <li class="timeline__item"><span class="timeline__when">2017 — 20</span><span class="timeline__what"><strong>Flutter &amp; Node/Mongo</strong> at Nemobile · Android consulting at Grupo Nepuntobiz</span></li>
          <li class="timeline__item timeline__item--edu"><span class="timeline__when">2018</span><span class="timeline__what">Associate Android Developer, <strong>Google</strong></span></li>
          <li class="timeline__item timeline__item--edu"><span class="timeline__when">exp. 2028</span><span class="timeline__what">BSc Economics, Universidad de las Hespérides</span></li>
        </ol>`
    },
    {
      id: "contact",
      chip: "How do I reach him?",
      question: "how do i reach him?",
      html: `
        <p class="answer-lead">Easy. Pick a channel:</p>
        <div class="contact">
          <a class="contact__link" href="mailto:hey@ggasbarri.com">
            <span class="contact__k">email</span><span class="contact__v">hey@ggasbarri.com</span>
          </a>
          <a class="contact__link" href="https://www.linkedin.com/in/ggasbarri" target="_blank" rel="noopener">
            <span class="contact__k">linkedin</span><span class="contact__v">in/ggasbarri</span>
          </a>
          <span class="contact__link contact__link--static">
            <span class="contact__k">based in</span><span class="contact__v">Aveiro, Portugal</span>
          </span>
        </div>
        <p class="answer-aside">He reads Spanish, Portuguese, and English, so say hi in whichever is easiest.</p>`
    }
  ]
};
