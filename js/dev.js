/* =========================================================================
   GianOS — developer mode (the easter egg)
   Authentic Android mechanics: tap Settings → Build number seven times
   (countdown toasts from the real OS copy) to become a developer. Unlocking
   reveals Developer options — Show layout bounds, Profile frame rate, and
   Animator duration scale — and adds a Terminal app to the home screen.
   Everything persists in localStorage.

   Security note: terminal output is plain text via textContent; the typed
   command is the only user input on the whole site and is never rendered
   as HTML.
   ========================================================================= */
window.OSDev = (function () {
  "use strict";

  var U = window.OSUtil;
  var el = U.el;
  var sys = window.OSSystem;
  var data = window.GIAN_OS;

  var TAPS_NEEDED = 7;
  var taps = 0;

  /* ------------------------------------------------------- persistence */
  function isDev() {
    try { return localStorage.getItem("gianos-dev") === "1"; } catch (e) { return false; }
  }
  function loadOpts() {
    try { return JSON.parse(localStorage.getItem("gianos-devopts")) || {}; } catch (e) { return {}; }
  }
  function saveOpts(o) {
    try { localStorage.setItem("gianos-devopts", JSON.stringify(o)); } catch (e) {}
  }
  var opts = loadOpts(); // { bounds: bool, fps: bool, anim: number }

  /* ------------------------------------------------------- the options */
  var ANIM_STEPS = [1, 5, 10, 0.5];

  function applyBounds(on) {
    document.documentElement.classList.toggle("dev-bounds", !!on);
  }

  var fpsEl = null, fpsRaf = 0;
  function applyFps(on) {
    if (on) {
      if (!fpsEl) {
        fpsEl = el("div", "fpsmeter");
        fpsEl.setAttribute("aria-hidden", "true");
        document.getElementById("device").appendChild(fpsEl);
      }
      fpsEl.hidden = false;
      var frames = 0, last = performance.now();
      (function loop(t) {
        frames++;
        if (t - last >= 500) {
          var fps = Math.round(frames * 1000 / (t - last));
          fpsEl.textContent = fps + " fps";
          fpsEl.classList.toggle("is-low", fps < 50);
          frames = 0; last = t;
        }
        fpsRaf = requestAnimationFrame(loop);
      })(last);
    } else {
      if (fpsRaf) cancelAnimationFrame(fpsRaf);
      fpsRaf = 0;
      if (fpsEl) fpsEl.hidden = true;
    }
  }

  function applyAnim(scale) {
    U.setMotionScale(scale || 1);
  }

  function applyAll() {
    if (!isDev()) return;
    if (opts.bounds) applyBounds(true);
    if (opts.fps) applyFps(true);
    if (opts.anim && opts.anim !== 1) applyAnim(opts.anim);
  }

  /* --------------------------------------------------- settings wiring */
  function bindSettings(view) {
    var rm = view.querySelector("#rmStatus");
    if (rm) rm.textContent = U.REDUCED ? "on (system)" : "off";

    var group = view.querySelector("#devGroup");
    if (isDev() && group) showDevGroup(group, view);

    var buildRow = view.querySelector("#buildRow");
    if (buildRow) buildRow.addEventListener("click", function () {
      sys.haptic("tap");
      if (isDev()) { U.toast(data.dev.toasts.already); return; }
      taps++;
      var left = TAPS_NEEDED - taps;
      if (left <= 0) {
        try { localStorage.setItem("gianos-dev", "1"); } catch (e) {}
        sys.haptic("open");
        U.toast(data.dev.toasts.done);
        if (group) showDevGroup(group, view);
        if (window.OSHome) window.OSHome.refresh(); // the Terminal icon pops in
      } else if (left <= 4) {
        var msg = data.dev.toasts.step.replace("{n}", String(left));
        if (left === 1) msg = msg.replace("steps", "step");
        U.toast(msg);
      }
    });
  }

  function showDevGroup(group, view) {
    group.hidden = false;

    var bounds = view.querySelector('[data-devopt="bounds"]');
    var fps = view.querySelector('[data-devopt="fps"]');
    var anim = view.querySelector('[data-devopt="animator"]');
    var animLabel = view.querySelector("#animScale");

    function syncToggle(btn, on) {
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.classList.toggle("is-on", !!on);
    }
    syncToggle(bounds, opts.bounds);
    syncToggle(fps, opts.fps);
    if (animLabel) animLabel.textContent = (opts.anim || 1) + "×";

    bounds.addEventListener("click", function () {
      sys.haptic("select");
      opts.bounds = !opts.bounds;
      applyBounds(opts.bounds);
      syncToggle(bounds, opts.bounds);
      saveOpts(opts);
    });
    fps.addEventListener("click", function () {
      sys.haptic("select");
      opts.fps = !opts.fps;
      applyFps(opts.fps);
      syncToggle(fps, opts.fps);
      saveOpts(opts);
    });
    anim.addEventListener("click", function () {
      sys.haptic("select");
      var i = ANIM_STEPS.indexOf(opts.anim || 1);
      opts.anim = ANIM_STEPS[(i + 1) % ANIM_STEPS.length];
      applyAnim(opts.anim);
      if (animLabel) animLabel.textContent = opts.anim + "×";
      saveOpts(opts);
    });
  }

  /* ------------------------------------------------------ the terminal */
  function renderTerminal(view) {
    var content = view.querySelector(".app__content");
    if (!content) return;

    var term = el("div", "term");
    var out = el("div", "term__out");
    out.setAttribute("aria-live", "polite");
    var form = el("form", "term__line");
    var ps1 = el("span", "term__ps1", "gian@gianos:~$");
    var input = document.createElement("input");
    input.className = "term__input";
    input.type = "text";
    input.autocomplete = "off";
    input.autocapitalize = "off";
    input.spellcheck = false;
    input.setAttribute("aria-label", "Terminal command");
    form.appendChild(ps1);
    form.appendChild(input);
    term.appendChild(out);
    term.appendChild(form);
    content.appendChild(term);

    function print(text, cls) {
      var line = document.createElement("pre");
      line.className = "term__txt" + (cls ? " " + cls : "");
      line.textContent = text;
      out.appendChild(line);
      term.scrollTop = term.scrollHeight;
      var scroll = view.querySelector(".app__scroll");
      if (scroll) scroll.scrollTop = scroll.scrollHeight;
    }

    print(data.dev.terminal.motd);

    var APPS = data.apps.filter(function (a) { return !a.hidden || isDev(); })
      .map(function (a) { return a.id; });

    var CMDS = {
      help: function () {
        print("available commands:\n  help        this list\n  whoami      who is gian\n  uname -a    system info\n  ls /apps    list the apps\n  open <app>  open one (try: open contact)\n  cat README  how this site is built\n  neofetch    the obligatory one\n  clear       clear the screen\n  exit        back to home");
      },
      whoami: function () { print(data.dev.terminal.whoami); },
      uname: function () { print(data.dev.terminal.uname); },
      ls: function () { print(APPS.join("  ")); },
      cat: function (arg) {
        if ((arg || "").toLowerCase() === "readme") print(data.dev.terminal.readme);
        else print("cat: " + (arg || "") + ": no such file");
      },
      open: function (arg) {
        if (arg && APPS.indexOf(arg) !== -1) {
          print("opening " + arg + "…");
          setTimeout(function () { window.OSApps.open(arg, null, { instant: true }); }, 350);
        } else {
          print("open: " + (arg || "(nothing)") + ": not an app — try `ls /apps`");
        }
      },
      neofetch: function () {
        print(
          "        _\n   __ _(_)__ _ _ _\n  / _` | / _` | ' \\\n  \\__, |_\\__,_|_||_|\n  |___/\n\n" +
          "  gian@gianos\n  -----------\n" +
          "  OS:      GianOS 1.0\n" +
          "  Host:    Cloudflare Pages\n" +
          "  Kernel:  vanilla-js #nobuild\n" +
          "  Shell:   gsh 1.0\n" +
          "  Uptime:  shipping since 2017\n" +
          "  Locale:  es_ES · pt_PT · en_GB\n" +
          "  WM:      View Transitions\n" +
          "  Theme:   warm paper");
      },
      clear: function () { U.setHtml(out, ""); },
      exit: function () { print("logout"); setTimeout(function () { window.OSApps.close(); }, 250); }
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var raw = input.value.trim();
      input.value = "";
      if (!raw) return;
      print("gian@gianos:~$ " + raw, "term__txt--echo");
      var parts = raw.split(/\s+/);
      var cmd = parts[0].toLowerCase();
      var arg = parts.slice(1).join(" ").replace(/^\/apps\/?/, "").replace(/^-a$/, "");
      if (cmd === "uname") { CMDS.uname(); return; }
      if (CMDS[cmd]) CMDS[cmd](arg);
      else print("gsh: " + cmd + ": command not found — try `help`");
    });

    term.addEventListener("click", function () { input.focus(); });
    setTimeout(function () { input.focus(); }, U.REDUCED ? 0 : 450);
  }

  function init() { applyAll(); }

  return {
    init: init,
    isDev: isDev,
    bindSettings: bindSettings,
    renderTerminal: renderTerminal
  };
})();
