/* Content for "Ask Gianfranco". Each entry is a suggested prompt that, when
   asked, streams a short answer into the thread and then "pops" in its visual
   modules (badges, tiles, flows) with a staggered reveal.

   Convention: keep prose minimal and bold the words that matter. Anything
   marked class="pop" is held back during the text stream and revealed as a
   unit afterward, so each answer lands with a payoff instead of a wall of
   text. Authored, trusted HTML only (see security note in main.js). */

window.ASK_DATA = {
  // The question that auto-asks itself on first load (hero is already in the DOM).
  hero: "who is gianfranco gasbarri?",

  prompts: [
    {
      id: "ai",
      chip: "How does he work with AI?",
      question: "how does he work with ai?",
      html: `
        <p class="answer-lead">He doesn't just <strong>use</strong> AI tools. He decides how a <strong>whole mobile org</strong> ships with them.</p>
        <div class="badges pop" role="list" aria-label="AI tools">
          <span class="badge badge--lead" role="listitem"><span class="badge__dot"></span>Claude Code</span>
          <span class="badge" role="listitem">Cursor</span>
          <span class="badge" role="listitem">Copilot</span>
          <span class="badge badge--ghost" role="listitem">context engineering</span>
        </div>
        <div class="agentviz pop" aria-label="Coding agents operating safely across a multi-module Flutter codebase">
          <span class="agentviz__agent">agent</span>
          <span class="agentviz__beam"></span>
          <div class="agentviz__mods">
            <span class="mod">auth</span><span class="mod mod--hot">listings</span><span class="mod">chat</span><span class="mod">media</span><span class="mod">core</span>
          </div>
          <span class="agentviz__cap">safe on a <strong>multi-module Flutter</strong> codebase</span>
        </div>
        <div class="punch pop">
          <span class="punch__k">interview</span>
          <p>Co-led the <strong>AI-augmented mobile interview</strong>. Now the <strong>standard format</strong>.</p>
        </div>`
    },
    {
      id: "build",
      chip: "What does he build?",
      question: "what does he actually build?",
      html: `
        <p class="answer-lead">Apps a lot of people open, and the architecture under them.</p>
        <article class="tile pop">
          <header class="tile__head"><span class="tile__org">OLX · Motors</span><span class="tile__when">2021 → now</span></header>
          <h3 class="tile__title">One <strong>Flutter</strong> codebase, many markets</h3>
          <p class="tile__sub">Co-leading the move to consolidate the Motors apps across Europe.</p>
        </article>
        <article class="tile tile--flow pop">
          <header class="tile__head"><span class="tile__org">OLX · GenAI</span><span class="tile__when">shipped</span></header>
          <div class="flow" aria-label="video to a finished ad">
            <span class="flow__step">📹 video</span>
            <span class="flow__arrow">→</span>
            <span class="flow__step flow__step--ai">GenAI</span>
            <span class="flow__arrow">→</span>
            <span class="flow__step flow__step--out">finished ad</span>
          </div>
          <p class="tile__sub">A listing built for pro sellers from a phone camera. Then he set the <strong>platform architecture</strong> behind it.</p>
        </article>
        <article class="tile pop">
          <header class="tile__head"><span class="tile__org">Altice Labs</span><span class="tile__when">2020 → 21</span></header>
          <h3 class="tile__title"><strong>Android + iOS</strong> from one core</h3>
          <p class="tile__sub">A Kotlin Multiplatform initiative sharing networking and WiFi logic across platforms.</p>
        </article>`
    },
    {
      id: "stack",
      chip: "What's his toolkit?",
      question: "what's in his toolkit?",
      html: `
        <div class="kit">
          <div class="kit__row kit__row--lead pop">
            <span class="kit__k">ai</span>
            <span class="chips"><span class="badge badge--lead"><span class="badge__dot"></span>Claude Code</span><span class="badge">Cursor</span><span class="badge">Copilot</span><span class="badge badge--ghost">agents on multi-module code</span></span>
          </div>
          <div class="kit__row pop">
            <span class="kit__k">mobile</span>
            <span class="chips"><span class="badge">Flutter</span><span class="badge">Kotlin</span><span class="badge">Compose</span><span class="badge">Swift</span><span class="badge">KMP</span></span>
          </div>
          <div class="kit__row pop">
            <span class="kit__k">practice</span>
            <span class="chips"><span class="badge">DDD</span><span class="badge">RFCs &amp; ADRs</span><span class="badge">A/B testing</span><span class="badge">rollouts</span><span class="badge">monitoring</span></span>
          </div>
          <div class="kit__row pop">
            <span class="kit__k">speaks</span>
            <span class="chips"><span class="badge badge--flag">🇪🇸 Spanish</span><span class="badge badge--flag">🇵🇹 Português</span><span class="badge badge--flag">🇬🇧 English</span></span>
          </div>
        </div>`
    },
    {
      id: "teams",
      chip: "How does he scale across teams?",
      question: "how does he work across teams?",
      html: `
        <p class="answer-lead">His scope stopped being a single app a while ago.</p>
        <div class="punch pop">
          <span class="punch__k">standards</span>
          <p>Authored cross-team standards for <strong>architecture</strong>, <strong>native/web interop</strong>, and <strong>monitoring</strong>, adopted across product teams.</p>
        </div>
        <div class="punch pop">
          <span class="punch__k">decisions</span>
          <p>Works in <strong>RFCs &amp; ADRs</strong>: written down and arguable, not tribal.</p>
        </div>
        <div class="punch pop">
          <span class="punch__k">people</span>
          <p><strong>Mentor</strong> in the formal programme and <strong>system-design interviewer</strong> for mobile hiring.</p>
        </div>`
    },
    {
      id: "path",
      chip: "Where has he been?",
      question: "what's the path so far?",
      html: `
        <ol class="timeline">
          <li class="timeline__item pop"><span class="timeline__when">2021 — now</span><span class="timeline__what"><strong>Senior Mobile Engineer</strong>, OLX Group · Motors</span></li>
          <li class="timeline__item pop"><span class="timeline__when">2020 — 21</span><span class="timeline__what"><strong>Mobile Engineer</strong>, GFI / Altice Labs</span></li>
          <li class="timeline__item pop"><span class="timeline__when">2017 — 20</span><span class="timeline__what"><strong>Flutter &amp; Node</strong> at Nemobile · Android at Grupo Nepuntobiz</span></li>
          <li class="timeline__item timeline__item--edu pop"><span class="timeline__when">2018</span><span class="timeline__what">Associate Android Developer, <strong>Google</strong></span></li>
        </ol>`
    },
    {
      id: "contact",
      chip: "How do I reach him?",
      question: "how do i reach him?",
      html: `
        <p class="answer-lead">Easy. Pick a channel:</p>
        <div class="contact">
          <a class="cta pop" href="mailto:hey@ggasbarri.com">
            <svg class="cta__icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="m3 6 9 6 9-6"/></svg>
            <span class="cta__body"><span class="cta__k">email</span><span class="cta__v">hey@ggasbarri.com</span></span>
            <span class="cta__go" aria-hidden="true">→</span>
          </a>
          <a class="cta pop" href="https://www.linkedin.com/in/ggasbarri/" target="_blank" rel="noopener">
            <svg class="cta__icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>
            <span class="cta__body"><span class="cta__k">linkedin</span><span class="cta__v">in/ggasbarri</span></span>
            <span class="cta__go" aria-hidden="true">→</span>
          </a>
        </div>`
    }
  ]
};
