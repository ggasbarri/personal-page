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
  var statusDateEl = document.getElementById("statusDate");

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
    if (statusDateEl) {
      statusDateEl.textContent = DAYS[d.getDay()] + " " + MONTHS[d.getMonth()] + " " + d.getDate();
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
  // `skip` is an optional { on: boolean } signal, shared by reference: the
  // caller can flip skip.on = true after the call starts (e.g. from a tap
  // handler) to fast-forward. Checked live, not just at call time, so it
  // works whether the flag flips before or during the wait.
  function delay(ms, skip) {
    return new Promise(function (r) {
      if (REDUCED || (skip && skip.on)) { r(); return; }
      var done = false;
      var id = setTimeout(function () { done = true; r(); }, ms);
      if (!skip) return;
      (function watch() {
        if (done) return;
        if (skip.on) { done = true; clearTimeout(id); r(); return; }
        requestAnimationFrame(watch);
      })();
    });
  }

  function scrollInto(node) {
    if (!node) return;
    node.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "nearest" });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ------------------------------------------- per-app mini icon tiles ----
     Each app's real home-tile glyph (same SVG paths as index.html), shared by
     the lock-screen notifications, the Live Activity checklist, and the home
     progress widget, so every small surface wears the same icon family. The
     committed tile colors live in shell.css under `.minitile[data-app]`. */
  var APP_GLYPH = {
    messages: "<path d='M21 11.5a8.38 8.38 0 0 1-8.5 8.5 9 9 0 0 1-3.8-.8L3 21l1.9-5.2A8.5 8.5 0 0 1 4 11.5 8.38 8.38 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z'/>",
    maps:     "<path d='M12 21s-6.5-5.5-6.5-10.5A6.5 6.5 0 0 1 12 4a6.5 6.5 0 0 1 6.5 6.5C18.5 15.5 12 21 12 21z'/><circle cx='12' cy='10.5' r='2.3'/>",
    ledger:   "<path d='M3 9.5 12 4l9 5.5'/><path d='M4 9.5v9M20 9.5v9M9 11v6M15 11v6'/><path d='M2.5 20.5h19'/>",
    terminal: "<rect x='3' y='4' width='18' height='16' rx='2.5'/><path d='m7 9 3 3-3 3M13 15h4'/>",
    settings: "<circle cx='12' cy='12' r='3.2'/><path d='M19.4 13.5a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'/>",
    mail:     "<rect x='2.5' y='4.5' width='19' height='15' rx='2.5'/><path d='m3 6 9 6 9-6'/>",
    notes:    "<path d='M5 3.5h14a1 1 0 0 1 1 1V21l-3-2-3 2-3-2-3 2V4.5a1 1 0 0 1 1-1z'/><path d='M8.5 8.5h7M8.5 12h7M8.5 15.5h4'/>"
  };
  function appIconSvg(id) {
    return "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' width='16' height='16' aria-hidden='true'>" +
      (APP_GLYPH[id] || APP_GLYPH.messages) + "</svg>";
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
  // `skip` is the same optional { on: boolean } signal as delay()/typeInto():
  // flipping it mid-stream paints the remaining text and pops on the next tick.
  function streamText(rootEl, anchor, skip) {
    return new Promise(function (resolve) {
      // Visual modules marked .pop are held back during the text stream, then
      // revealed as whole units afterward for a staggered payoff.
      var pops = Array.prototype.slice.call(rootEl.querySelectorAll(".pop"));

      function finish() {
        revealPops(pops, anchor || rootEl, skip);
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

      // Time-based reveal: compute how many characters *should* be shown from
      // elapsed wall-clock time (~90 chars/sec), not a fixed +3 per tick. If a
      // background tab throttles timers, each resumed tick still catches up to
      // the correct position instead of crawling at 1 char/frame.
      var CHARS_PER_SEC = 90;
      var total = full.reduce(function (a, s) { return a + s.length; }, 0);
      var start = null;

      // reveal up to `shown` total characters across the flat node list
      function paint(shown) {
        var remaining = shown, i;
        for (i = 0; i < nodes.length; i++) {
          var len = full[i].length;
          if (remaining >= len) { nodes[i].nodeValue = full[i]; remaining -= len; }
          else { nodes[i].nodeValue = full[i].slice(0, Math.max(0, remaining)); remaining = 0; }
        }
      }

      (function step(t) {
        if (start == null) start = t || performance.now();
        var elapsed = (t || performance.now()) - start;
        var shown = (skip && skip.on) ? total : Math.floor((elapsed / 1000) * CHARS_PER_SEC);
        if (shown >= total) {
          paint(total);
          cursor.remove();
          rootEl.querySelectorAll("[data-count]").forEach(animateCount);
          finish();
          return;
        }
        paint(shown);
        scrollInto(anchor || rootEl);
        requestAnimationFrame(step);
      })();
    });
  }

  // Stagger-reveal the visual modules of an answer, counting up any numbers.
  // `skip` (same { on: boolean } signal): when already on, pop in at once
  // instead of staggering, so a mid-stream tap doesn't leave a residual
  // trickle of modules landing after the tap.
  function revealPops(pops, anchor, skip) {
    var instant = REDUCED || (skip && skip.on);
    pops.forEach(function (p, idx) {
      setTimeout(function () {
        p.classList.add("in");
        p.querySelectorAll("[data-count]").forEach(animateCount);
        scrollInto(anchor);
      }, instant ? 0 : 90 + idx * 110);
    });
  }

  /* -------------------------------------------------------- hero opener */
  // Type a string into an element character by character. The opening
  // question appears to type itself straight into the outgoing bubble
  // (the chat is chip-driven now, so there is no text input to type into).
  // `skip` is the same optional { on: boolean } signal as delay() (see above):
  // flipping it mid-run paints the full text immediately on the next tick.
  function typeInto(node, text, skip) {
    return new Promise(function (resolve) {
      if (REDUCED || (skip && skip.on)) { node.textContent = text; resolve(); return; }
      node.textContent = "";
      var i = 0;
      (function t() {
        if (skip && skip.on) { node.textContent = text; resolve(); return; }
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
  var laDisclose = document.getElementById("liveactDisclose");
  var laSeg      = document.getElementById("liveactSeg");

  // -- Live Activity controller (the story spine) -------------------------
  var LA = {
    last: null,
    setProg: function (p) { if (liveact) liveact.style.setProperty("--prog", p || 0); },
    // Fill the discovery segmented arc: light the first `done` of the arc's
    // ticks (mapped onto the arc's own tick count when the totals differ). The
    // lit tick uses --accent in CSS, so it re-tints live with the theme seed.
    setSeg: function (done, total) {
      if (!laSeg) return;
      var ticks = laSeg.querySelectorAll(".liveact__segd");
      var n = ticks.length || 1;
      // map done/total onto the tick count; guarantee 0 stays 0 and full fills all
      var lit = (total > 0) ? Math.round((done / total) * n) : 0;
      if (done <= 0) lit = 0;
      if (total > 0 && done >= total) lit = n;
      Array.prototype.forEach.call(ticks, function (t, i) {
        t.classList.toggle("liveact__segd--on", i < lit);
      });
    },
    // Toggle the discovery-mode disclosure cue (chevron). On in discovery mode so
    // the chip reads as expandable; off during Messages story beats (not a menu).
    setDiscoverCue: function (on) {
      if (!liveact) return;
      liveact.classList.toggle("liveact--discover", !!on);
      if (laDisclose) laDisclose.hidden = !on;
    },
    bump: function (cls) { if (REDUCED || !liveact) return; liveact.classList.remove(cls); void liveact.offsetWidth; liveact.classList.add(cls); },
    wake: function () { this.bump("liveact--wake"); },
    app: function (a) {
      if (!liveact) return;
      liveact.classList.remove("liveact--progress", "liveact--expanded");
      var label = (a && a.label) || "ask gianfranco";
      laTitle.textContent = (a && a.short) || "ask";
      laSub.hidden = true; laTrail.hidden = true;
      this.setProg(0);
      this.setDiscoverCue(false);
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
    this.setDiscoverCue(false);  // story beats are not an expandable menu
  };

  // restore(): called on app close; re-applies discovery state from Collection.
  LA.restore = function () {
    var c = Collection.count(); this.discover(c.done, c.total);
  };

  LA.discover = function (done, total) {
    this._discoverState = { done: done, total: total };
    var progress = total > 0 ? done / total : 0;
    // Copy nudge: one before completion, swap the count for a quiet prod so the
    // tracker reads as progress-toward-something, not just a fraction.
    var oneToGo = total > 0 && done === total - 1;
    this.work({
      progress: progress,
      short: oneToGo ? "one to go" : done + "/" + total,
      label: "explored",
      state: "exploring"
    });
    this.setSeg(done, total);
    this.setDiscoverCue(true);
    // aria-label states what expanding reveals (the checklist), so a screen
    // reader user knows the chip is actionable, not just a status readout.
    liveact.setAttribute("aria-label",
      "Discovery progress: " + done + " of " + total +
      " apps explored. Show checklist");
  };

  LA.discoverAll = function () {
    if (!liveact) return;
    this.bump("liveact--pulse");
    // show expanded "all explored" state
    var c = Collection.count();
    this._discoverState = { done: c.done, total: c.total };
    // pill: count + label ("6/6 explored"), same grammar as discover(); the
    // pulse, full arc, and expand card carry the completion moment.
    this.work({ progress: 1, short: c.done + "/" + c.total, label: "explored", state: "all explored", expand: true });
    this.setSeg(c.done, c.total);
    this.setDiscoverCue(true);
    liveact.setAttribute("aria-label",
      "Discovery complete: all " + c.total +
      " apps explored. Show checklist");
  };

  // Auto-peek: one-shot reveal of the checklist card so the visitor learns the
  // chip expands. Fired on the first genuine home show of a session. Never
  // steals focus (no .focus() here). Under reduced motion the caller routes to
  // autoPeekStatic() instead (final state, no spring). Returns true if it
  // opened, so the caller can mark peeked only when the card actually showed.
  LA.autoPeek = function () {
    if (REDUCED || !liveact) return false;
    if (!this._discoverState) return false;      // only in discovery mode
    if (!liveact.classList.contains("liveact--progress")) return false;
    this.fillExpand();
    var r = liveact;
    requestAnimationFrame(function () { r.classList.add("liveact--expanded"); });
    clearTimeout(this._ct);                       // share the expand timer slot
    var self = this;
    this._ct = setTimeout(function () { self.closeExpand(); }, 2500);
    return true;
  };

  // Static peek: the reduced-motion counterpart of autoPeek. Renders the
  // checklist card in its final, expanded state with no animation (the global
  // reduced-motion rule zeroes the transition), so reduced-motion / deep-link
  // visitors still learn the chip expands. Collapses on the FIRST user
  // interaction anywhere (click/keydown, once) or after ~4s, whichever comes
  // first. Returns true if it actually opened (so the caller can mark peeked).
  LA.autoPeekStatic = function () {
    if (!liveact) return false;
    if (!this._discoverState) return false;        // only in discovery mode
    if (!liveact.classList.contains("liveact--progress")) return false;
    this.fillExpand();
    liveact.classList.add("liveact--expanded");     // final state, no transition
    var self = this;
    function collapse() {
      document.removeEventListener("click", collapse, true);
      document.removeEventListener("keydown", collapse, true);
      clearTimeout(self._ct);
      self.closeExpand();
    }
    clearTimeout(this._ct);                         // share the expand timer slot
    this._ct = setTimeout(collapse, 4000);
    // capture-phase, once: any click or key anywhere dismisses it
    document.addEventListener("click", collapse, true);
    document.addEventListener("keydown", collapse, true);
    return true;
  };

  // override fillExpand to show discovery checklist when in discover mode
  var _origFillExpand = LA.fillExpand.bind(LA);
  LA.fillExpand = function () {
    if (!this._discoverState) { _origFillExpand(); return; }
    var done = this._discoverState.done, total = this._discoverState.total;
    var isAll = done === total && total > 0;
    // Base apps only, matching the "N of 6" math everywhere else. The Notes
    // reward is not a row: it is the footer payoff once everything is open.
    var ids = Apps.ids().filter(function (id) {
      var def = Apps.get(id);
      return def && !def.bonus;
    });
    var check = "<svg viewBox='0 0 24 24' width='10' height='10' fill='none' stroke='currentColor' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M4.5 12.8l4.8 4.7L19.5 6.5'/></svg>";
    var rows = ids.map(function (id) {
      var def = Apps.get(id);
      var name = def && def.label ? def.label : id;
      var visited = Collection.isVisited(id);
      return "<div class='liveact__erow" + (visited ? " liveact__erow--done" : "") + "'>" +
        "<span class='minitile liveact__etile' data-app='" + escapeHtml(id) + "' aria-hidden='true'>" + appIconSvg(id) + "</span>" +
        "<span class='liveact__ev'>" + escapeHtml(name) + "</span>" +
        (visited ? "<span class='liveact__echeck' aria-hidden='true'>" + check + "</span>" : "") +
        "</div>";
    }).join("");
    // Footer hints the reward without spoiling it: dry, lowercase, no
    // punctuation theatrics. Once everything is open it becomes the payoff, a
    // real button that launches Notes (delegated handler below).
    var footer = isAll
      ? "<button type='button' class='liveact__enotes' data-open-app='notes' aria-label='Open Notes'>" +
          "<span class='minitile liveact__etile' data-app='notes' aria-hidden='true'>" + appIconSvg("notes") + "</span>" +
          "<span class='liveact__ev'>notes unlocked</span>" +
          "<svg class='liveact__echev' viewBox='0 0 24 24' width='12' height='12' fill='none' stroke='currentColor' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='m9 5.5 6.5 6.5L9 18.5'/></svg>" +
        "</button>"
      : "<div class='liveact__efoot'>open everything.</div>";
    setHtml(laExpand,
      "<div class='liveact__ehead'><span>gianfranco-os</span>" +
        "<span class='liveact__eclose' role='button' tabindex='0' aria-label='Close'>✕</span></div>" +
      "<div class='liveact__etitle'>" + (isAll ? "all explored" : "exploring") + "</div>" +
      "<div class='liveact__estate'>" + done + " of " + total + " apps visited</div>" +
      "<div class='liveact__etrack" + (isAll ? " liveact__etrack--full" : "") + "' style='--pct:" + Math.round((done / Math.max(total, 1)) * 100) + "%'><span></span></div>" +
      "<div class='liveact__elist'>" + rows + "</div>" +
      footer);
    laExpand.hidden = false;
  };

  if (liveact) liveact.addEventListener("click", function (e) { e.stopPropagation(); LA.toggle(); });

  // --- expand card: never let it get stuck open blocking app content -------
  // Robust close paths, in addition to the auto-close timer:
  //   • Escape closes it (and stops there, so it doesn't also close an app)
  //   • a click/tap anywhere outside the pill + card closes it
  //   • an explicit close affordance inside the card (added in fillExpand)
  LA.isExpanded = function () { return !!(liveact && liveact.classList.contains("liveact--expanded")); };
  // wrap closeExpand to also clear the auto-close timer
  var _closeExpand = LA.closeExpand.bind(LA);
  LA.closeExpand = function () { clearTimeout(this._ct); _closeExpand(); };

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && LA.isExpanded()) {
      e.stopPropagation();      // don't also trigger the app-close Escape handler
      LA.closeExpand();
      try { liveact.focus(); } catch (err) {}
    }
  }, true);                     // capture phase: run before the app Escape handler

  document.addEventListener("click", function (e) {
    if (!LA.isExpanded()) return;
    if (liveact && liveact.contains(e.target)) return;   // clicks on pill/card ignored here
    LA.closeExpand();
  });

  // explicit close affordance inside the expand card (built in fillExpand).
  // Delegated so it survives card re-renders. Stops propagation so it does not
  // bubble to the pill's toggle (which would immediately re-open).
  if (laExpand) {
    function closeFromCard(e) {
      var t = e.target;
      if (t && t.classList && t.classList.contains("liveact__eclose")) {
        e.stopPropagation();
        if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
        if (e.type === "keydown") e.preventDefault();
        LA.closeExpand();
        try { liveact.focus(); } catch (err) {}
      }
    }
    laExpand.addEventListener("click", closeFromCard);
    laExpand.addEventListener("keydown", closeFromCard);
    // the completion footer is a real <button data-open-app>: close the card,
    // then launch the app. stopPropagation keeps the pill from re-toggling.
    laExpand.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest("[data-open-app]") : null;
      if (!btn || !laExpand.contains(btn)) return;
      e.stopPropagation();
      LA.closeExpand();
      if (window.GG && GG.Shell) GG.Shell.open(btn.getAttribute("data-open-app"));
    });
  }

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
          // normalize: a partial/foreign object (old version, hand edit) must
          // never boot the OS into a dead state — missing fields get defaults.
          if (parsed && typeof parsed === "object") {
            _state = {
              visited: (parsed.visited && typeof parsed.visited === "object") ? parsed.visited : {},
              hue: (typeof parsed.hue === "number") ? parsed.hue : null,
              os: (parsed.os === "android" || parsed.os === "ios") ? parsed.os : "ios",
              rewarded: !!parsed.rewarded
            };
          }
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

    // clears the badge with a small scale-pop, then updates LA discovery state.
    // An app can have two icons (dock + grid duplicate at the tablet tier), so
    // clear the badge on EVERY instance, not just the first match.
    function _clearBadge(id) {
      var icons = document.querySelectorAll('.appicon[data-app="' + id + '"]');
      Array.prototype.forEach.call(icons, function (icon) {
        var badge = icon.querySelector(".appicon__badge");
        var labelEl = icon.querySelector(".appicon__label");
        if (badge) {
          if (!REDUCED) {
            badge.classList.add("badge--pop");
            badge.addEventListener("animationend", function () { badge.remove(); }, { once: true });
          } else {
            badge.remove();
          }
        }
        // update aria-label to remove notification count
        if (labelEl) icon.setAttribute("aria-label", labelEl.textContent);
      });
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

    // Auto-peek one-shot: has the discovery card ever auto-expanded to teach the
    // visitor it is expandable? Persisted so it happens once, ever, per browser.
    function hasPeeked() { return !!_state.peeked; }
    function markPeeked() {
      if (_state.peeked) return;
      _state.peeked = true;
      _save();
    }

    return { load: load, visit: visit, count: count, isVisited: isVisited, isRewarded: isRewarded, getState: getState, hasPeeked: hasPeeked, markPeeked: markPeeked, _save: _save };
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

     Notification cards reuse the shared per-app mini-icon tiles
     (appIconSvg + .minitile committed colors), same family as the home
     tiles, the LA checklist, and the progress widget.
     =================================================================== */
  var Lock = (function () {
    var SESS_KEY = "gg-unlocked";

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
      var ic = appIconSvg(nt.id);
      var card = el("button", "notif",
        "<span class='minitile notif__icon notif__icon--app' data-app='" + escapeHtml(nt.id) + "'>" + ic + "</span>" +
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
        if (e.target === _lockEl || e.target.classList.contains("lockscreen__wall") || e.target.classList.contains("lockscreen__clock") || e.target.classList.contains("lockscreen__owner") || e.target === lockDateEl || e.target === lockTimeEl) {
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
    var activeVT = null;       // the in-flight app-zoom View Transition, if any
    var homeShown = false;     // first home reveal triggers the stagger-in
    var lastFocusedIcon = null;// icon to restore focus to on close
    var wakePending = null;    // a freshly-revealed bonus icon to wake on next home show
    var peekScheduled = false; // guards maybeAutoPeek so it schedules at most once

    function screenForApp(id) {
      return document.querySelector('.app-screen[data-app="' + id + '"]');
    }
    // An app may have TWO icons: a dock instance and a grid duplicate (the
    // duplicate is CSS-hidden on phone tiers, visible at the tablet tier — that
    // is authentic iPadOS). For the View-Transition zoom we must morph from the
    // instance the visitor can actually see. Prefer a VISIBLE grid instance
    // (offsetParent guards against the display:none copy), then a visible dock
    // instance, then any match. offsetParent is reliable here because openApp
    // runs while the homescreen is active (not display:none).
    function iconForApp(id) {
      var all = Array.prototype.slice.call(
        document.querySelectorAll('.appicon[data-app="' + id + '"]'));
      if (!all.length) return null;
      var visible = all.filter(function (n) { return n.offsetParent !== null; });
      var pool = visible.length ? visible : all;
      var grid = pool.filter(function (n) { return n.closest && n.closest(".appgrid"); });
      return (grid[0] || pool[0]);
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
      activeVT = vt;                       // track for route()'s drain guard
      vt.finished.catch(function () {}).then(function () {
        if (activeVT === vt) activeVT = null;
        sharedIconEl.style.viewTransitionName = "";
        screenEl.style.viewTransitionName = "";
      });
      return vt;                           // caller can await vt.finished
    }

    // First GENUINE home show of a session auto-peeks the discovery card once
    // (ever) so visitors learn the chip expands into a checklist / reward path.
    // Called from showHome (the single home-reveal chokepoint) and from boot's
    // fresh/returning paths — idempotent: hasPeeked() gates it, peekScheduled
    // guards re-entry, and it self-marks peeked ONLY when the card actually
    // opens (autoPeek/autoPeekStatic return true). Deep-link entries never call
    // this (they open an app, not home), so the peek stays armed and fires the
    // first time home is genuinely shown. Never peeks while an app is foreground.
    function maybeAutoPeek() {
      if (Collection.hasPeeked() || peekScheduled) return;
      if (current || document.body.hasAttribute("data-app")) return; // app open: not home
      peekScheduled = true;
      // Defer so LA.discover() (which puts the LA in progress/discover mode) has
      // run and the icon stagger has settled before the card reveals.
      setTimeout(function () {
        peekScheduled = false;
        if (Collection.hasPeeked()) return;
        if (current || document.body.hasAttribute("data-app")) return;
        var opened = REDUCED ? LA.autoPeekStatic() : LA.autoPeek();
        if (opened) Collection.markPeeked();       // only burn the peek if it showed
      }, REDUCED ? 300 : 900);
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
      // refresh the tablet discovery-progress widget (an app may have been visited)
      updateProgressWidget();
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

      // Genuine home reveal: arm the one-shot discovery peek. Idempotent — fires
      // at most once ever. Catches the deep-link-then-home case (boot skipped it
      // to avoid burning the peek on a visitor heading straight into an app).
      maybeAutoPeek();
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
      // Prefer the back button (the natural "you are here / go back" landmark).
      // Without one, focus the app's content region (.app-body) rather than the
      // heading: a body landmark is a truer "entered the app" target for AT than
      // an unfocusable title we'd have to fake a tabindex onto.
      var target = screenEl.querySelector(".app-head__back");
      if (!target) {
        target = screenEl.querySelector(".app-body");
        if (!target) return;
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        if (!target.hasAttribute("aria-label")) {
          var title = screenEl.querySelector(".app-head__title");
          var name = (title && title.textContent.trim()) ||
                     screenEl.getAttribute("aria-label") ||
                     screenEl.getAttribute("data-app") || "app";
          target.setAttribute("aria-label", name);
        }
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

      // Release the guard once the transition actually settles, then drain any
      // hash change that arrived mid-flight (we re-read the live hash on drain,
      // so intermediate churn collapses to the last target). Keying off the real
      // View Transition `finished` promise — rather than a fixed 480ms timer —
      // means a slow device can't let the next app-zoom start before this one
      // ends (which the API would resolve by SKIPPING one, dropping an
      // animation). A short timer still backs the no-VT / fallback path.
      function drain() {
        transitioning = false;
        if (hasPending) { hasPending = false; route(true); }
      }
      if (activeVT && activeVT.finished) {
        activeVT.finished.catch(function () {}).then(drain);
      } else {
        setTimeout(drain, REDUCED ? 0 : 320);
      }
    }

    // ---- home grid: honesty + interactivity ---------------------------
    var gridIcons = [];        // visible (registered) icons, in DOM order
    var rovingIdx = 0;

    // tablet tier: the home grid duplicates the four dock apps (authentic
    // iPadOS — dock favorites also live on the grid). Those duplicate grid
    // icons carry .appicon--dockdup and are CSS-hidden below the tablet
    // breakpoint. Roving-tabindex membership must skip them on phone/float so
    // the index math stays correct (they are display:none there and can't take
    // focus). matchMedia mirrors the CSS breakpoint deterministically — no
    // reliance on offsetParent, which is null while the homescreen is still
    // display:none during boot.
    var TABLET_MQ = window.matchMedia("(min-width: 1024px)");

    function syncGridHonesty() {
      // Reveal only icons whose app id is in the registry; hide the rest so the
      // grid never advertises an app that has not shipped.
      var all = Array.prototype.slice.call(homescreen.querySelectorAll(".appicon"));
      var isTablet = TABLET_MQ.matches;
      gridIcons = [];
      all.forEach(function (icon) {
        var id = icon.getAttribute("data-app");
        var def = Apps.get(id);
        var isDockDup = icon.classList.contains("appicon--dockdup");
        // unregistered -> hidden. A bonus app (Notes) stays hidden until the
        // reward unlocks it, so the grid never advertises the reward early.
        var registered = def && (!def.bonus || Collection.isRewarded());
        // The dockdup's own `hidden` attribute mirrors registry honesty; the
        // tier gating (phone vs tablet) is done purely in CSS so the attribute
        // never fights the media query. Membership in the roving list, however,
        // must respect the tier: a display:none dup can't be focused.
        if (registered) { icon.hidden = false; }
        else { icon.hidden = true; }
        if (!registered) return;
        if (isDockDup && !isTablet) return;   // dup hidden on phone: not rovable
        gridIcons.push(icon);
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
        var cols = gridColumnCount(), n = gridIcons.length, idx = rovingIdx, next = idx;
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

    // Derive the grid column count from the rendered .appgrid (its
    // grid-template-columns track list length) so arrow-key Up/Down move by the
    // right stride on every tier — phone (4 cols), tablet (auto-fill), etc.
    // Falls back to 4 if the grid isn't measurable yet.
    function gridColumnCount() {
      var grid = homescreen.querySelector(".appgrid");
      if (!grid) return 4;
      var tpl = getComputedStyle(grid).gridTemplateColumns;
      if (!tpl || tpl === "none") return 4;
      var n = tpl.trim().split(/\s+/).filter(Boolean).length;
      return n > 0 ? n : 4;
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
        if (tile.querySelector(".appicon__badge")) return; // already badged (idempotent across tier changes)
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

    // ---- tablet home widgets: profile (opens Mail) + discovery progress ----
    function wireHomeWidgets() {
      var profile = homescreen.querySelector(".widget--profile");
      if (profile && !profile._wired) {
        profile._wired = true;
        profile.addEventListener("click", function () {
          GG.Shell.open(profile.getAttribute("data-app") || "mail");
        });
      }
      updateProgressWidget();
    }

    // Reflect Collection discovery state into the progress widget (same source
    // the Live Activity reads). Non-interactive; per-app mini checkmarks.
    function updateProgressWidget() {
      var c = Collection.count();
      var countEl = document.getElementById("homeProgressCount");
      var totalEl = document.getElementById("homeProgressTotal");
      var checksEl = document.getElementById("homeProgressChecks");
      if (countEl) countEl.textContent = c.done;
      if (totalEl) totalEl.textContent = c.total;
      if (checksEl) {
        var ids = Apps.ids().filter(function (id) { var d = Apps.get(id); return d && !d.bonus; });
        checksEl.innerHTML = "";
        ids.forEach(function (id) {
          var done = Collection.isVisited(id);
          var cell = el("span", "minitile widget__pcheck" + (done ? " widget__pcheck--done" : ""), appIconSvg(id));
          cell.setAttribute("data-app", id);
          checksEl.appendChild(cell);
        });
      }
      // completion foot: the reward acknowledgement, hidden until all 6
      var foot = document.getElementById("homeProgressFoot");
      if (foot) foot.hidden = !(c.done === c.total && c.total > 0);
      var wrap = document.getElementById("homeProgress");
      if (wrap) wrap.setAttribute("aria-label", "explored " + c.done + " of " + c.total + " apps");

      // phone/float-tier one-line readout: same Collection source as the LA and
      // the tablet widget, so the three counts can never drift. Hidden on the
      // tablet tier via CSS. States the meta-game goal until complete, then
      // announces the reward. Filled here on every refresh (boot, each showHome).
      var line = document.getElementById("homeProgressLine");
      if (line) {
        var done = c.done === c.total;
        line.textContent = done
          ? "all explored · notes unlocked"
          : c.done + " of " + c.total + " explored · open everything";
        line.classList.toggle("home-progress--done", done);
      }
    }

    // Left-edge swipe-back gesture for a single app-screen. Touch only (touch
    // events, matching _wireSwipe). Records the start point only when it lands in
    // the left-edge zone (≤24px from the screen's own left edge, so it can't be
    // triggered by a chip-row scroll that begins mid-column). On release, fires
    // goHome when the horizontal travel exceeds ~60px and dominates the vertical.
    function _wireEdgeBack(screen) {
      if (!screen || screen._edgeWired) return;
      screen._edgeWired = true;
      var EDGE = 24, THRESH = 60;
      var x0 = null, y0 = null;
      screen.addEventListener("touchstart", function (e) {
        var t = e.touches && e.touches[0];
        if (!t) { x0 = null; return; }
        // edge-origin: measure against the app column's live left edge
        var left = screen.getBoundingClientRect().left;
        if (t.clientX - left <= EDGE) { x0 = t.clientX; y0 = t.clientY; }
        else { x0 = null; }
      }, { passive: true });
      screen.addEventListener("touchend", function (e) {
        if (x0 == null) return;
        var t = e.changedTouches && e.changedTouches[0];
        if (t) {
          var dx = t.clientX - x0, dy = t.clientY - y0;
          // rightward, past threshold, predominantly horizontal
          if (dx > THRESH && dx > Math.abs(dy)) GG.Shell.goHome();
        }
        x0 = null; y0 = null;
      }, { passive: true });
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

      // left-edge swipe-back on the app layer (touch only). Mirrors the OS
      // "swipe from the left edge to go back" gesture. Same action as navind.
      // Guards against interfering with app-internal horizontal scrollers (chips
      // rows): the gesture must ORIGINATE within ~24px of the app column's left
      // edge — content scrollers are inset from that edge — and be predominantly
      // horizontal on release. No visual tracking; a release-threshold trigger.
      Array.prototype.slice.call(document.querySelectorAll(".app-screen"))
        .forEach(function (screen) { _wireEdgeBack(screen); });

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
        wireHomeWidgets();
        wireHomeControl();

        window.addEventListener("hashchange", function () { route(true); });

        // Crossing the tablet breakpoint changes which grid icons are visible
        // (the dock duplicates appear/disappear). Re-sync the roving set + wire
        // any newly-shown dup, and re-badge so a dup that just appeared on the
        // tablet grid wears its discovery dot too. Clamp roving to the new
        // length so the index can't dangle past the end.
        function onTierChange() {
          syncGridHonesty();
          wireGrid();
          decorateBadges();
          if (rovingIdx >= gridIcons.length) setRoving(Math.max(0, gridIcons.length - 1));
        }
        if (TABLET_MQ.addEventListener) TABLET_MQ.addEventListener("change", onTierChange);
        else if (TABLET_MQ.addListener) TABLET_MQ.addListener(onTierChange);

        // The discovery-card auto-peek is armed by showHome() on the first
        // genuine home reveal (see maybeAutoPeek above): reduced motion gets a
        // static final-state card, normal motion the spring. Deep-link entries
        // open an app instead of home, so the peek stays armed until the visitor
        // actually lands on the grid.

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
              // tapping a notification: unlock → deep-open that app (no peek: the
              // visitor is heading straight into an app, not landing on the grid)
              GG.Shell.open(targetAppId);
            } else {
              // focus the first app icon; showHome() has armed the one-shot
              // discovery peek (it fires after LA.discover puts the LA in
              // progress mode and the icon stagger settles).
              var firstIcon = gridIcons[0];
              if (firstIcon) deferFocus(firstIcon, null);
            }
          });
        } else {
          // returning same-session visitor: go straight home (showHome arms the
          // one-shot peek if it has not fired yet this browser).
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
