/* Content for "Ask Gianfranco".

   The thread is sequenced as a story (David JP Phillips structure): a hook,
   the challenge, the development, an honest setback, then the payoff. Each
   story beat carries:
     kicker  chapter label shown atop the answer
     mood    drives the ambient temperature of the whole app
     next    id of the next beat
     hook    cliffhanger label for the "continue" button (opens the next loop)
   Beats flagged extra:true (toolkit, timeline) sit off the story rail.

   Voice: accurate and understated. He collaborates, aligns, and makes
   decisions across teams; he does not "own" the Flutter migration, he helps
   shape its plan and align the people behind it. No job titles. Let the scope
   of the work imply the level. Keep prose short; bold the words that matter.
   Authored, trusted HTML only (see security note in main.js). */

window.ASK_DATA = {
  hero: "who is gianfranco gasbarri?",

  story: ["hero", "challenge", "build", "ai", "setback", "conclusion"],

  heroNext: { next: "challenge", hook: "So what was the problem?" },

  /* OS-feature layer (overdrive). The phone behaves like a real OS; each beat
     demonstrates a native feature of the selected platform (iOS / Android),
     switched via .os-switch. The spine is a persistent Live Activity that
     tracks the Flutter migration: hero wakes it, challenge..conclusion are
     authentic states of it (blocked -> aligning -> direction set). Copy stays
     accurate: the migration is in progress, never "shipped". Chrome only, the
     brand and answer content are untouched. */
  activity: {
    org: "OLX · Motors",
    title: "Flutter migration",
  },
  // hero: the app's own "live" state, before the migration is even mentioned.
  heroActivity: { kind: "app", state: "live", label: "ask gianfranco" },

  prompts: [
    {
      id: "challenge",
      chip: "What's the hard problem?",
      question: "what's the hard problem?",
      kicker: "the challenge",
      mood: "challenge",
      activity: { kind: "migration", state: "blocked", label: "Auth0 deadline", progress: 0.12 },
      next: "build",
      hook: "So what does he do about it?",
      html: `
        <p class="answer-lead">The Motors apps run on a hybrid native-and-Flutter setup across Europe. It works, but it <strong>costs</strong>.</p>
        <div class="forces pop">
          <div class="force">
            <span class="force__k">the cost</span>
            <p>Reliability and performance hits, a split developer experience, native-and-Flutter dependencies that slow everyone down.</p>
          </div>
          <span class="forces__plus" aria-hidden="true">+</span>
          <div class="force">
            <span class="force__k">the shift</span>
            <p>AI starting to <strong>rewire</strong> how mobile teams build, fast.</p>
          </div>
        </div>
        <p class="stakes pop">Unifying it isn't a coding task. It's getting many teams to <strong>commit to one direction</strong>, without breaking apps that generate <strong>3M+</strong> launches daily.</p>`
    },
    {
      id: "build",
      chip: "What does he work on?",
      question: "so what does he do about it?",
      kicker: "development",
      mood: "build",
      activity: { kind: "migration", state: "planning", label: "execution plan aligned", progress: 0.4, expand: true },
      next: "ai",
      hook: "The bigger shift: how they build",
      html: `
        <p class="answer-lead"><strong>Gian</strong> works on the parts that make a big change actually <strong>happen</strong>.</p>
        <article class="tile pop">
          <header class="tile__head"><span class="tile__org">OLX · Motors</span><span class="tile__when">in progress</span></header>
          <h3 class="tile__title">A path to <strong>one</strong> Flutter codebase</h3>
          <p class="tile__sub">Co-writing the migration's execution plan with the EM and PM, scope, effort, risks, and aligning the teams who have to commit to it.</p>
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
          <p class="tile__sub">Shipped with the team. He wrote the <strong>long-term architecture vision</strong>, turning a fast trade-off into a documented direction.</p>
        </article>`
    },
    {
      id: "ai",
      chip: "How does he work with AI?",
      question: "how did he change how the team builds?",
      kicker: "development",
      mood: "peak",
      activity: { kind: "migration", state: "agents", label: "agents on 5 modules", progress: 0.62 },
      feature: "ai",
      next: "setback",
      hook: "But did any of it come easy?",
      html: `
        <p class="answer-lead">The higher-leverage bet: how a <strong>whole mobile org</strong> works with AI.</p>
        <div class="badges pop" role="list" aria-label="AI tools">
          <span class="badge badge--lead" role="listitem"><span class="badge__dot"></span>Claude Code</span>
          <span class="badge" role="listitem">Cursor</span>
          <span class="badge" role="listitem">Copilot</span>
        </div>
        <div class="agentviz pop" aria-label="Agents.md context keeps coding agents architecturally correct across a multi-module Flutter codebase">
          <span class="agentviz__agent">agent</span>
          <span class="agentviz__beam"></span>
          <div class="agentviz__mods">
            <span class="mod">auth</span><span class="mod mod--hot">listings</span><span class="mod">chat</span><span class="mod">media</span><span class="mod">core</span>
          </div>
          <span class="agentviz__cap"><strong>Agents.md</strong> context, so agents stay architecturally right across modules</span>
        </div>
        <div class="punch pop">
          <span class="punch__k">interview</span>
          <p>Co-redesigned the <strong>AI-era mobile interview</strong>. Adopted as the standard, then a reference for a wider effort.</p>
        </div>`
    },
    {
      id: "setback",
      chip: "Did it come easy?",
      question: "did any of it come easy?",
      kicker: "the honest part",
      mood: "setback",
      activity: { kind: "migration", state: "aligning", label: "aligning teams", progress: 0.68 },
      feature: "focus",
      silenced: { app: "Alignment", icon: "doc", title: "RFC review · still open", body: "Three teams, three good reasons. Slow by nature.", time: "now" },
      next: "conclusion",
      hook: "So where does it land?",
      html: `
        <p class="answer-lead">Honestly? The hard part isn't the code. It's the <strong>alignment</strong>.</p>
        <div class="setback-block pop">
          <p>Writing the plan, mapping the trade-offs, getting teams who each have their own way (and good reasons) to agree on one direction: it's <strong>slow</strong>.</p>
          <p>It rarely demos well. The payoff shows up quietly, in other people's work, months later.</p>
        </div>
        <p class="aside-quiet pop">So he's learned to close those conversations: gather the input, then <strong>own the recommendation</strong>.</p>`
    },
    {
      id: "conclusion",
      chip: "So where does it land?",
      question: "so where does it all land?",
      kicker: "how it lands",
      mood: "payoff",
      activity: { kind: "migration", state: "set", label: "direction set · teams aligned", progress: 0.9 },
      feature: "cascade",
      // The marquee. Impact arriving as notifications, in other people's work.
      // Addressed to Gian's phone, framed as others crediting him (never boastful).
      notes: [
        { app: "Frontend Guild", icon: "guild", title: "Webview guidelines adopted", body: "Three squads shipped on the shared standard.", time: "now" },
        { app: "Mobile Hiring", icon: "hire", title: "Your interview format is the reference", body: "The AI-era loop is now the wider default.", time: "2m" },
        { app: "Mentorship", icon: "mentee", title: "A mentee shipped their initiative", body: "“Thanks for the push.”", time: "9m" }
      ],
      hook: "Want him on your problem?",
      html: `
        <p class="answer-lead">Where it counts: in <strong>other people's</strong> work.</p>
        <div class="payoff pop" role="list">
          <span class="payoff__chip" role="listitem">guidelines and standards other teams build on</span>
          <span class="payoff__chip" role="listitem">an AI-era interview, now a shared reference</span>
          <span class="payoff__chip" role="listitem">mentees who now drive their own initiatives</span>
        </div>
        <p class="punchline pop">The throughline: he makes cross-team decisions <strong>legible</strong>, and moves them forward.</p>`
    },
    {
      id: "contact",
      chip: "How do I reach him?",
      question: "how do i reach him?",
      mood: "warm",
      feature: "poster",
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
    },
    {
      id: "stack",
      chip: "His toolkit",
      question: "what's in his toolkit?",
      extra: true,
      html: `
        <div class="kit">
          <div class="kit__row kit__row--lead pop">
            <span class="kit__k">ai</span>
            <span class="chips"><span class="badge badge--lead"><span class="badge__dot"></span>Claude Code</span><span class="badge">Cursor</span><span class="badge">Copilot</span><span class="badge badge--ghost">Agents.md context</span></span>
          </div>
          <div class="kit__row pop">
            <span class="kit__k">mobile</span>
            <span class="chips"><span class="badge">Flutter</span><span class="badge">Kotlin</span><span class="badge">Compose</span><span class="badge">Swift</span><span class="badge">KMP</span></span>
          </div>
          <div class="kit__row pop">
            <span class="kit__k">how he works</span>
            <span class="chips"><span class="badge">RFCs &amp; ADRs</span><span class="badge">DDD</span><span class="badge">stakeholder alignment</span><span class="badge">A/B &amp; rollouts</span><span class="badge">monitoring</span></span>
          </div>
          <div class="kit__row pop">
            <span class="kit__k">speaks</span>
            <span class="chips"><span class="badge badge--flag">🇪🇸 Spanish</span><span class="badge badge--flag">🇵🇹 Português</span><span class="badge badge--flag">🇬🇧 English</span></span>
          </div>
        </div>`
    },
    {
      id: "path",
      chip: "The timeline",
      question: "what's the path so far?",
      extra: true,
      html: `
        <ol class="timeline">
          <li class="timeline__item pop"><span class="timeline__when">2021 — now</span><span class="timeline__what"><strong>Mobile &amp; cross-team architecture</strong>, OLX Group · Motors</span></li>
          <li class="timeline__item pop"><span class="timeline__when">2020 — 21</span><span class="timeline__what"><strong>Mobile engineer</strong>, GFI / Altice Labs</span></li>
          <li class="timeline__item pop"><span class="timeline__when">2017 — 20</span><span class="timeline__what"><strong>Flutter &amp; Node</strong> at Nemobile · Android at Grupo Nepuntobiz</span></li>
          <li class="timeline__item timeline__item--edu pop"><span class="timeline__when">2018</span><span class="timeline__what">Associate Android Developer, <strong>Google</strong></span></li>
        </ol>`
    }
  ]
};
