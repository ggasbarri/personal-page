/* =========================================================================
   GianOS — Terminal app
   Vanilla JS, no dependencies. Registers the Terminal app with GG.Apps.

   A fake shell: scrollback log + prompt row + suggested-command chips.
   Physical keyboard input is captured by a real, focusable <input> that
   IS the prompt line. It sits transparently over the prompt row (its own
   text/caret/background are invisible); what you see is the display span
   plus the block cursor mirroring the input's value. Keydown on the input
   builds the command: Enter executes, Backspace works, Tab cycles
   suggestions (native Tab only when the buffer is empty, so keyboard users
   can still move focus off the input). Because handling lives on the input
   (not the document), Tab is only intercepted while the input has focus —
   the back button and command chips stay reachable by Tab (WCAG 2.1.2), and
   the input carries a real accessible label so AT users know typing works.
   Clicking anywhere in the output focuses the input (terminal convention).

   On first open: autotypes `gian --stack` via GG.Util.typeInto then prints
   output line-by-line (staggered 30ms/line; instant under reduced motion).
   Re-open: scrollback preserved, no re-autotype.

   Security note: ALL command output is authored data from APP_DATA.terminal
   (trusted, shipped with the site). User keyboard input is rendered ONLY via
   textContent — never innerHTML. Output lines that carry a `cls` field get a
   CSS class for tinting; the class name comes from data and is whitelisted to
   the known set. No dynamic code execution, no user-controlled HTML injection.
   ========================================================================= */
(function () {
  "use strict";

  var td = (window.APP_DATA && window.APP_DATA.terminal) || {};
  var REDUCED = GG.REDUCED;

  // -------------------------------------------------------------------------
  // Theme-color meta sync for the dark app
  // On open: switch theme-color to the terminal dark surface; on close: restore
  // to the computed --accent (GG.Theme._syncMeta handles the normal case).
  // -------------------------------------------------------------------------
  var TERM_THEME = "oklch(0.18 0.02 150)";  // matches --term-bg

  function syncMetaDark() {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", TERM_THEME);
  }
  function syncMetaRestore() {
    // delegate back to Theme._syncMeta which resolves the real --accent
    if (GG.Theme && GG.Theme._syncMeta) GG.Theme._syncMeta();
  }

  // -------------------------------------------------------------------------
  // DOM refs — populated once during mount()
  // -------------------------------------------------------------------------
  var screenEl    = null;  // .app-screen[data-app=terminal]
  var scrollback  = null;  // .term-scrollback  (role=log)
  var bufferSpan  = null;  // .term-input-buffer  (visual mirror, aria-hidden)
  var inputEl     = null;  // .term-input  (real focusable input, the input home)
  var chipsRow    = null;  // .term-chips

  // state
  var opened  = false;     // has the terminal been opened at least once?
  var keyBuf  = "";        // current keyboard input buffer
  var tabIdx  = -1;        // current Tab-cycle index into suggestions

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  function appendLine(text, cls) {
    var line = document.createElement("span");
    line.className = "term-line" + (cls ? " term-line--" + cls : "");
    line.textContent = text;
    scrollback.appendChild(line);
    return line;
  }

  function appendSpacer() {
    var s = document.createElement("span");
    s.className = "term-spacer";
    s.setAttribute("aria-hidden", "true");
    scrollback.appendChild(s);
  }

  // Print the command echo line then its output lines, staggered.
  // Returns a Promise that resolves when all lines are printed.
  function printOutput(cmdText, lines) {
    return new Promise(function (resolve) {
      // echo the command
      appendLine(td.user + "@" + td.host + " ~ % " + cmdText, "cmd");

      if (!lines || !lines.length) { scrollEnd(); resolve(); return; }

      var delay = REDUCED ? 0 : 30;
      var i = 0;

      function next() {
        if (i >= lines.length) { scrollEnd(); resolve(); return; }
        var entry = lines[i++];
        var text = typeof entry === "string" ? entry : (entry.text || "");
        var cls  = typeof entry === "object" ? (entry.cls || null) : null;
        appendLine(text, cls);
        scrollEnd();
        if (delay === 0) { next(); }
        else { setTimeout(next, delay); }
      }
      next();
    });
  }

  function scrollEnd() {
    if (!scrollback) return;
    scrollback.scrollTop = scrollback.scrollHeight;
  }

  // Weekday/time stamp for the synthetic "last login" boot line — cheap
  // realism, no timezone math needed (matches the shell prompt's own clock).
  var BOOT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  function bootStamp() {
    var d = new Date();
    var h = d.getHours(), m = d.getMinutes();
    return BOOT_DAYS[d.getDay()] + " " + (h < 10 ? "0" + h : h) + ":" + (m < 10 ? "0" + m : m);
  }

  // The scrollback stays role="log" always, but aria-live is toggled: "off"
  // while the first-open auto-demo streams its ~30 staggered lines (so AT
  // users aren't flooded with an uninterruptible announcement queue), then
  // "polite" once the demo hands the caret to the user. User-run commands
  // (chips/Enter) always announce normally.
  function setAriaLive(state) {
    if (scrollback) scrollback.setAttribute("aria-live", state);
  }

  function trimScrollback() {
    var CAP = 200;
    var lines = scrollback.querySelectorAll(".term-line");
    if (lines.length > CAP) {
      for (var i = 0; i < lines.length - CAP; i++) {
        lines[i].remove();
      }
    }
  }

  // -------------------------------------------------------------------------
  // Command execution
  // -------------------------------------------------------------------------
  // Commands queue behind any output still printing, so staggered lines from
  // one command never interleave with the next.
  var execChain = Promise.resolve();
  function execute(raw) {
    execChain = execChain.then(function () { return executeNow(raw); });
  }

  function executeNow(raw) {
    var cmd = raw.trim();
    if (!cmd) return;

    appendSpacer();

    var def = td.commands && td.commands[cmd];

    if (cmd === "open mail") {
      // special-case: check if mail is registered
      var mailDef = GG.Apps.get("mail");
      if (mailDef) {
        appendLine(td.user + "@" + td.host + " ~ % " + cmd, "cmd");
        appendLine("opening Mail…", null);
        scrollEnd();
        setTimeout(function () { GG.Shell.open("mail"); }, 420);
      } else {
        appendLine(td.user + "@" + td.host + " ~ % " + cmd, "cmd");
        appendLine("mail: app not installed yet", "err");
        scrollEnd();
      }
      appendSpacer();
      trimScrollback();
      return;
    }

    if (def) {
      return printOutput(cmd, def).then(function () {
        appendSpacer();
        trimScrollback();
      });
    }
    // unknown command
    var unknown = td.commands && td.commands["__unknown__"];
    var lines = unknown ? unknown.map(function (entry) {
      if (typeof entry === "string") return entry.replace("{{cmd}}", cmd);
      return { text: (entry.text || "").replace("{{cmd}}", cmd), cls: entry.cls };
    }) : [{ text: "zsh: command not found: " + cmd, cls: "err" }];
    return printOutput(cmd, lines).then(function () {
      appendSpacer();
      trimScrollback();
    });
  }

  // -------------------------------------------------------------------------
  // Keyboard input
  //
  // The real <input> (inputEl) is the source of truth for the command buffer;
  // keyBuf mirrors it and the display span (bufferSpan) mirrors keyBuf so the
  // phosphor look + block cursor stay pixel-identical. setBuffer() writes all
  // three at once.
  // -------------------------------------------------------------------------
  function setBuffer(val) {
    keyBuf = val;
    if (inputEl && inputEl.value !== val) inputEl.value = val;
    if (bufferSpan) bufferSpan.textContent = val;
  }

  // Sync the display span from the input after native edits (typing, paste,
  // native Backspace, IME composition, etc.).
  function syncFromInput() {
    keyBuf = inputEl ? inputEl.value : "";
    if (bufferSpan) bufferSpan.textContent = keyBuf;
    tabIdx = -1;
  }

  // Keydown handler bound to the INPUT only — so Tab and typing are captured
  // exclusively while the input is focused. Elsewhere in the Terminal screen
  // (back button, chips) keys behave natively and normal Tab order works.
  function handleKey(e) {
    var suggestions = td.suggested || [];

    switch (e.key) {
      case "Enter":
        e.preventDefault();
        var cmd = keyBuf;
        setBuffer(""); tabIdx = -1;
        execute(cmd);
        break;

      case "Tab":
        // Autocomplete only when there is something to complete OR a cycle is
        // in progress. On an empty, untouched buffer let Tab move focus away
        // natively (keyboard users can escape the input) — WCAG 2.1.2.
        if (!suggestions.length) return;
        if (keyBuf.length === 0 && tabIdx === -1) return;  // native focus move
        e.preventDefault();
        tabIdx = (tabIdx + 1) % suggestions.length;
        setBuffer(suggestions[tabIdx]);
        break;

      // Backspace and printable characters are handled natively by the input;
      // the `input` event (syncFromInput) mirrors them into the display span.
      default:
        break;
    }
  }

  // -------------------------------------------------------------------------
  // Chip interaction
  // -------------------------------------------------------------------------
  function runChip(cmd) {
    setBuffer(""); tabIdx = -1;
    execute(cmd);
  }

  // Matches touch/stylus-primary devices — used to withhold *automatic*
  // focus so opening/autotyping the terminal doesn't pop the soft keyboard
  // over the scrollback. Deliberate taps (see the mouseup handler below)
  // bypass this check, since summoning the keyboard is exactly what a tap
  // on the prompt should do.
  var COARSE_POINTER = window.matchMedia && window.matchMedia("(pointer: coarse)");

  // Focus the command input without yanking the page (preventScroll where
  // supported). Used on output-area clicks — the usual terminal convention
  // — and after onOpen/autotype. Pass auto=true for the latter: on
  // coarse-pointer (touch) devices this skips the focus call so the soft
  // keyboard doesn't ambush the user; explicit clicks (auto omitted) always
  // focus so tapping the terminal still summons the keyboard on purpose.
  function focusInput(auto) {
    if (!inputEl) return;
    if (auto && COARSE_POINTER && COARSE_POINTER.matches) return;
    try { inputEl.focus({ preventScroll: true }); }
    catch (err) { inputEl.focus(); }
  }

  // -------------------------------------------------------------------------
  // Tablet-tier info pane — a static, framed kv panel to the right of the
  // scrollback (tmux-split idiom). Content comes from td.info (data.js) and
  // is deliberately complementary to `gian --stack`, not a repeat of it:
  // session framing (status/base/focus) rather than the tools/mobile/process
  // breakdown that streams in on open. Purely additive DOM; CSS keeps it
  // display:none below @container device 700px so phone is untouched.
  // -------------------------------------------------------------------------
  function buildInfoPane(body) {
    var info = td.info;
    if (!info) return;

    var pane = document.createElement("aside");
    pane.className = "term-info";
    pane.setAttribute("aria-label", "Session info");

    var head = document.createElement("div");
    head.className = "term-info__head";
    head.setAttribute("aria-hidden", "true");
    head.textContent = info.title || "session";
    pane.appendChild(head);

    var kv = document.createElement("dl");
    kv.className = "term-info__kv";
    (info.rows || []).forEach(function (row) {
      var dt = document.createElement("dt");
      dt.className = "term-info__k";
      dt.textContent = row.k;
      var dd = document.createElement("dd");
      dd.className = "term-info__v";
      dd.textContent = row.v;
      kv.appendChild(dt);
      kv.appendChild(dd);
    });
    pane.appendChild(kv);

    if (info.note) {
      var note = document.createElement("div");
      note.className = "term-info__note";
      note.textContent = info.note;
      pane.appendChild(note);
    }

    body.appendChild(pane);
  }

  // -------------------------------------------------------------------------
  // Build DOM (mount — called once on first open)
  // -------------------------------------------------------------------------
  function mount() {
    screenEl = document.querySelector('.app-screen[data-app="terminal"]');
    if (!screenEl) return;

    var body = screenEl.querySelector(".app-body");
    if (!body) return;

    // clear any placeholder content (the static HTML shell is minimal)
    body.innerHTML = "";

    // --- main column (scrollback + prompt) ---------------------------------
    // Wrapper exists purely for the tablet split (see buildInfoPane below):
    // on phone it is display:contents so scrollback + promptRow sit directly
    // in the .app-body flow, pixel-identical to before this wrapper existed.
    var main = document.createElement("div");
    main.className = "term-main";
    body.appendChild(main);

    // --- scrollback log ---------------------------------------------------
    scrollback = document.createElement("div");
    scrollback.className = "term-scrollback";
    scrollback.setAttribute("role", "log");
    // Starts "off" — the first-open auto-demo runs next and would otherwise
    // flood AT users with ~30 staggered announcements. onOpen flips this to
    // "polite" once the demo finishes (or immediately, for re-opens).
    scrollback.setAttribute("aria-live", "off");
    scrollback.setAttribute("aria-label", "Terminal output");
    main.appendChild(scrollback);

    // --- prompt row -------------------------------------------------------
    var promptRow = document.createElement("div");
    promptRow.className = "term-prompt-row";

    var prefix = document.createElement("span");
    prefix.className = "term-prompt-prefix";
    prefix.setAttribute("aria-hidden", "true");
    prefix.textContent = (td.user || "gian") + "@" + (td.host || "aveiro") + " ~ %";

    bufferSpan = document.createElement("span");
    bufferSpan.className = "term-input-buffer";
    bufferSpan.setAttribute("aria-hidden", "true");  // visual mirror only; the input is the AT affordance
    bufferSpan.textContent = "";

    var cursor = document.createElement("span");
    cursor.className = "term-cursor";
    cursor.setAttribute("aria-hidden", "true");

    // The real, focusable input home. Transparent (own text/caret/bg invisible)
    // so the phosphor display span + block cursor remain the only visible
    // affordance, but it carries native focus, a real caret for AT, and a
    // proper label. Autocomplete/spellcheck off — this is a fake shell prompt.
    inputEl = document.createElement("input");
    inputEl.type = "text";
    inputEl.className = "term-input";
    inputEl.setAttribute("aria-label", "Terminal command input");
    inputEl.setAttribute("autocomplete", "off");
    inputEl.setAttribute("autocapitalize", "off");
    inputEl.setAttribute("autocorrect", "off");
    inputEl.setAttribute("spellcheck", "false");
    inputEl.addEventListener("keydown", handleKey);
    inputEl.addEventListener("input", syncFromInput);

    promptRow.appendChild(prefix);
    promptRow.appendChild(bufferSpan);
    promptRow.appendChild(cursor);
    promptRow.appendChild(inputEl);
    main.appendChild(promptRow);

    // Clicking anywhere in the output area focuses the prompt input, matching
    // real terminal-emulator behaviour (casual typing "just works"). Skip when
    // the user is selecting text so copy still works.
    scrollback.addEventListener("mouseup", function () {
      var sel = window.getSelection && window.getSelection();
      if (sel && sel.toString().length) return;
      focusInput();
    });

    // --- suggested chips row -----------------------------------------------
    chipsRow = document.createElement("div");
    chipsRow.className = "term-chips";
    chipsRow.setAttribute("role", "group");
    chipsRow.setAttribute("aria-label", "Suggested commands");

    var suggestions = td.suggested || [];
    suggestions.forEach(function (cmd) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "term-chip";
      btn.textContent = cmd;
      btn.setAttribute("aria-label", "Run: " + cmd);
      btn.addEventListener("click", function () { runChip(cmd); });
      chipsRow.appendChild(btn);
    });

    body.appendChild(chipsRow);

    // --- tablet info pane ---------------------------------------------------
    // Inert on phone (CSS hides it below @container device 700px); on tablet
    // it becomes a static right-hand panel, tmux-split style, beside `main`.
    buildInfoPane(body);

    // No document-level keydown: input is captured on inputEl only, so Tab
    // stays native everywhere else in the screen and nothing leaks when the
    // app is closed (the listener lives on the input, mounted once).
  }

  // -------------------------------------------------------------------------
  // App lifecycle
  // -------------------------------------------------------------------------
  GG.Apps.register({
    id: "terminal",
    label: "Terminal",

    mount: mount,

    onOpen: function () {
      syncMetaDark();

      if (opened) {
        // re-open: scroll to bottom (state preserved) and restore the caret
        // to the prompt so keyboard/AT users can type immediately. aria-live
        // is already "polite" from the end of the first open.
        scrollEnd();
        focusInput(true);
        return;
      }
      opened = true;

      // first open: autotype `gian --stack` then print its output. Keep
      // aria-live "off" for the whole demo (mount() already set it) so the
      // ~30 staggered lines don't flood AT users; flip to "polite" right
      // before handing the caret to the user, same moment in both branches.
      var firstCmd = "gian --stack";
      var def = td.commands && td.commands[firstCmd];

      // Cold-load fix: a fresh dark screen with only a blinking cursor reads
      // as broken for the ~0.5-0.9s the autotype takes to finish "gian
      // --stack" (typeInto is 38-68ms/char). Print a boot line into the
      // scrollback synchronously, same tick as mount, so first paint always
      // shows live content — the typewriter then plays out underneath it,
      // not into an empty room.
      appendLine("last login: " + bootStamp() + " on ttys000", "dim");
      scrollEnd();

      if (REDUCED) {
        // instant mode: dump everything immediately
        if (def) {
          appendLine((td.user || "gian") + "@" + (td.host || "aveiro") + " ~ % " + firstCmd, "cmd");
          (def || []).forEach(function (entry) {
            var text = typeof entry === "string" ? entry : (entry.text || "");
            var cls  = typeof entry === "object" ? (entry.cls || null) : null;
            appendLine(text, cls);
          });
          appendSpacer();
        }
        scrollEnd();
        setAriaLive("polite");
        focusInput(true);
        return;
      }

      // animate: typeInto the prompt buffer, then print output line by line.
      // Joins the exec queue so chips tapped mid-autotype wait their turn.
      // The boot line above already gave first paint real content, so the
      // typewriter reads as "a session picking up", brisk not draggy.
      if (!bufferSpan) return;
      execChain = execChain.then(function () {
        return GG.Util.typeInto(bufferSpan, firstCmd).then(function () {
          // brief pause, then clear buffer and execute
          return new Promise(function (r) { setTimeout(r, 120); });
        }).then(function () {
          setBuffer("");
          appendSpacer();
          return printOutput(firstCmd, def || []);
        }).then(function () {
          appendSpacer();
          trimScrollback();
          // Autotype done — hand the caret to the user for real input, and
          // start announcing output live from here on.
          setAriaLive("polite");
          focusInput(true);
        });
      });
    },

    onClose: function () {
      syncMetaRestore();
      // state (scrollback) is preserved for re-open; nothing to tear down
    }
  });

})();
