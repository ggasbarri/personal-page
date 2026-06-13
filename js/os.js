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

  var clockEl   = document.getElementById("clock");
  var lockTimeEl = document.getElementById("lockTime");
  var lockDateEl = document.getElementById("lockDate");

  /* ---------------------------------------------------------------- clock */
  // Day abbreviations for the lock-screen date line (locked screen shows date).
  var DAYS   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function tick() {
    var d = new Date();
    var h = d.getHours(), m = d.getMinutes();
    var timeStr = h + ":" + (m < 10 ? "0" + m : m);
    if (clockEl) clockEl.textContent = timeStr;
    if (lockTimeEl) lockTimeEl.textContent = timeStr;
    if (lockDateEl) {
      lockDateEl.textContent = DAYS[d.getDay()] + ", " + MONTHS[d.getMonth()] + " " + d.getDate();
    }
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
  // extend LA with discovery-mode and push/restore for in-app story beats
  LA._discoverState = null;  // last applied discovery state {done,total}
  LA._pushed = null;         // snapshot of last.* before Messages took over

  // push(): called on app open; snapshots _discoverState and clears it so
  // in-app fillExpand calls (story beats) use the original work template.
  LA.push = function () {
    this._pushed = this._discoverState || null;
    this._discoverState = null;  // suppress discovery template while app is active
  };

  // restore(): called on app close; re-applies discovery state from Collection.
  LA.restore = function () {
    var c = Collection.count(); this.discover(c.done, c.total);
  };

  LA.discover = function (done, total) {
    this._discoverState = { done: done, total: total };
    var progress = total > 0 ? done / total : 0;
    this.work({
      progress: progress,
      short: done + "/" + total,
      label: "explored",
      state: "exploring"
    });
  };

  LA.discoverAll = function () {
    if (!liveact) return;
    this.bump("liveact--pulse");
    // show expanded "all explored" state
    var c = Collection.count();
    this._discoverState = { done: c.done, total: c.total };
    this.work({ progress: 1, short: c.done + "/" + c.total, label: "explored", state: "all explored", expand: true });
  };

  // override fillExpand to show discovery checklist when in discover mode
  var _origFillExpand = LA.fillExpand.bind(LA);
  LA.fillExpand = function () {
    if (!this._discoverState) { _origFillExpand(); return; }
    var ids = Apps.ids();
    var done = this._discoverState.done, total = this._discoverState.total;
    var isAll = done === total && total > 0;
    var rows = ids.map(function (id) {
      var def = Apps.get(id);
      var name = def && def.label ? def.label : id;
      var visited = Collection.isVisited(id);
      return "<div class='liveact__erow'><span class='liveact__ev'>" + escapeHtml(name) + "</span><span class='liveact__es liveact__es--" + (visited ? "done" : "todo") + "'>" + (visited ? "✓" : "·") + "</span></div>";
    }).join("");
    setHtml(laExpand,
      "<div class='liveact__ehead'><span>gianfranco-os</span><span>Live</span></div>" +
      "<div class='liveact__etitle'>" + (isAll ? "all explored" : "exploring") + "</div>" +
      "<div class='liveact__estate'>" + done + " of " + total + " apps visited</div>" +
      "<div class='liveact__etrack' style='--pct:" + Math.round((done / Math.max(total, 1)) * 100) + "%'><span></span></div>" +
      rows);
    laExpand.hidden = false;
  };

  if (liveact) liveact.addEventListener("click", function () { LA.toggle(); });

  // -- the OS module (Platform) -------------------------------------------
  // btns spans EVERY .os-switch in the document: the device-level switch
  // (desktop stage, ≥1080px) and the one relocated into Settings (mobile's
  // in-fiction home for the control). Both stay in sync via apply().
  var Platform = {
    cur: "ios",
    btns: Array.prototype.slice.call(document.querySelectorAll(".os-switch__btn")),
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
      // persist into unified Collection state (Phase 2); old "ask-os" key is gone
      try {
        var cs = Collection.getState();
        cs.os = os;
        localStorage.setItem("gg-os-v1", JSON.stringify(cs));
      } catch (e) {}
    },
    init: function () {
      // os pref now lives in Collection state (migrated from "ask-os" by Collection.load())
      var saved = Collection.getState().os || null;
      this.apply(saved || this.detect());
      var self = this;
      this.btns.forEach(function (b) {
        b.addEventListener("click", function () { self.set(b.getAttribute("data-os")); });
      });
    },
    hero: function () { LA.app(data.heroActivity); LA.wake(); }
  };

  /* ===================================================================
     Theme — the seed-driven recolor toy (Phase 3)

     One hue (`--seed` in CSS) drives the whole OS accent: the --accent* family,
     the Material You tonal palette, wallpaper tints, Live Activity fills, chips
     and CTAs — every token routed through --seed in base.css recolors live.
     No JS color math: setHue() only rewrites the seed string (L/C are pinned at
     0.47/0.155, hue is the single variable). The hue persists in Collection
     state (localStorage). Browsers without relative-color support keep clay-red
     (the literal fallback in every seed-derived token); supported() gates the
     Settings picker so those users never see a dead control.
     =================================================================== */
  var SEED_L = "0.47", SEED_C = "0.155";       // pinned lightness/chroma
  var Theme = {
    // build the seed oklch() string for a given hue
    _seedStr: function (h) { return "oklch(" + SEED_L + " " + SEED_C + " " + h + ")"; },

    // relative-color support gate (Settings hides the picker when false)
    supported: function () {
      try { return CSS.supports("color", "oklch(from red l c h)"); }
      catch (e) { return false; }
    },

    // read persisted hue on boot; apply it if one was saved
    init: function () {
      var h = Collection.getState().hue;
      if (h != null && h !== "") this._applyHue(h);
    },

    // write the seed (without persisting) — used by init + live slider drag
    _applyHue: function (h) {
      document.documentElement.style.setProperty("--seed", this._seedStr(h));
      this._syncMeta();
    },

    // set + persist a hue (0..359). Called by the Settings slider / swatches.
    setHue: function (h) {
      this._applyHue(h);
      try {
        var cs = Collection.getState();
        cs.hue = h;
        Collection._save();
      } catch (e) {}
    },

    // clear the hue: remove the inline seed (CSS falls back to clay-red) + persist
    reset: function () {
      document.documentElement.style.removeProperty("--seed");
      try {
        var cs = Collection.getState();
        cs.hue = null;
        Collection._save();
      } catch (e) {}
      this._syncMeta();
    },

    // current persisted hue, or null
    hue: function () { var h = Collection.getState().hue; return (h == null || h === "") ? null : h; },

    // mirror the computed accent into <meta name="theme-color"> so the browser
    // UI (address bar, task switcher) tracks the chosen accent.
    // getComputedStyle on a custom property returns the *unresolved* token (e.g.
    // "oklch(from ... l c h)"), which is invalid for theme-color. So resolve it
    // through a real used-value: paint a throwaway element with var(--accent) and
    // read back the computed `color` (a resolved color string the browser accepts).
    _syncMeta: function () {
      var meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) return;
      var probe = document.createElement("span");
      probe.style.cssText = "position:absolute;width:0;height:0;color:var(--accent)";
      document.body.appendChild(probe);
      var c = getComputedStyle(probe).color;
      probe.remove();
      if (c) meta.setAttribute("content", c);
    }
  };

  /* ===================================================================
     Collection — meta-game state (Phase 2)
     localStorage key: "gg-os-v1", shape: {visited:{}, hue:null, os:"ios"}
     Migrates legacy "ask-os" key into state.os on first load.
     Storage failures (private mode) are swallowed; state degrades to in-memory.
     =================================================================== */
  var Collection = (function () {
    var KEY = "gg-os-v1";
    var _state = { visited: {}, hue: null, os: "ios" };

    function _save() {
      try { localStorage.setItem(KEY, JSON.stringify(_state)); } catch (e) {}
    }

    function load() {
      try {
        var raw = localStorage.getItem(KEY);
        if (raw) {
          var parsed = JSON.parse(raw);
          _state = parsed;
        } else {
          // migrate legacy platform key
          var legacy = localStorage.getItem("ask-os");
          if (legacy) { _state.os = legacy; try { localStorage.removeItem("ask-os"); } catch (e) {} _save(); }
        }
      } catch (e) {}
    }

    function isVisited(id) { return !!_state.visited[id]; }

    // Discovery tracker counts only the base apps. Bonus apps (Notes, the
    // completion reward) sit outside the count so "all explored" stays true at
    // 6/6 and the reward itself never inflates the denominator.
    function count() {
      var ids = Apps.ids();
      var done = 0, total = 0;
      ids.forEach(function (id) {
        var def = Apps.get(id);
        if (def && def.bonus) return;
        total++;
        if (_state.visited[id]) done++;
      });
      return { done: done, total: total };
    }

    function isRewarded() { return !!_state.rewarded; }

    // clears the badge with a small scale-pop, then updates LA discovery state
    function _clearBadge(id) {
      var icon = document.querySelector('.appicon[data-app="' + id + '"]');
      if (!icon) return;
      var badge = icon.querySelector(".appicon__badge");
      if (!badge) return;
      if (!REDUCED) {
        badge.classList.add("badge--pop");
        badge.addEventListener("animationend", function () { badge.remove(); }, { once: true });
      } else {
        badge.remove();
      }
      // update aria-label to remove notification count
      icon.setAttribute("aria-label", icon.querySelector(".appicon__label").textContent);
    }

    function visit(id) {
      if (_state.visited[id]) return; // idempotent
      _state.visited[id] = true;
      _save();
      _clearBadge(id);
      var c = count();
      LA.discover(c.done, c.total);
      if (c.done === c.total) reward();
    }

    function reward() {
      if (_state.rewarded) return;   // fire once
      _state.rewarded = true;
      _save();
      LA.discoverAll();              // pulse + flip expand card to "all explored"
      // wake the hidden bonus app (Notes) onto the home grid. Shell is assigned
      // by boot time, well before any visit() can trigger this.
      if (typeof Shell !== "undefined" && Shell.revealBonus) Shell.revealBonus("notes");
    }

    function getState() { return _state; }

    return { load: load, visit: visit, count: count, isVisited: isVisited, isRewarded: isRewarded, getState: getState, _save: _save };
  })();

  /* ===================================================================
     Lock — Phase 8: first-impression dopamine screen.

     Shows once per session (sessionStorage flag "gg-unlocked"). Skipped
     when:
       1. sessionStorage already has "gg-unlocked" (returning same-session)
       2. A deep link hash (#m/<appid>) is present on load (direct link)
       3. No-JS (lockscreen has `hidden` in markup; no .js → nothing runs)

     Reduced-motion users still see the lock (it's a screen, not an
     animation) but with instant transitions (CSS media query + delay(0)).

     Notification cards tap to unlock AND deep-open their app.
     Focus is trapped to unlock button + notif cards while shown.
     On unlock, focus moves to the first app icon.

     The small ICON map from messages.js is NOT available here (different
     file). We duplicate the four needed SVGs inline as a local lock-icon
     map. This keeps os.js self-contained and avoids cross-file coupling.
     =================================================================== */
  var Lock = (function () {
    var SESS_KEY = "gg-unlocked";

    // Inline SVG icons for the lock notification cards.
    // Shape matches the ICON functions in messages.js (same SVG paths).
    function _svg(inner) {
      return "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' width='16' height='16' aria-hidden='true'>" + inner + "</svg>";
    }
    var LOCK_ICON = {
      guild:  function () { return _svg("<path d='M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'/><circle cx='9.5' cy='7' r='4'/><path d='M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75'/>"); },
      hire:   function () { return _svg("<path d='M20 6 9 17l-5-5'/>"); },
      mentee: function () { return _svg("<path d='M23 6 13.5 15.5l-5-5L1 18'/><path d='M17 6h6v6'/>"); },
      doc:    function () { return _svg("<path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/><path d='M14 2v6h6'/>"); }
    };

    var _lockEl    = null;
    var _notifsEl  = null;
    var _unlockBtn = null;
    var _unlockCb  = null; // called after animation completes

    function _markUnlocked() {
      try { sessionStorage.setItem(SESS_KEY, "1"); } catch (e) {}
    }

    function isSkipped() {
      // skip if already unlocked this session
      try { if (sessionStorage.getItem(SESS_KEY)) return true; } catch (e) {}
      // skip if deep link hash is present
      var h = location.hash || "";
      if (/^#m\/[a-z0-9_-]+$/i.test(h)) return true;
      return false;
    }

    // Build one notification card. Returns a DOM element (button — focusable).
    function _buildCard(nt) {
      var ic = (LOCK_ICON[nt.icon] || LOCK_ICON.doc)();
      var card = el("button", "notif",
        "<span class='notif__icon'>" + ic + "</span>" +
        "<span class='notif__main'>" +
          "<span class='notif__app'>" + escapeHtml(nt.app) + "</span>" +
          "<span class='notif__title'>" + escapeHtml(nt.title) + "</span>" +
          "<span class='notif__body'>" + escapeHtml(nt.body) + "</span>" +
        "</span>" +
        "<span class='notif__time'>" + escapeHtml(nt.time || "now") + "</span>");
      card.type = "button";
      card.setAttribute("role", "listitem");
      card.setAttribute("aria-label", nt.app + ": " + nt.title);
      return card;
    }

    // Populate the notification stack from APP_DATA.lock filtered to unvisited apps.
    // Returns the array of card elements (for focus management + stagger).
    function _buildStack(notifsEl) {
      var appData = window.APP_DATA || {};
      var lockData = appData.lock || {};
      var allNotifs = lockData.notifications || [];

      // filter to unvisited apps; cap at 5
      var unvisited = allNotifs.filter(function (nt) {
        if (!nt.id || Collection.isVisited(nt.id)) return false;
        // the Notes teaser only exists once the reward has been earned
        if (nt.id === "notes" && !Collection.isRewarded()) return false;
        return true;
      }).slice(0, 5);

      if (unvisited.length === 0) {
        // all apps explored: quiet welcome-back line
        var msg = el("p", "lockscreen__allvisited", "all explored · welcome back");
        notifsEl.appendChild(msg);
        setTimeout(function () { msg.classList.add("in"); }, REDUCED ? 0 : 80);
        return [];
      }

      var cards = [];
      unvisited.forEach(function (nt) {
        var card = _buildCard(nt);
        card.setAttribute("data-app", nt.id);
        notifsEl.appendChild(card);
        cards.push(card);
      });
      return cards;
    }

    // Wire touch swipe-up on the lock screen itself (in addition to the button).
    function _wireSwipe(lockEl, cb) {
      var ty0 = null;
      lockEl.addEventListener("touchstart", function (e) {
        var t = e.touches && e.touches[0];
        ty0 = t ? t.clientY : null;
      }, { passive: true });
      lockEl.addEventListener("touchend", function (e) {
        if (ty0 == null) return;
        var t = e.changedTouches && e.changedTouches[0];
        if (t && (ty0 - t.clientY) > 40) { ty0 = null; cb(null); }
        ty0 = null;
      }, { passive: true });
    }

    // Simple focus trap: Tab / Shift+Tab stay within focusable elements in lockscreen.
    function _trapFocus(lockEl) {
      lockEl.addEventListener("keydown", function (e) {
        if (e.key !== "Tab") return;
        var focusables = Array.prototype.slice.call(
          lockEl.querySelectorAll("button, [href], [tabindex]:not([tabindex='-1'])")
        ).filter(function (el) { return !el.hasAttribute("disabled"); });
        if (!focusables.length) return;
        var first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      });
    }

    // Escape unlocks (plan requirement).
    function _wireEscape(cb) {
      function handler(e) {
        if (e.key === "Escape") {
          document.removeEventListener("keydown", handler);
          cb(null);
        }
      }
      document.addEventListener("keydown", handler);
      return handler; // so show() can remove it after unlock
    }

    // Animate lock away, then call done().
    function _animateOut(lockEl, done) {
      if (REDUCED) {
        lockEl.hidden = true;
        done();
        return;
      }
      lockEl.classList.add("lockscreen--exiting");
      lockEl.addEventListener("animationend", function () {
        lockEl.hidden = true;
        lockEl.classList.remove("lockscreen--exiting");
        done();
      }, { once: true });
    }

    // show(): render and display the lock screen, then call onUnlock when dismissed.
    function show(lockEl, onUnlock) {
      _lockEl    = lockEl;
      _notifsEl  = document.getElementById("lockNotifs");
      _unlockBtn = document.getElementById("lockUnlock");
      _unlockCb  = onUnlock;

      if (!_lockEl || !_notifsEl || !_unlockBtn) return;

      // Set aria-modal body guard
      document.body.setAttribute("data-locked", "");

      // Build notification stack
      var cards = _buildStack(_notifsEl);

      // Show lock screen
      _lockEl.hidden = false;

      // Focus unlock button (first focusable inside the dialog)
      setTimeout(function () {
        if (_unlockBtn) {
          try { _unlockBtn.focus(); } catch (e) {}
        }
      }, REDUCED ? 0 : 80);

      // Stagger-reveal notification cards
      if (cards.length) {
        // use the same stagger pattern as revealNotifs in messages.js
        cards.forEach(function (card, i) {
          setTimeout(function () { card.classList.add("in"); }, REDUCED ? 0 : 120 + i * 130);
        });
      }

      // trap focus
      _trapFocus(_lockEl);

      // Wire unlock: button click
      var escHandler = null;
      function unlock(targetAppId) {
        if (escHandler) document.removeEventListener("keydown", escHandler);
        _markUnlocked();
        document.body.removeAttribute("data-locked");
        _animateOut(_lockEl, function () {
          if (onUnlock) onUnlock(targetAppId);
        });
      }

      _unlockBtn.addEventListener("click", function () { unlock(null); });

      // Notification card click → unlock + deep-open that app
      cards.forEach(function (card) {
        card.addEventListener("click", function (e) {
          e.stopPropagation();
          unlock(card.getAttribute("data-app"));
        });
      });

      // Click anywhere on the lock screen (not a card) → unlock
      _lockEl.addEventListener("click", function (e) {
        // only respond to clicks on the lock screen backdrop itself
        if (e.target === _lockEl || e.target.classList.contains("lockscreen__wall") || e.target.classList.contains("lockscreen__clock") || e.target === lockDateEl || e.target === lockTimeEl) {
          unlock(null);
        }
      });

      // Swipe-up gesture → unlock
      _wireSwipe(_lockEl, unlock);

      // Escape → unlock
      escHandler = _wireEscape(unlock);
    }

    return { show: show, isSkipped: isSkipped };
  })();

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
    var wakePending = null;    // a freshly-revealed bonus icon to wake on next home show

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
      // a bonus app revealed while an app was foreground wakes now, on return
      if (wakePending) {
        var w = wakePending; wakePending = null;
        requestAnimationFrame(function () { requestAnimationFrame(function () { w.classList.add("in"); }); });
      }
      // notify the app it closed, then restore focus to its icon. Defer the
      // focus call past the (async) View Transition swap so the icon is visible
      // (display:none elements cannot take focus).
      if (fromId) {
        var def = Apps.get(fromId);
        if (def && def.onClose) def.onClose();
        // restore LA discovery state now that story beats have no more control
        LA.restore();
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

      // push discovery state before story beats (Messages etc.) can take over LA
      LA.push();
      // mark visited — clears badge, updates LA discovery, checks for reward
      Collection.visit(id);

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
        var def = Apps.get(id);
        // unregistered -> hidden. A bonus app (Notes) stays hidden until the
        // reward unlocks it, so the grid never advertises the reward early.
        if (def && (!def.bonus || Collection.isRewarded())) { icon.hidden = false; gridIcons.push(icon); }
        else { icon.hidden = true; }
      });
    }

    // Idempotent: safe to call again after revealBonus adds an icon. Per-icon
    // listeners bind once (_wired flag); the grid keydown binds once too.
    function wireGrid() {
      gridIcons.forEach(function (icon, i) {
        icon.setAttribute("tabindex", i === 0 ? "0" : "-1");
        if (icon._wired) return;
        icon._wired = true;
        icon.addEventListener("click", function () {
          lastFocusedIcon = icon;
          GG.Shell.open(icon.getAttribute("data-app"));
        });
        icon.addEventListener("focus", function () { setRoving(gridIcons.indexOf(icon)); });
      });

      if (homescreen._kwired) return;
      homescreen._kwired = true;
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

    // Reward: wake a previously-hidden bonus app (Notes) onto the grid. Called
    // by Collection.reward() at 6/6. Re-syncs the grid set, wires the new icon,
    // badges it, and plays a scale+fade wake (instant under reduced motion).
    function revealBonus(id) {
      var icon = iconForApp(id);
      if (!icon || !icon.hidden) return;   // missing or already shown
      syncGridHonesty();                   // re-include the now-unlocked icon
      wireGrid();                          // bind the new icon (idempotent)
      decorateBadges();                    // give it a discovery dot
      if (REDUCED) return;                 // appears instantly, already visible
      icon.classList.add("pop");           // initial scaled/transparent state
      var homeVisible = homeShown && !document.body.hasAttribute("data-app");
      if (homeVisible) {
        requestAnimationFrame(function () { requestAnimationFrame(function () { icon.classList.add("in"); }); });
      } else {
        wakePending = icon;                // play it when the user returns home
      }
    }

    // Decorate unvisited app icons with notification badges.
    // Messages: badge shows count "1" (in-fiction: 1 unread); others: dot only.
    // Visited apps get no badge. Badges are aria-hidden (decorative) but the
    // icon button gets an aria-label update when badged.
    function decorateBadges() {
      gridIcons.forEach(function (icon) {
        var id = icon.getAttribute("data-app");
        if (Collection.isVisited(id)) return; // already visited: no badge
        var tile = icon.querySelector(".appicon__tile");
        if (!tile) return;
        var badge = el("span", "appicon__badge");
        badge.setAttribute("aria-hidden", "true");
        var isMessages = id === "messages";
        badge.textContent = isMessages ? "1" : "";
        tile.appendChild(badge);
        // accessible label with notification count
        var labelEl = icon.querySelector(".appicon__label");
        var labelText = labelEl ? labelEl.textContent : id;
        icon.setAttribute("aria-label", isMessages
          ? labelText + ", 1 notification"
          : labelText + ", new");
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

        // No-JS fallback shows ONLY the Messages screen: every other app-screen
        // carries `hidden` in markup so a JS-off visitor never sees stacked
        // screens (the last in DOM would otherwise paint on top). Now that JS
        // owns visibility (via .screen--active), strip those attributes so the
        // CSS class governs display and active screens stay exposed to AT.
        var hiddenScreens = document.querySelectorAll(".app-screen[hidden]");
        Array.prototype.forEach.call(hiddenScreens, function (s) { s.hidden = false; });

        // Collection must load before Platform.init() (Platform reads os from state)
        Collection.load();
        Theme.init();        // apply persisted hue (if any) before first paint settles
        Platform.init();

        syncGridHonesty();
        decorateBadges();
        wireGrid();
        wireHomeControl();

        window.addEventListener("hashchange", function () { route(true); });

        // initial route: deep link opens its app with no transition, else home
        var initial = targetFromHash();
        if (initial) {
          // deep link: skip lock, open app directly
          route(false);
        } else if (!Lock.isSkipped()) {
          // fresh session: show lock screen first
          var lockEl = document.getElementById("lockscreen");
          Lock.show(lockEl, function (targetAppId) {
            // lock dismissed: reveal home + stagger icons
            showHome(null, false);
            var c = Collection.count();
            LA.discover(c.done, c.total);
            if (targetAppId) {
              // tapping a notification: unlock → deep-open that app
              GG.Shell.open(targetAppId);
            } else {
              // focus the first app icon
              var firstIcon = gridIcons[0];
              if (firstIcon) deferFocus(firstIcon, null);
            }
          });
        } else {
          // returning same-session visitor: go straight home
          showHome(null, false);
          var ch = Collection.count();
          LA.discover(ch.done, ch.total);
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
      },
      // called by Collection.reward() to wake the bonus app onto the grid
      revealBonus: revealBonus
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
    Theme: Theme,
    LA: LA,
    Collection: Collection,
    Apps: Apps,
    Shell: Shell,
    Lock: Lock
  };
})();
