/* =========================================================================
   GianOS — core layer
   Vanilla JS, no dependencies. Defines window.GG: Util, Platform (ex-OS),
   LA, Apps, Shell.

   Security note: every HTML fragment rendered here is authored content from
   data.js (trusted, shipped with the site). There is no user-generated input:
   the composer field is readonly and the only dynamic string (a question
   label, also from data.js) is passed through escapeHtml() before insertion.
   ========================================================================= */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var data = window.ASK_DATA || { prompts: [] };

  var clockEl = document.getElementById("clock");

  /* ---------------------------------------------------------------- clock */
  function tick() {
    var d = new Date();
    var h = d.getHours(), m = d.getMinutes();
    clockEl.textContent = h + ":" + (m < 10 ? "0" + m : m);
  }

  /* ----------------------------------------------------------- utilities */
  // setHtml centralizes authored-fragment insertion (see security note above).
  function setHtml(node, markup) { node.innerHTML = markup; return node; }

  function el(tag, cls, markup) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (markup != null) setHtml(n, markup);
    return n;
  }
  function delay(ms) { return new Promise(function (r) { setTimeout(r, REDUCED ? 0 : ms); }); }

  function scrollInto(node) {
    if (!node) return;
    node.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "nearest" });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* -------------------------------------------------- count-up animation */
  function animateCount(node) {
    var target = parseFloat(node.getAttribute("data-count"));
    var suffix = node.getAttribute("data-suffix") || "";
    var divide = parseFloat(node.getAttribute("data-divide") || "1");
    if (REDUCED || !target) return;

    function shown(v) {
      var n = v / divide;
      var s = (divide >= 1000000 && n < 10) ? n.toFixed(1).replace(/\.0$/, "") : Math.round(n).toString();
      return s + suffix;
    }
    var dur = 1100, start = null;
    node.textContent = shown(0);
    function frame(t) {
      if (start == null) start = t;
      var p = Math.min((t - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      node.textContent = shown(target * eased);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* --------------------------------------------------- reveal on scroll */
  var io = ("IntersectionObserver" in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      e.target.querySelectorAll("[data-count]").forEach(animateCount);
      io.unobserve(e.target);
    });
  }, { threshold: 0.18 }) : null;

  function observe(node) {
    if (io && !REDUCED) { node.classList.add("reveal"); io.observe(node); }
    else { node.querySelectorAll("[data-count]").forEach(animateCount); }
  }

  /* ---------------- progressive text reveal over an authored fragment ---- */
  // Walk text nodes, blank them, then refill in small chunks with a trailing
  // block cursor. Markup (highlights, cards, links) stays intact.
  function streamText(rootEl, anchor) {
    return new Promise(function (resolve) {
      // Visual modules marked .pop are held back during the text stream, then
      // revealed as whole units afterward for a staggered payoff.
      var pops = Array.prototype.slice.call(rootEl.querySelectorAll(".pop"));

      function finish() {
        revealPops(pops, anchor || rootEl);
        resolve();
      }

      if (REDUCED) {
        rootEl.querySelectorAll("[data-count]").forEach(animateCount);
        pops.forEach(function (p) { p.classList.add("in"); });
        resolve(); return;
      }

      var nodes = [];
      (function walk(n) {
        for (var c = n.firstChild; c; c = c.nextSibling) {
          if (c.nodeType === 1 && c.classList && c.classList.contains("pop")) continue; // skip pop subtrees
          if (c.nodeType === 3 && c.nodeValue.trim() !== "") nodes.push(c);
          else if (c.nodeType === 1) walk(c);
        }
      })(rootEl);

      var full = nodes.map(function (t) { return t.nodeValue; });
      nodes.forEach(function (t) { t.nodeValue = ""; });

      var cursor = el("span", "stream-cursor");
      rootEl.appendChild(cursor);

      var i = 0, pos = 0;
      (function step() {
        if (i >= nodes.length) {
          cursor.remove();
          rootEl.querySelectorAll("[data-count]").forEach(animateCount);
          finish();
          return;
        }
        var s = full[i], end = Math.min(pos + 3, s.length);
        nodes[i].nodeValue = s.slice(0, end);
        pos = end;
        if (pos >= s.length) { i++; pos = 0; }
        scrollInto(anchor || rootEl);
        setTimeout(function () { requestAnimationFrame(step); }, 13);
      })();
    });
  }

  // Stagger-reveal the visual modules of an answer, counting up any numbers.
  function revealPops(pops, anchor) {
    pops.forEach(function (p, idx) {
      setTimeout(function () {
        p.classList.add("in");
        p.querySelectorAll("[data-count]").forEach(animateCount);
        scrollInto(anchor);
      }, REDUCED ? 0 : 90 + idx * 110);
    });
  }

  /* -------------------------------------------------------- hero opener */
  // Type a string into an element character by character. The opening
  // question appears to type itself straight into the outgoing bubble
  // (the chat is chip-driven now, so there is no text input to type into).
  function typeInto(node, text) {
    return new Promise(function (resolve) {
      if (REDUCED) { node.textContent = text; resolve(); return; }
      node.textContent = "";
      var i = 0;
      (function t() {
        if (i > text.length) { resolve(); return; }
        node.textContent = text.slice(0, i++);
        scrollInto(node);
        setTimeout(t, 38 + Math.random() * 30);
      })();
    });
  }

  function canMorph() {
    return !REDUCED && typeof document.startViewTransition === "function";
  }

  /* ===================================================================
     OS-feature layer (overdrive). The device behaves like a real OS;
     each beat fires a native feature of the selected platform. The Live
     Activity (iOS Dynamic Island / Android Live Update status chip) is the
     spine: it tracks the broad story path. Chrome only, the chat content and
     clay-red brand are untouched.

     All fragments below are authored/trusted (static strings + data.js),
     and the only dynamic values are passed through escapeHtml(). Insertion
     goes through setHtml()/el(), the same audited path as the rest of the
     file (see security note at top).
     =================================================================== */
  var liveact  = document.getElementById("liveact");
  var laTitle  = document.getElementById("liveactTitle");
  var laSub    = document.getElementById("liveactSub");
  var laTrail  = document.getElementById("liveactTrail");
  var laExpand = document.getElementById("liveactExpand");
  var osSwitch = document.getElementById("osSwitch");

  // -- Live Activity controller (the story spine) -------------------------
  var LA = {
    last: null,
    setProg: function (p) { if (liveact) liveact.style.setProperty("--prog", p || 0); },
    bump: function (cls) { if (REDUCED || !liveact) return; liveact.classList.remove(cls); void liveact.offsetWidth; liveact.classList.add(cls); },
    wake: function () { this.bump("liveact--wake"); },
    app: function (a) {
      if (!liveact) return;
      liveact.classList.remove("liveact--progress", "liveact--expanded");
      var label = (a && a.label) || "ask gianfranco";
      laTitle.textContent = (a && a.short) || "ask";
      laSub.hidden = true; laTrail.hidden = true;
      this.setProg(0);
      liveact.setAttribute("aria-label", label + ", live");
    },
    work: function (a) {
      if (!liveact) return;
      this.last = a;
      var pct = Math.round((a.progress || 0) * 100);
      liveact.classList.add("liveact--progress");
      laTitle.textContent = a.short || (pct ? pct + "%" : "live");
      laSub.hidden = false; laSub.textContent = a.label || a.state || "";
      laTrail.hidden = false;
      this.setProg(a.progress);
      liveact.setAttribute("aria-label",
        ((data.activity && data.activity.title) || "Work in motion") +
        ", " + (a.label || a.state || "in progress") +
        (pct ? ", " + pct + "% progress" : ""));
      this.bump("liveact--pulse");
      if (a.expand) this.openExpand(); else this.closeExpand();
    },
    fillExpand: function () {
      var a = this.last || {};
      var pct = Math.round((a.progress || 0) * 100);
      setHtml(laExpand,
        "<div class='liveact__ehead'><span>" + escapeHtml((data.activity && data.activity.org) || "") + "</span><span>Live Update</span></div>" +
        "<div class='liveact__etitle'>" + escapeHtml((data.activity && data.activity.title) || "Work in motion") + "</div>" +
        "<div class='liveact__estate'>" + escapeHtml(a.label || a.state || "in progress") + " · " + pct + "%</div>" +
        "<div class='liveact__etrack' style='--pct:" + pct + "%'><span></span></div>" +
        "<div class='liveact__erow'><span class='liveact__ev'>Shared context</span><span class='liveact__es'>building</span></div>" +
        "<div class='liveact__erow'><span class='liveact__ev'>Tradeoffs</span><span class='liveact__es'>visible</span></div>" +
        "<div class='liveact__erow'><span class='liveact__ev'>Next step</span><span class='liveact__es'>clearer</span></div>");
      laExpand.hidden = false;
    },
    openExpand: function () {
      if (!liveact || !liveact.classList.contains("liveact--progress")) return;
      this.fillExpand();
      var r = liveact;
      requestAnimationFrame(function () { r.classList.add("liveact--expanded"); });
      clearTimeout(this._ct);
      var self = this;
      this._ct = setTimeout(function () { self.closeExpand(); }, REDUCED ? 0 : 3400);
    },
    closeExpand: function () { if (liveact) liveact.classList.remove("liveact--expanded"); },
    toggle: function () {
      if (!liveact || !liveact.classList.contains("liveact--progress")) return;
      if (liveact.classList.contains("liveact--expanded")) this.closeExpand();
      else this.openExpand();
    }
  };
  if (liveact) liveact.addEventListener("click", function () { LA.toggle(); });

  // -- the OS module (Platform) -------------------------------------------
  var Platform = {
    cur: "ios",
    btns: osSwitch ? Array.prototype.slice.call(osSwitch.querySelectorAll(".os-switch__btn")) : [],
    detect: function () {
      var ua = navigator.userAgent || "";
      if (/Android/i.test(ua)) return "android";
      if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
      return "ios"; // desktop default: the Dynamic Island is the headline demo
    },
    apply: function (os) {
      this.cur = os;
      document.body.setAttribute("data-os", os);
      this.btns.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-os") === os ? "true" : "false"); });
    },
    set: function (os) {
      if (os === this.cur) return;
      this.apply(os);
      try { localStorage.setItem("ask-os", os); } catch (e) {}
    },
    init: function () {
      var saved = null;
      try { saved = localStorage.getItem("ask-os"); } catch (e) {}
      this.apply(saved || this.detect());
      var self = this;
      this.btns.forEach(function (b) {
        b.addEventListener("click", function () { self.set(b.getAttribute("data-os")); });
      });
    },
    hero: function () { LA.app(data.heroActivity); LA.wake(); }
  };

  /* ---------------------------------------------------------------- Apps */
  var _appsRegistry = {};

  var Apps = {
    register: function (def) {
      // def: { id, mount, onOpen, onClose, la }
      _appsRegistry[def.id] = def;
    },
    get: function (id) {
      return _appsRegistry[id] || null;
    },
    ids: function () {
      return Object.keys(_appsRegistry);
    },
    // Lazy-mount on first open, then fire lifecycle. Returns the def or null.
    ensure: function (id) {
      var app = _appsRegistry[id];
      if (!app) return null;
      if (!app._mounted && app.mount) { app.mount(); app._mounted = true; }
      return app;
    }
  };

  /* ===================================================================
     Shell — home screen + app open/close lifecycle + hash router.

     Single source of truth is location.hash:
       ""            -> home screen
       "#m/<appid>"  -> app <appid> open
     open()/goHome() only set the hash; ALL transitions run in the one
     hashchange handler via transitionTo(). Browser/hardware back therefore
     closes an app for free. Deep links (#m/messages on load) open directly.
     =================================================================== */
  var homescreen = document.getElementById("homescreen");
  var navind     = document.getElementById("navind") || document.querySelector(".navind");

  var Shell = (function () {
    var current = null;        // currently open app id, or null at home
    var transitioning = false; // guard against re-entrant hashchange storms
    var hasPending = false;    // a hashchange arrived mid-transition; re-route after
    var homeShown = false;     // first home reveal triggers the stagger-in
    var lastFocusedIcon = null;// icon to restore focus to on close

    function screenForApp(id) {
      return document.querySelector('.app-screen[data-app="' + id + '"]');
    }
    function iconForApp(id) {
      return document.querySelector('.appicon[data-app="' + id + '"]');
    }

    // Parse the hash into a target app id, or null for home. Unknown/unregistered
    // ids fall back to home (honest grid: only registered apps can open).
    function targetFromHash() {
      var h = location.hash || "";
      var m = /^#m\/([a-z0-9_-]+)$/i.exec(h);
      if (!m) return null;
      var id = m[1];
      return Apps.get(id) ? id : null;
    }

    // ---- the one transition helper ------------------------------------
    // Moves from whichever screen is active to `toEl`, optionally morphing
    // from/to the shared icon element via a View Transition. fromEl/toEl are
    // the .homescreen or an .app-screen; sharedIconEl is the launching icon
    // (open) or the target icon (close).
    function transitionTo(fromEl, toEl, sharedIconEl, reverse) {
      function swap() {
        if (fromEl) fromEl.classList.remove("screen--active");
        toEl.classList.add("screen--active");
      }

      if (!canMorph() || !sharedIconEl) {
        // fallback: instant toggle + a short opacity/scale on the incoming screen
        swap();
        if (!REDUCED) {
          toEl.classList.remove("screen-enter");
          void toEl.offsetWidth;          // restart the animation
          toEl.classList.add("screen-enter");
        }
        return null;                       // no View Transition ran
      }

      // View Transition zoom-from-icon. On open the icon morphs into the screen;
      // on close the screen morphs back to the icon. Same shared name on both
      // captured states is what the browser tweens.
      var screenEl = reverse ? fromEl : toEl;
      sharedIconEl.style.viewTransitionName = "app-zoom";
      screenEl.style.viewTransitionName = "app-zoom";

      var vt = document.startViewTransition(swap);
      vt.finished.catch(function () {}).then(function () {
        sharedIconEl.style.viewTransitionName = "";
        screenEl.style.viewTransitionName = "";
      });
      return vt;                           // caller can await vt.finished
    }

    function activeScreenEl() {
      if (current) return screenForApp(current);
      return homescreen;
    }

    // Move focus to `el`, deferred so it does not fight the swap animation.
    // Reduced motion: instant. If a View Transition ran, wait for vt.finished
    // (~450ms) so the focus ring lands once the morph settles instead of
    // jumping mid-animation. Otherwise a short timeout covers the fallback path.
    function deferFocus(el, vt) {
      if (!el) return;
      function go() { try { el.focus({ preventScroll: true }); } catch (e) { try { el.focus(); } catch (e2) {} } }
      if (REDUCED) { go(); return; }
      if (vt && vt.finished) { vt.finished.catch(function () {}).then(go); return; }
      setTimeout(go, 60);
    }

    // ---- show the home grid -------------------------------------------
    function showHome(fromId, useTransition) {
      var fromEl = fromId ? screenForApp(fromId) : activeScreenEl();
      var icon = fromId ? iconForApp(fromId) : null;

      homescreen.hidden = false;          // un-hide once JS owns visibility
      document.body.removeAttribute("data-app");

      var vt = null;
      if (useTransition) {
        // reverse morph: the closing app-screen zooms back into its icon
        vt = transitionTo(fromEl, homescreen, icon, true);
      } else {
        if (fromEl) fromEl.classList.remove("screen--active");
        homescreen.classList.add("screen--active");
      }

      // first reveal: stagger the icons in (reuses the .pop idiom)
      if (!homeShown) {
        homeShown = true;
        staggerHomeIcons();
      }
      // notify the app it closed, then restore focus to its icon. Defer the
      // focus call past the (async) View Transition swap so the icon is visible
      // (display:none elements cannot take focus).
      if (fromId) {
        var def = Apps.get(fromId);
        if (def && def.onClose) def.onClose();
      }
      var restore = lastFocusedIcon;
      lastFocusedIcon = null;
      deferFocus(restore, vt);
      current = null;
    }

    // ---- open an app ---------------------------------------------------
    function openApp(id, useTransition) {
      var def = Apps.ensure(id);
      if (!def) { showHome(current, useTransition); return; } // unknown -> home
      if (current === id) return;          // already open: no-op

      var toEl = screenForApp(id);
      if (!toEl) return;
      var fromEl = activeScreenEl();
      var icon = iconForApp(id);
      lastFocusedIcon = icon || lastFocusedIcon;

      // app-to-app switch: tear down the outgoing app first. Without this its
      // onClose never fires (the swap only flips screen--active), so the app
      // never learns it lost the foreground.
      if (current && current !== id) {
        var prevDef = Apps.get(current);
        if (prevDef && prevDef.onClose) prevDef.onClose();
        var prevEl = screenForApp(current);
        if (prevEl) prevEl.classList.remove("screen--active");
      }

      homescreen.hidden = false;           // keep it mounted behind
      document.body.setAttribute("data-app", id);

      var vt = transitionTo(fromEl, toEl, icon, false);

      current = id;
      if (def.onOpen) def.onOpen();
      // focus management: move focus into the app (back button or title)
      focusInto(toEl, vt);
    }

    function focusInto(screenEl, vt) {
      if (!screenEl) return;
      var target = screenEl.querySelector(".app-head__back") ||
                   screenEl.querySelector(".app-head__title");
      if (!target) return;
      // titles are not natively focusable; make them programmatically focusable
      if (target.classList.contains("app-head__title") && !target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
      }
      // defer past the View Transition so focus does not fight the animation
      deferFocus(target, vt);
    }

    // ---- the single hashchange handler --------------------------------
    function route(useTransition) {
      // mid-transition: remember that the hash moved and re-route once it settles
      // (we always re-read the live hash on drain, so intermediate churn collapses)
      if (transitioning) { hasPending = true; return; }
      transitioning = true;

      var target = targetFromHash();
      if (target) openApp(target, useTransition);
      else showHome(current, useTransition);

      // let the transition settle, then drain any hash change that arrived
      // mid-flight (re-entrant guard: we ignore intermediate churn, apply last)
      var settle = (canMorph() ? 480 : (REDUCED ? 0 : 320));
      setTimeout(function () {
        transitioning = false;
        if (hasPending) { hasPending = false; route(true); }
      }, settle);
    }

    // ---- home grid: honesty + interactivity ---------------------------
    var gridIcons = [];        // visible (registered) icons, in DOM order
    var rovingIdx = 0;

    function syncGridHonesty() {
      // Reveal only icons whose app id is in the registry; hide the rest so the
      // grid never advertises an app that has not shipped.
      var all = Array.prototype.slice.call(homescreen.querySelectorAll(".appicon"));
      gridIcons = [];
      all.forEach(function (icon) {
        var id = icon.getAttribute("data-app");
        if (Apps.get(id)) { icon.hidden = false; gridIcons.push(icon); }
        else { icon.hidden = true; }
      });
    }

    function wireGrid() {
      gridIcons.forEach(function (icon, i) {
        icon.setAttribute("tabindex", i === 0 ? "0" : "-1");
        icon.addEventListener("click", function () {
          lastFocusedIcon = icon;
          GG.Shell.open(icon.getAttribute("data-app"));
        });
        icon.addEventListener("focus", function () { setRoving(i); });
      });

      // roving tabindex: arrow keys move focus across the grid; Enter/Space open
      homescreen.addEventListener("keydown", function (e) {
        if (!gridIcons.length) return;
        var cols = 4, n = gridIcons.length, idx = rovingIdx, next = idx;
        switch (e.key) {
          case "ArrowRight": next = Math.min(idx + 1, n - 1); break;
          case "ArrowLeft":  next = Math.max(idx - 1, 0); break;
          case "ArrowDown":  next = Math.min(idx + cols, n - 1); break;
          case "ArrowUp":    next = Math.max(idx - cols, 0); break;
          case "Home":       next = 0; break;
          case "End":        next = n - 1; break;
          case "Enter":
          case " ":
            e.preventDefault();
            gridIcons[idx].click();
            return;
          default: return;
        }
        e.preventDefault();
        setRoving(next);
        gridIcons[next].focus();
      });
    }

    function setRoving(i) {
      rovingIdx = i;
      gridIcons.forEach(function (icon, j) { icon.setAttribute("tabindex", j === i ? "0" : "-1"); });
    }

    function staggerHomeIcons() {
      if (REDUCED) return;
      gridIcons.forEach(function (icon, i) {
        icon.classList.add("pop");
        setTimeout(function () { icon.classList.add("in"); }, 60 + i * 55);
      });
    }

    // ---- home control: navind (click / Escape / swipe-up) -------------
    function wireHomeControl() {
      if (navind) {
        navind.addEventListener("click", function () { GG.Shell.goHome(); });

        // swipe-up on the navind: a simple touchstart/touchend deltaY check
        var ty0 = null;
        navind.addEventListener("touchstart", function (e) {
          ty0 = e.touches && e.touches[0] ? e.touches[0].clientY : null;
        }, { passive: true });
        navind.addEventListener("touchend", function (e) {
          if (ty0 == null) return;
          var t = e.changedTouches && e.changedTouches[0];
          if (t && (ty0 - t.clientY) > 24) GG.Shell.goHome();
          ty0 = null;
        }, { passive: true });
      }

      // each app-screen's back chevron also goes home
      Array.prototype.slice.call(document.querySelectorAll(".app-head__back"))
        .forEach(function (b) { b.addEventListener("click", function () { GG.Shell.goHome(); }); });

      // Escape anywhere closes the open app
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && document.body.hasAttribute("data-app")) {
          GG.Shell.goHome();
        }
      });
    }

    return {
      boot: function () {
        tick(); setInterval(tick, 15000);
        Platform.init();

        syncGridHonesty();
        wireGrid();
        wireHomeControl();

        window.addEventListener("hashchange", function () { route(true); });

        // initial route: deep link opens its app with no transition, else home
        var initial = targetFromHash();
        if (initial) {
          route(false);          // open directly, no zoom on first paint
        } else {
          showHome(null, false); // land on the home grid
        }
      },

      // open()/goHome() are the only public navigation entry points; they just
      // move the hash and let the hashchange handler do the work. On open we
      // also handle the in-page case where the hash is already set.
      open: function (id) {
        if (!Apps.get(id)) return;
        var want = "#m/" + id;
        if (location.hash === want) { route(true); return; } // same hash: drive directly
        location.hash = want;
      },
      goHome: function () {
        // already home (no app hash): drive a route directly (handles first
        // reveal / no-op cases); otherwise clear the hash, which fires
        // hashchange -> route() -> the app closes with a reverse zoom.
        if (!targetFromHash()) { route(true); return; }
        location.hash = "";
      }
    };
  })();

  /* ---------------------------------------------------------------- expose */
  window.GG = {
    REDUCED: REDUCED,
    data: data,
    Util: {
      el: el,
      setHtml: setHtml,
      escapeHtml: escapeHtml,
      delay: delay,
      scrollInto: scrollInto,
      animateCount: animateCount,
      observe: observe,
      streamText: streamText,
      revealPops: revealPops,
      typeInto: typeInto,
      canMorph: canMorph
    },
    Platform: Platform,
    LA: LA,
    Apps: Apps,
    Shell: Shell
  };
})();
