/* =========================================================================
   GianOS — Terminal app
   Vanilla JS, no dependencies. Registers the Terminal app with GG.Apps.

   A fake shell: scrollback log + prompt row + suggested-command chips.
   Supports physical keyboard input when the terminal is focused: keydown
   builds a buffer rendered into the prompt display span; Enter executes,
   Backspace works, Tab cycles suggestions.

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
  var bufferSpan  = null;  // .term-input-buffer
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
  // -------------------------------------------------------------------------
  function updateBuffer() {
    if (bufferSpan) bufferSpan.textContent = keyBuf;
  }

  function handleKey(e) {
    // only handle when the terminal screen is active
    if (!screenEl || !screenEl.classList.contains("screen--active")) return;

    var suggestions = td.suggested || [];

    switch (e.key) {
      case "Enter":
        e.preventDefault();
        var cmd = keyBuf;
        keyBuf = ""; tabIdx = -1; updateBuffer();
        execute(cmd);
        break;

      case "Backspace":
        e.preventDefault();
        if (keyBuf.length > 0) {
          keyBuf = keyBuf.slice(0, -1);
          updateBuffer();
        }
        break;

      case "Tab":
        e.preventDefault();
        if (!suggestions.length) break;
        tabIdx = (tabIdx + 1) % suggestions.length;
        keyBuf = suggestions[tabIdx];
        updateBuffer();
        break;

      default:
        // printable single characters
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          // Space would otherwise activate a focused chip button (re-running
          // its command and clearing the buffer) or scroll the page.
          if (e.key === " ") e.preventDefault();
          tabIdx = -1;
          keyBuf += e.key;
          updateBuffer();
        }
        break;
    }
  }

  // -------------------------------------------------------------------------
  // Chip interaction
  // -------------------------------------------------------------------------
  function runChip(cmd) {
    keyBuf = ""; tabIdx = -1; updateBuffer();
    execute(cmd);
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

    // --- scrollback log ---------------------------------------------------
    scrollback = document.createElement("div");
    scrollback.className = "term-scrollback";
    scrollback.setAttribute("role", "log");
    scrollback.setAttribute("aria-live", "polite");
    scrollback.setAttribute("aria-label", "Terminal output");
    body.appendChild(scrollback);

    // --- prompt row -------------------------------------------------------
    var promptRow = document.createElement("div");
    promptRow.className = "term-prompt-row";

    var prefix = document.createElement("span");
    prefix.className = "term-prompt-prefix";
    prefix.setAttribute("aria-hidden", "true");
    prefix.textContent = (td.user || "gian") + "@" + (td.host || "aveiro") + " ~ %";

    bufferSpan = document.createElement("span");
    bufferSpan.className = "term-input-buffer";
    bufferSpan.setAttribute("aria-hidden", "true");  // screen reader uses role=log
    bufferSpan.textContent = "";

    var cursor = document.createElement("span");
    cursor.className = "term-cursor";
    cursor.setAttribute("aria-hidden", "true");

    promptRow.appendChild(prefix);
    promptRow.appendChild(bufferSpan);
    promptRow.appendChild(cursor);
    body.appendChild(promptRow);

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

    // keyboard listener on the document — only acts when terminal is active
    document.addEventListener("keydown", handleKey);
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
        // re-open: just scroll to bottom (state preserved)
        scrollEnd();
        return;
      }
      opened = true;

      // first open: autotype `gian --stack` then print its output
      var firstCmd = "gian --stack";
      var def = td.commands && td.commands[firstCmd];

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
        return;
      }

      // animate: typeInto the prompt buffer, then print output line by line.
      // Joins the exec queue so chips tapped mid-autotype wait their turn.
      if (!bufferSpan) return;
      execChain = execChain.then(function () {
        return GG.Util.typeInto(bufferSpan, firstCmd).then(function () {
          // brief pause, then clear buffer and execute
          return new Promise(function (r) { setTimeout(r, 180); });
        }).then(function () {
          keyBuf = ""; bufferSpan.textContent = "";
          appendSpacer();
          return printOutput(firstCmd, def || []);
        }).then(function () {
          appendSpacer();
          trimScrollback();
        });
      });
    },

    onClose: function () {
      syncMetaRestore();
      // state (scrollback) is preserved for re-open; nothing to tear down
    }
  });

})();
