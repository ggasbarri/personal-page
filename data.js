/* Content for "Ask Gianfranco".

   The thread is sequenced as a first-person story (David JP Phillips
   structure): a human hook, tension, development, a quiet personal dip, then
   payoff. Each story beat carries:
     kicker  chapter label shown atop the answer
     mood    drives the ambient temperature of the whole app
     next    id of the next beat
     hook    cliffhanger label for the "continue" button (opens the next loop)
   Beats flagged extra:true (toolkit, timeline) sit off the story rail.

   Voice: accurate and understated. Gian collaborates, aligns, and shapes
   decisions across teams; he does not overclaim specific work examples. No
   job titles. Let scope imply level. Keep prose short; bold only the words
   that matter. Authored, trusted HTML only (see security note in main.js). */

/* =========================================================================
   APP_DATA — per-app content. Structured so each app is a sibling key.
   Terminal owns the stack deep-dive; Maps will own path; Ledger owns econ.
   All content follows the same voice rules as ASK_DATA (see header above):
   accurate and understated, no titles, let scope imply level.
   ========================================================================= */
window.APP_DATA = {
  /* Maps — the Venezuela→Portugal journey. Stops are chronological; x/y are
     0–1 fractions over the map viewBox (0,0 top-left → 1,1 bottom-right). They
     sit along the route arc: the first on the Venezuela landmass (bottom-left),
     the last on Iberia (top-right) near Aveiro, the middle ones spaced over the
     ocean — chapters of a journey, not city claims. `place` is set only where
     geography is certain; employers with unknown locations carry org + role
     only (honest: no invented cities). `today:true` flags the live final stop.
     Voice: understated, lowercase-ish, accurate. */
  maps: {
    routeCaption: "≈7,000 km, one direction",
    stops: [
      { id: "carabobo", x: 0.155, y: 0.80, place: "Valencia, Venezuela",
        org: "Universidad de Carabobo", role: "telecom engineering, where it started", years: "until 2017" },
      { id: "freelance", x: 0.305, y: 0.665,
        org: "freelance Android", role: "first apps shipped to the Play Store", years: "2017–18" },
      { id: "nepuntobiz", x: 0.45, y: 0.535,
        org: "Grupo Nepuntobiz", role: "Android consultant, B2B e-learning", years: "2018–19" },
      { id: "nemobile", x: 0.585, y: 0.435,
        org: "Nemobile", role: "mobile + backend at a small AI startup", years: "2019–20" },
      { id: "gfi", x: 0.71, y: 0.345,
        org: "GFI / Altice Labs", role: "smart Wi-Fi apps for telecoms, both native platforms", years: "2020–21" },
      { id: "olx", x: 0.83, y: 0.245, place: "Aveiro, Portugal", today: true,
        org: "OLX Motors", role: "mobile systems across teams — today", years: "2021–now" }
    ]
  },

  terminal: {
    user: "gian",
    host: "aveiro",

    suggested: [
      "gian --stack",
      "ls work/",
      "cat now.txt",
      "whoami",
      "open mail",
      "help"
    ],

    commands: {

      "gian --stack": [
        { text: "────────────────────────────────────────", cls: "dim" },
        { text: "  gian  ·  stack snapshot", cls: "dim" },
        { text: "────────────────────────────────────────", cls: "dim" },
        "",
        { text: "tools", cls: "amber" },
        "  Claude Code   daily driver, agentic tasks",
        "  Cursor        paired editing, refactors",
        "  Copilot       inline completions",
        "  Agents.md     context map, not guesswork",
        "",
        { text: "mobile", cls: "amber" },
        "  Flutter       primary at OLX Motors",
        "  Kotlin        Android native, Compose UI",
        "  Swift         iOS native",
        "  KMP           shared business logic layer",
        "",
        { text: "how I work", cls: "amber" },
        "  RFCs & ADRs   decisions that stay decided",
        "  DDD           define boundaries first",
        "  team align    context before consensus",
        "  A/B & rollouts gradual exposure, measured",
        "  monitoring    observable by default",
        "",
        { text: "languages", cls: "amber" },
        "  ES  Spanish   native",
        "  PT  Portuguese fluent  ·  Aveiro",
        "  EN  English   professional",
        "",
        { text: "────────────────────────────────────────", cls: "dim" }
      ],

      "ls work/": [
        { text: "olx-motors/        gfi-altice/        nemobile/", cls: "amber" },
        { text: "nepuntobiz/        freelance-android/", cls: "amber" }
      ],

      "cat now.txt": [
        "helping teams line up behind a Flutter direction at OLX Motors.",
        "3M+ daily app launches sit behind that work — context before decisions",
        "get expensive. also: economics degree, evenings."
      ],

      "whoami": [
        "gian — mobile systems, Aveiro.  exit code 0."
      ],

      "help": [
        "available commands:",
        "",
        "  gian --stack     stack snapshot: tools, mobile, process, languages",
        "  ls work/         career directories",
        "  cat now.txt      current focus",
        "  whoami           one line",
        "  open mail        open Mail app",
        "  help             this list",
        "",
        { text: "  sudo make me-a-coffee    (try it)", cls: "dim" }
      ],

      "sudo make me-a-coffee": [
        "Permission granted. Brewing…",
        "",
        "       ( (",
        "        ) )",
        "     ........",
        "     |      |]",
        "     \\      /",
        "      `----'",
        "",
        { text: "  ☕  done. no sudo required next time.", cls: "dim" }
      ],

      "__unknown__": [
        { text: "zsh: command not found: {{cmd}}", cls: "err" },
        { text: "  hint: try `help` for available commands", cls: "dim" }
      ]
    }
  }
};

window.ASK_DATA = {
  hero: "who are you?",

  story: ["hero", "shape", "motors", "system", "tools", "human", "lands", "contact"],

  heroNext: { next: "shape", hook: "What kind of work?" },

  /* OS-feature layer. The phone behaves like a real OS; each beat demonstrates
     a native feature of the selected platform (iOS / Android), switched via
     .os-switch. The spine is a persistent Live Activity that tracks the
     broader path through the story. Chrome only, the brand and answer content
     are untouched. */
  activity: {
    org: "Gian",
    title: "Work in motion",
  },
  // hero: the app's own "live" state, before any work example is mentioned.
  heroActivity: { kind: "app", state: "live", label: "gian", short: "gian" },

  prompts: [
    {
      id: "shape",
      chip: "What kind of work?",
      question: "what kind of work do you do?",
      kicker: "the shape",
      mood: "challenge",
      activity: { kind: "work", state: "framing", label: "direction", progress: 0.14 },
      next: "motors",
      hook: "Where does that show up?",
      html: `
        <p class="answer-lead">The interesting work starts when <strong>"just build it"</strong> is too small.</p>
        <div class="badges pop" role="list" aria-label="what the work needs">
          <span class="badge badge--lead" role="listitem">direction</span>
          <span class="badge" role="listitem">risk</span>
          <span class="badge" role="listitem">context</span>
        </div>
        <p class="stakes pop">You need a direction, a risk call, and enough shared context for people to <strong>move</strong>.</p>`
    },
    {
      id: "motors",
      chip: "Where does it show up?",
      question: "where does that show up now?",
      kicker: "OLX Motors",
      mood: "build",
      activity: { kind: "work", state: "planning", label: "teams aligning", progress: 0.38, expand: true },
      next: "system",
      hook: "And beyond that?",
      html: `
        <p class="answer-lead">At <strong>OLX Motors</strong>, I help several teams line up behind a Flutter direction.</p>
        <article class="tile pop">
          <header class="tile__head"><span class="tile__org">OLX Motors</span><span class="tile__when">in progress</span></header>
          <h3 class="tile__title">A shared <strong>Flutter</strong> path</h3>
          <p class="tile__sub">Scope, sequencing, risks, and the tradeoffs everyone has to live with.</p>
          <p class="tile__sub"><strong>3M+ daily app launches</strong> sit behind that work, so context matters before decisions get expensive.</p>
        </article>`
    },
    {
      id: "system",
      chip: "How do you shape it?",
      question: "how do you shape the system?",
      kicker: "shaping the system",
      mood: "build",
      activity: { kind: "work", state: "shaping", label: "system choices", progress: 0.52 },
      next: "tools",
      hook: "How do tools fit in?",
      html: `
        <p class="answer-lead">I like the part where a choice becomes easier for the next team, not just the current ticket.</p>
        <div class="forces pop" role="list" aria-label="ways I shape systems">
          <div class="force" role="listitem">
            <span class="force__k">shape</span>
            <p>Fast experiments need a longer-term architecture before they become tomorrow's default.</p>
          </div>
          <div class="force" role="listitem">
            <span class="force__k">clarify</span>
            <p>Fragile platform boundaries get easier when the rules are visible.</p>
          </div>
          <div class="force" role="listitem">
            <span class="force__k">reuse</span>
            <p>Repeated decisions become standards people can pick up without another meeting.</p>
          </div>
        </div>`
    },
    {
      id: "tools",
      chip: "How do tools fit in?",
      question: "how do tools fit in?",
      kicker: "tools in the flow",
      mood: "peak",
      activity: { kind: "work", state: "agents", label: "tools with context", progress: 0.64 },
      feature: "ai",
      next: "human",
      hook: "What about outside the code?",
      html: `
        <p class="answer-lead">I use coding agents in the normal flow now. The useful part is not the sparkle.</p>
        <div class="badges pop" role="list" aria-label="coding tools">
          <span class="badge badge--lead" role="listitem"><span class="badge__dot"></span>Claude Code</span>
          <span class="badge" role="listitem">Cursor</span>
          <span class="badge" role="listitem">Copilot</span>
        </div>
        <div class="agentviz pop" aria-label="Agents.md context helps coding agents work across a multi-module mobile codebase">
          <span class="agentviz__agent">agent</span>
          <span class="agentviz__beam"></span>
          <div class="agentviz__mods">
            <span class="mod">auth</span><span class="mod mod--hot">listings</span><span class="mod">chat</span><span class="mod">media</span><span class="mod">core</span>
          </div>
          <span class="agentviz__cap"><strong>Agents.md</strong> context, so tools help with the system instead of guessing around it</span>
        </div>
        <div class="punch pop">
          <span class="punch__k">context</span>
          <p>The better the map, the more useful the speed: modules, boundaries, and choices that should not be rediscovered every prompt.</p>
        </div>`
    },
    {
      id: "human",
      chip: "What outside code?",
      question: "what are you like outside code?",
      kicker: "human texture",
      mood: "setback",
      activity: { kind: "work", state: "aligning", label: "quiet focus", progress: 0.72 },
      feature: "focus",
      silenced: { app: "Focus", icon: "doc", title: "Decision thread paused", body: "Good inputs need a clear next step.", time: "now" },
      next: "lands",
      hook: "What actually lands?",
      html: `
        <p class="answer-lead">I like systems outside code too. <strong>Economics</strong> is the current rabbit hole.</p>
        <div class="setback-block pop">
          <p>Incentives, tradeoffs, opportunity cost, why reasonable people choose different things. Annoyingly useful at work.</p>
          <p>Also: Aveiro, three languages, and a soft spot for problems with more than one right answer.</p>
        </div>`
    },
    {
      id: "lands",
      chip: "What actually lands?",
      question: "what actually lands?",
      kicker: "what lands",
      mood: "payoff",
      activity: { kind: "work", state: "clear", label: "path clear", progress: 0.9 },
      feature: "cascade",
      // The marquee. Impact arriving as notifications, framed as outcomes.
      notes: [
        { app: "Architecture", icon: "doc", title: "Constraints made visible", body: "Tradeoffs are clear before implementation starts.", time: "now" },
        { app: "Platform", icon: "guild", title: "Patterns reused", body: "Less bespoke glue at the fragile edges.", time: "2m" },
        { app: "Delivery", icon: "hire", title: "Decisions stayed decided", body: "The team moves instead of reopening the same call.", time: "9m" }
      ],
      next: "contact",
      hook: "Want to talk?",
      html: `
        <p class="answer-lead">The work lands when outputs <strong>outlive the meeting</strong>.</p>
        <div class="payoff pop" role="list">
          <span class="payoff__chip" role="listitem">clearer constraints</span>
          <span class="payoff__chip" role="listitem">reusable patterns</span>
          <span class="payoff__chip" role="listitem">fewer bespoke exceptions</span>
          <span class="payoff__chip" role="listitem">decisions people do not reopen every sprint</span>
        </div>
        <p class="punchline pop">That's the work I like most: making the path clear enough for people to <strong>move</strong>.</p>`
    },
    {
      id: "contact",
      chip: "How do I reach you?",
      question: "how do i reach you?",
      kicker: "contact",
      mood: "warm",
      activity: { kind: "app", state: "contact", label: "contact gian", short: "talk" },
      feature: "poster",
      html: `
        <p class="answer-lead">Want to talk? Email or LinkedIn is easiest.</p>
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
