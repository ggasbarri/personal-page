/* Content for GianOS — a fictional personal mobile OS about Gianfranco.

   The site boots to a lock screen, unlocks to a home screen of apps, and each
   app opens into a full-screen view. Apps carry the same first-person content
   the chat version told as a story; the substance is unchanged.

   Voice: accurate and understated. Gian collaborates, aligns, and shapes
   decisions across teams; he does not overclaim specific work examples. No
   job titles. Let scope imply level. Keep prose short; bold only the words
   that matter. Authored, trusted HTML only (see security note in js/util.js). */

window.GIAN_OS = {
  identity: {
    name: "Gianfranco Gasbarri",
    short: "Gian",
    tagline: "mobile systems · Aveiro, PT",
    email: "hey@ggasbarri.com",
    linkedin: "https://www.linkedin.com/in/ggasbarri/",
    url: "https://ggasbarri.com"
  },

  lock: {
    /* the kinetic hero line; js/lock.js splits and staggers the words */
    name: "Gianfranco Gasbarri",
    line: "I build mobile products and the systems around them.",
    hint: "swipe up to open"
  },

  /* home-screen widgets (authored HTML; rendered as-is) */
  widgets: [
    {
      id: "now",
      html: `
        <span class="widget__k"><span class="dot dot--live"></span>now</span>
        <span class="widget__v">OLX Motors</span>
        <span class="widget__s">mobile systems · Aveiro, PT</span>`
    },
    {
      id: "langs",
      html: `
        <span class="widget__k">speaks</span>
        <span class="widget__v widget__v--flags">🇪🇸 🇵🇹 🇬🇧</span>
        <span class="widget__s">three languages</span>`
    }
  ],

  /* dock (bottom row); other visible apps land on the grid */
  dock: ["about", "work", "contact", "settings"],

  apps: [
    {
      id: "about",
      name: "Gian",
      tint: "clay",
      glyph: "<circle cx='12' cy='8' r='4'/><path d='M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5'/>",
      kicker: "who are you?",
      title: "Gian",
      html: `
        <div class="block reveal">
          <p class="lead">
            Hey, I'm <strong>Gian</strong>. I build mobile products and the systems around them:
            <span class="hl">architecture</span>, <span class="hl">tradeoffs</span>, tooling, and team decisions.
          </p>
          <p>
            I am based in <span class="hl">Aveiro</span>, usually somewhere between native mobile,
            and a conversation about why a tradeoff is worth it. I am also studying economics,
            because incentives explain a suspicious amount of engineering.
          </p>
          <p class="hook-tail">The work gets interesting when <strong>"just build it"</strong> is too small.</p>
        </div>
        <div class="block block--panel reveal">
          <div class="profile">
            <span class="profile__ava">
              <span class="profile__avaframe">
                <img src="assets/gianfranco.jpg" alt="Gianfranco Gasbarri, smiling in sunglasses and a white shirt" width="800" height="800" loading="lazy" />
              </span>
              <span class="dot dot--live" aria-hidden="true"></span>
            </span>
            <div class="profile__id">
              <p class="profile__name">Gianfranco Gasbarri</p>
              <p class="profile__role">Mobile systems · Aveiro, PT</p>
              <a class="profile__link" href="https://www.linkedin.com/in/ggasbarri/" target="_blank" rel="noopener">View on LinkedIn</a>
            </div>
          </div>
          <dl class="panel">
            <div class="panel__row"><dt>now</dt><dd><strong>OLX Motors</strong></dd></div>
            <div class="panel__row"><dt>tools</dt><dd><strong>Claude Code</strong> · Cursor · Copilot</dd></div>
            <div class="panel__row"><dt>based</dt><dd>Aveiro, Portugal</dd></div>
            <div class="panel__row"><dt>mobile</dt><dd>Architecture · Kotlin · Swift · KMP</dd></div>
            <div class="panel__row"><dt>speaks</dt><dd><span class="flags">🇪🇸 🇵🇹 🇬🇧</span></dd></div>
          </dl>
        </div>`
    },
    {
      id: "work",
      name: "Work",
      tint: "apricot",
      glyph: "<path d='M5.5 11 7 6.8A2 2 0 0 1 8.9 5.5h6.2A2 2 0 0 1 17 6.8L18.5 11'/><rect x='3.5' y='11' width='17' height='6' rx='2'/><path d='M7 17v1.8M17 17v1.8'/>",
      kicker: "what kind of work?",
      title: "Work",
      html: `
        <div class="block reveal">
          <p class="lead">The interesting work starts when <strong>"just build it"</strong> is too small.</p>
          <div class="badges" role="list" aria-label="what the work needs">
            <span class="badge badge--lead" role="listitem">direction</span>
            <span class="badge" role="listitem">risk</span>
            <span class="badge" role="listitem">context</span>
          </div>
          <p class="stakes">You need a direction, a risk call, and enough shared context for people to <strong>move</strong>.</p>
        </div>
        <div class="block reveal">
          <p class="lead">At <strong>OLX Motors</strong>, I help several teams line up behind a Flutter direction.</p>
          <article class="tile">
            <header class="tile__head"><span class="tile__org">OLX Motors</span><span class="tile__when">in progress</span></header>
            <h3 class="tile__title">A shared <strong>Flutter</strong> path</h3>
            <p class="tile__sub">Scope, sequencing, risks, and the tradeoffs everyone has to live with.</p>
            <p class="tile__sub"><strong>3M+ daily app launches</strong> sit behind that work, so context matters before decisions get expensive.</p>
          </article>
        </div>`
    },
    {
      id: "system",
      name: "System",
      tint: "moss",
      glyph: "<circle cx='5' cy='12' r='2.2'/><circle cx='19' cy='5' r='2.2'/><circle cx='19' cy='19' r='2.2'/><path d='m7 11 9.5-5M7 13l9.5 5'/>",
      kicker: "how do you shape it?",
      title: "System",
      html: `
        <div class="block reveal">
          <p class="lead">I like the part where a choice becomes easier for the next team, not just the current ticket.</p>
        </div>
        <div class="forces" role="list" aria-label="ways I shape systems">
          <div class="force reveal" role="listitem">
            <span class="force__k">shape</span>
            <p>Fast experiments need a longer-term architecture before they become tomorrow's default.</p>
          </div>
          <div class="force reveal" role="listitem">
            <span class="force__k">clarify</span>
            <p>Fragile platform boundaries get easier when the rules are visible.</p>
          </div>
          <div class="force reveal" role="listitem">
            <span class="force__k">reuse</span>
            <p>Repeated decisions become standards people can pick up without another meeting.</p>
          </div>
        </div>`
    },
    {
      id: "tools",
      name: "Tools",
      tint: "blue",
      glyph: "<path d='M12 3c.7 4.2 2.8 6.3 7 7-4.2.7-6.3 2.8-7 7-.7-4.2-2.8-6.3-7-7 4.2-.7 6.3-2.8 7-7z'/>",
      kicker: "how do tools fit in?",
      title: "Tools",
      html: `
        <div class="block reveal">
          <p class="lead">I use coding agents in the normal flow now. The useful part is not the sparkle.</p>
          <div class="badges" role="list" aria-label="coding tools">
            <span class="badge badge--lead" role="listitem"><span class="badge__dot"></span>Claude Code</span>
            <span class="badge" role="listitem">Cursor</span>
            <span class="badge" role="listitem">Copilot</span>
          </div>
        </div>
        <div class="agentviz reveal" aria-label="Agents.md context helps coding agents work across a multi-module mobile codebase">
          <span class="agentviz__agent">agent</span>
          <span class="agentviz__beam"></span>
          <div class="agentviz__mods">
            <span class="mod">auth</span><span class="mod mod--hot">listings</span><span class="mod">chat</span><span class="mod">media</span><span class="mod">core</span>
          </div>
          <span class="agentviz__cap"><strong>Agents.md</strong> context, so tools help with the system instead of guessing around it</span>
        </div>
        <div class="punch reveal">
          <span class="punch__k">context</span>
          <p>The better the map, the more useful the speed: modules, boundaries, and choices that should not be rediscovered every prompt.</p>
        </div>`
    },
    {
      id: "offcode",
      name: "Off-code",
      tint: "magenta",
      glyph: "<path d='m3 17 6-6 4 4 8-8'/><path d='M15 7h6v6'/>",
      kicker: "what are you like outside code?",
      title: "Off-code",
      html: `
        <div class="block reveal">
          <p class="lead">I like systems outside code too. <strong>Economics</strong> is the current rabbit hole.</p>
        </div>
        <div class="quiet reveal">
          <p>Incentives, tradeoffs, opportunity cost, why reasonable people choose different things. Annoyingly useful at work.</p>
          <p>Also: Aveiro, three languages, and a soft spot for problems with more than one right answer.</p>
        </div>`
    },
    {
      id: "outcomes",
      name: "Outcomes",
      tint: "clay",
      glyph: "<path d='M20 6 9 17l-5-5'/>",
      kicker: "what actually lands?",
      title: "Outcomes",
      html: `
        <div class="block reveal">
          <p class="lead">The work lands when outputs <strong>outlive the meeting</strong>.</p>
        </div>
        <div class="notes" role="list">
          <div class="note reveal" role="listitem">
            <span class="note__app">Architecture</span>
            <span class="note__title">Constraints made visible</span>
            <span class="note__body">Tradeoffs are clear before implementation starts.</span>
          </div>
          <div class="note reveal" role="listitem">
            <span class="note__app">Platform</span>
            <span class="note__title">Patterns reused</span>
            <span class="note__body">Less bespoke glue at the fragile edges.</span>
          </div>
          <div class="note reveal" role="listitem">
            <span class="note__app">Delivery</span>
            <span class="note__title">Decisions stayed decided</span>
            <span class="note__body">The team moves instead of reopening the same call.</span>
          </div>
        </div>
        <p class="punchline reveal">That's the work I like most: making the path clear enough for people to <strong>move</strong>.</p>`
    },
    {
      id: "stack",
      name: "Stack",
      tint: "moss",
      glyph: "<path d='m12 3 9 5-9 5-9-5 9-5z'/><path d='m3 13 9 5 9-5'/>",
      kicker: "what's in your toolkit?",
      title: "Stack",
      html: `
        <div class="kit">
          <div class="kit__row kit__row--lead reveal">
            <span class="kit__k">tools</span>
            <span class="chips"><span class="badge badge--lead"><span class="badge__dot"></span>Claude Code</span><span class="badge">Cursor</span><span class="badge">Copilot</span><span class="badge badge--ghost">Agents.md context</span></span>
          </div>
          <div class="kit__row reveal">
            <span class="kit__k">mobile</span>
            <span class="chips"><span class="badge">Flutter</span><span class="badge">Kotlin</span><span class="badge">Compose</span><span class="badge">Swift</span><span class="badge">KMP</span></span>
          </div>
          <div class="kit__row reveal">
            <span class="kit__k">how I work</span>
            <span class="chips"><span class="badge">RFCs &amp; ADRs</span><span class="badge">DDD</span><span class="badge">team alignment</span><span class="badge">A/B &amp; rollouts</span><span class="badge">monitoring</span></span>
          </div>
          <div class="kit__row reveal">
            <span class="kit__k">languages</span>
            <span class="chips"><span class="badge badge--flag">🇪🇸 Spanish</span><span class="badge badge--flag">🇵🇹 Portuguese</span><span class="badge badge--flag">🇬🇧 English</span></span>
          </div>
        </div>`
    },
    {
      id: "path",
      name: "Path",
      tint: "blue",
      glyph: "<path d='M5 21V4'/><path d='M5 4h12l-2.5 4L17 12H5'/>",
      kicker: "what's your path so far?",
      title: "Path",
      html: `
        <ol class="timeline">
          <li class="timeline__item reveal"><span class="timeline__when">2021 to now</span><span class="timeline__what"><strong>OLX Group · Motors</strong>, mobile systems and cross-team architecture</span></li>
          <li class="timeline__item reveal"><span class="timeline__when">2020 to 21</span><span class="timeline__what"><strong>GFI / Altice Labs</strong>, mobile product work</span></li>
          <li class="timeline__item reveal"><span class="timeline__when">2017 to 20</span><span class="timeline__what"><strong>Nemobile / Grupo Nepuntobiz</strong>, Flutter, Node, and Android</span></li>
          <li class="timeline__item timeline__item--edu reveal"><span class="timeline__when">2018</span><span class="timeline__what">Associate Android Developer certification, <strong>Google</strong></span></li>
        </ol>`
    },
    {
      id: "contact",
      name: "Contact",
      tint: "clay",
      glyph: "<path d='M12 4a8 7 0 0 1 8 7 8 7 0 0 1-8 7c-1 0-1.95-.13-2.85-.38L4.5 19l1.3-2.9A6.9 6.9 0 0 1 4 11a8 7 0 0 1 8-7z'/>",
      kicker: "how do i reach you?",
      title: "Contact",
      html: `
        <div class="block reveal">
          <p class="lead">Want to talk? Email or LinkedIn is easiest.</p>
        </div>
        <div class="contact">
          <a class="cta reveal" href="mailto:hey@ggasbarri.com">
            <svg class="cta__icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="m3 6 9 6 9-6"/></svg>
            <span class="cta__body"><span class="cta__k">email</span><span class="cta__v">hey@ggasbarri.com</span></span>
            <span class="cta__go" aria-hidden="true">→</span>
          </a>
          <a class="cta reveal" href="https://www.linkedin.com/in/ggasbarri/" target="_blank" rel="noopener">
            <svg class="cta__icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>
            <span class="cta__body"><span class="cta__k">linkedin</span><span class="cta__v">in/ggasbarri</span></span>
            <span class="cta__go" aria-hidden="true">→</span>
          </a>
        </div>
        <button class="share-trigger reveal" type="button" id="shareTrigger">
          <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 16V3"/><path d="m7 8 5-5 5 5"/></svg>
          Share this page
        </button>`
    },
    {
      id: "settings",
      name: "Settings",
      tint: "neutral",
      glyph: "<path d='M4 7h8M18 7h2M4 17h2M10 17h10'/><circle cx='15' cy='7' r='2.2'/><circle cx='7' cy='17' r='2.2'/>",
      kicker: "about this OS",
      title: "Settings",
      /* rows are wired up by js/dev.js after render (build-number easter egg) */
      html: `
        <div class="set__group reveal" role="group" aria-label="About GianOS">
          <span class="set__label">about gianos</span>
          <div class="set__rows">
            <div class="set__row"><span class="set__k">Version</span><span class="set__v">GianOS 1.0</span></div>
            <button class="set__row set__row--btn" type="button" id="buildRow">
              <span class="set__k">Build number</span><span class="set__v">2026.06 · ggasbarri.com</span>
            </button>
            <div class="set__row"><span class="set__k">Engine</span><span class="set__v">vanilla JS · zero build</span></div>
            <div class="set__row"><span class="set__k">Host</span><span class="set__v">Cloudflare Pages</span></div>
          </div>
        </div>
        <div class="set__group reveal" role="group" aria-label="Display">
          <span class="set__label">display</span>
          <div class="set__rows">
            <div class="set__row"><span class="set__k">Theme</span><span class="set__v">warm paper</span></div>
            <div class="set__row"><span class="set__k">Reduce motion</span><span class="set__v" id="rmStatus">off</span></div>
          </div>
        </div>
        <div class="set__group" id="devGroup" hidden role="group" aria-label="Developer options">
          <span class="set__label">developer options</span>
          <div class="set__rows">
            <button class="set__row set__row--btn" type="button" data-devopt="bounds" aria-pressed="false">
              <span class="set__k">Show layout bounds</span><span class="set__v set__toggle" aria-hidden="true"></span>
            </button>
            <button class="set__row set__row--btn" type="button" data-devopt="fps" aria-pressed="false">
              <span class="set__k">Profile frame rate</span><span class="set__v set__toggle" aria-hidden="true"></span>
            </button>
            <button class="set__row set__row--btn" type="button" data-devopt="animator">
              <span class="set__k">Animator duration scale</span><span class="set__v" id="animScale">1×</span>
            </button>
          </div>
          <p class="set__hint">Terminal added to the home screen.</p>
        </div>`
    },
    {
      id: "terminal",
      name: "Terminal",
      tint: "ink",
      hidden: true, /* appears on the grid only after developer mode unlocks */
      glyph: "<path d='m5 7 5 5-5 5'/><path d='M13 17h6'/>",
      kicker: "developer mode",
      title: "Terminal",
      html: `` /* js/dev.js renders the terminal UI */
    }
  ],

  dev: {
    toasts: {
      step: "You are now {n} steps away from being a developer.",
      done: "You are now a developer!",
      already: "No need, you are already a developer."
    },
    terminal: {
      motd: "GianOS 1.0 — hand-built, zero dependencies.\ntype `help` to look around.",
      whoami: "gian — I build mobile products and the systems around them.",
      uname: "GianOS 1.0 #nobuild vanilla-js cloudflare-pages warm-paper",
      readme: [
        "This site is hand-authored HTML, CSS, and vanilla JavaScript.",
        "No framework, no build step, no dependencies.",
        "",
        "App opens use the View Transitions API. The share sheet is the",
        "real Web Share API. Haptics are the Vibration API. The easter",
        "egg you just found is the same one Android ships.",
        "",
        "Hosted on Cloudflare Pages, deployed on push to main."
      ].join("\n")
    }
  }
};
