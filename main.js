/* =========================================================================
   Ask Gianfranco — interaction
   Vanilla JS, no dependencies. Streams answers into a chat thread; suggested
   prompts drive navigation. Respects prefers-reduced-motion.

   Security note: every HTML fragment rendered here is authored content from
   data.js (trusted, shipped with the site). There is no user-generated input:
   the composer field is readonly and the only dynamic string (a question
   label, also from data.js) is passed through escapeHtml() before insertion.
   ========================================================================= */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var data = window.ASK_DATA || { prompts: [] };

  /* Real Liquid Glass refraction rides on an SVG backdrop-filter (#lq-glass),
     which is a Chromium-only capability. Gate it to Chromium so Safari and
     Firefox keep the frosted-glass base instead of dropping backdrop-filter
     entirely. The frosted base already reads as correct iOS 26 glass. */
  (function detectRefract() {
    try {
      var ua = navigator.userAgent || "";
      var chromium = /Chrome|Chromium|Edg|OPR/.test(ua) && !/Edge\//.test(ua);
      if (chromium && window.CSS && CSS.supports && CSS.supports("backdrop-filter", "url(#lq-glass)")) {
        document.documentElement.classList.add("refract");
      }
    } catch (e) {}
  })();

  /* Haptics: a real Vibration-API tap on supported devices (Android Chrome).
     iOS Safari has no web vibration, so this is a no-op there by design. */
  function haptic(ms) {
    try { if (!REDUCED && OS.cur === "android" && navigator.vibrate) navigator.vibrate(ms || 8); } catch (e) {}
  }

  var thread    = document.getElementById("thread");
  var suggestEl = document.getElementById("suggest");
  var clockEl   = document.getElementById("clock");

  var asked = {};            // id -> true once a prompt has been answered
  var busy  = false;         // a stream is in progress

  /* ---------------------------------------------------------------- clock */
  function tick() {
    var d = new Date();
    var h = d.getHours(), m = d.getMinutes();
    clockEl.textContent = h + ":" + (m < 10 ? "0" + m : m);
  }
  tick(); setInterval(tick, 15000);

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

  /* ------------------------------------------------- compose a Q&A turn */
  function makeUserMsg(text) {
    var msg = el("div", "msg msg--out");
    msg.appendChild(el("div", "bubble bubble--out", escapeHtml(text)));
    return msg;
  }
  function typingBubble() {
    return el("div", "bubble bubble--in",
      "<span class='typing'><span></span><span></span><span></span></span>");
  }
  function answerMeta(label) {
    return el("div", "msg__meta",
      "<span>answer</span><span class='sep'>·</span><span>" + escapeHtml(label) + "</span>");
  }

  /* ----------------------------------------------- story choreography */
  // The thread is a narrative (Phillips arc). Each beat shifts the room's
  // mood, advances the progress bar, and ends with a cliffhanger "continue".
  var progressFill = document.getElementById("progressFill");
  var storyReached = {};

  function getPrompt(id) {
    return data.prompts.filter(function (p) { return p.id === id; })[0];
  }
  function setMood(mood) {
    if (mood) document.body.setAttribute("data-mood", mood);
  }
  function markStory(id) {
    var story = data.story || [];
    if (story.indexOf(id) === -1) return;
    storyReached[id] = true;
    var done = story.filter(function (s) { return storyReached[s]; }).length;
    if (progressFill) progressFill.style.transform = "scaleX(" + (done / story.length) + ")";
  }
  function chapterLabel(prompt) {
    var story = data.story || [];
    var n = story.indexOf(prompt.id);
    if (!prompt.kicker || n === -1) return null;
    return escapeHtml(prompt.kicker) + " <span class='kicker__n'>" + (n + 1) + " / " + story.length + "</span>";
  }
  // The dopamine pull: closes this loop, opens the next.
  function appendNextCTA(container, nextId, hook) {
    var np = getPrompt(nextId);
    if (!np || asked[nextId]) return;
    var cta = el("button", "next-cta",
      escapeHtml(hook) + "<span class='next-cta__go' aria-hidden='true'>→</span>");
    cta.type = "button";
    cta.addEventListener("click", function () {
      haptic(9);
      cta.disabled = true;
      markChip(nextId);
      // The button becomes the question: morph it into the user bubble.
      ask(np, cta);
    });
    container.appendChild(cta);
  }

  function canMorph() {
    return !REDUCED && typeof document.startViewTransition === "function";
  }

  // Ask a prompt. If fromCTA is given, the continue button morphs into the
  // user's question bubble (View Transitions), so it reads as one gesture
  // instead of a button plus a near-identical repeated bubble.
  function ask(prompt, fromCTA, overrideQuestion) {
    if (asked[prompt.id]) {
      var existing = document.getElementById("ans-" + prompt.id);
      if (existing) existing.scrollIntoView({ behavior: "smooth", block: "start" });
      return Promise.resolve();
    }
    if (busy) return Promise.resolve();
    busy = true;
    asked[prompt.id] = true;
    markChip(prompt.id);
    setMood(prompt.mood);
    markStory(prompt.id);
    OS.onBeatStart(prompt);

    var userMsg = makeUserMsg(overrideQuestion || prompt.question);

    // Stream the typing indicator, then the answer, then the next hook.
    function deliver() {
      var inWrap = el("div", "msg msg--in");
      inWrap.id = "ans-" + prompt.id;
      var typing = typingBubble();
      inWrap.appendChild(typing);
      thread.appendChild(inWrap);
      scrollInto(inWrap);

      return delay(640).then(function () {
        var bubble = el("div", "bubble bubble--in", prompt.html);
        inWrap.replaceChild(bubble, typing);
        var kick = chapterLabel(prompt);
        if (kick) inWrap.insertBefore(el("span", "kicker", kick), bubble);
        return streamText(bubble, inWrap);
      }).then(function () {
        inWrap.appendChild(answerMeta("from my work"));
        OS.onBeatReveal(prompt, inWrap);
        if (prompt.next && prompt.hook) appendNextCTA(inWrap, prompt.next, prompt.hook);
        busy = false;
      });
    }

    if (fromCTA && canMorph()) {
      var bub = userMsg.querySelector(".bubble");
      fromCTA.style.viewTransitionName = "q-morph";
      bub.style.viewTransitionName = "q-morph";
      var vt = document.startViewTransition(function () {
        fromCTA.remove();
        thread.appendChild(userMsg);
      });
      vt.ready.catch(function () {}).then(function () { deliver(); });
      vt.finished.catch(function () {}).then(function () { bub.style.viewTransitionName = ""; });
      return Promise.resolve();
    }

    if (fromCTA) fromCTA.remove();
    thread.appendChild(userMsg);
    scrollInto(userMsg);
    return deliver();
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

  // small inline SVG icons (24x24; stroke unless overridden)
  function svg(inner, attrs) {
    return "<svg viewBox='0 0 24 24' " +
      (attrs || "fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'") +
      " width='16' height='16' aria-hidden='true'>" + inner + "</svg>";
  }
  var ICON = {
    guild:  function () { return svg("<path d='M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'/><circle cx='9.5' cy='7' r='4'/><path d='M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75'/>"); },
    hire:   function () { return svg("<path d='M20 6 9 17l-5-5'/>"); },
    mentee: function () { return svg("<path d='M23 6 13.5 15.5l-5-5L1 18'/><path d='M17 6h6v6'/>"); },
    doc:    function () { return svg("<path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/><path d='M14 2v6h6'/>"); }
  };
  function moonSVG()    { return svg("<path d='M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z'/>", "fill='currentColor' stroke='none'"); }
  function bellOffSVG() { return svg("<path d='M13.7 4.9A6 6 0 0 1 18 10.6V14l1.6 2H8M5 4l14 16'/>"); }
  function appleSparkSVG()  { return "<svg class='ai-label__spark' viewBox='0 0 24 24' aria-hidden='true'><path d='M12 2c.6 4.8 2.6 6.8 7.4 7.4-4.8.6-6.8 2.6-7.4 7.4-.6-4.8-2.6-6.8-7.4-7.4C9.4 8.8 11.4 6.8 12 2z'/></svg>"; }
  function geminiSparkSVG() { return "<svg class='gemini__spark' viewBox='0 0 24 24' aria-hidden='true'><defs><linearGradient id='gem' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#4285F4'/><stop offset='0.5' stop-color='#9b72cb'/><stop offset='1' stop-color='#d96570'/></linearGradient></defs><path fill='url(#gem)' d='M12 2c.6 4.8 2.6 6.8 7.4 7.4-4.8.6-6.8 2.6-7.4 7.4-.6-4.8-2.6-6.8-7.4-7.4C9.4 8.8 11.4 6.8 12 2z'/></svg>"; }

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

  // -- Focus / Do Not Disturb (setback) -----------------------------------
  function setFocus(on) {
    document.body.classList.toggle("is-focus", on);
    var sys = document.querySelector(".statusbar__sys");
    if (!sys) return;
    var ex = sys.querySelector(".sysfocus");
    if (on && !ex) { sys.insertBefore(el("span", "sysfocus", moonSVG()), sys.firstChild); }
    else if (!on && ex) { ex.remove(); }
  }

  // -- notifications (cascade marquee + silenced) -------------------------
  function buildNotif(nt, isSilenced) {
    var ic = (ICON[nt.icon] || ICON.doc)();
    var hush = isSilenced ? "<span class='notif__hushed'>" + bellOffSVG() + "silenced by Focus</span>" : "";
    return el("div", "notif" + (isSilenced ? " notif--silenced" : ""),
      "<span class='notif__icon'>" + ic + "</span>" +
      "<span class='notif__main'><span class='notif__app'>" + escapeHtml(nt.app) + "</span>" +
        "<span class='notif__title'>" + escapeHtml(nt.title) + "</span>" +
        "<span class='notif__body'>" + escapeHtml(nt.body) + "</span>" + hush + "</span>" +
      "<span class='notif__time'>" + escapeHtml(nt.time || "now") + "</span>");
  }
  function revealNotifs(nodes, anchor, step) {
    nodes.forEach(function (n, i) {
      setTimeout(function () {
        n.classList.add("in");
        // keep each card clear of the sticky composer as it lands
        if (!REDUCED) n.scrollIntoView({ behavior: "smooth", block: "center" });
      }, REDUCED ? 0 : 120 + i * (step || 150));
    });
  }
  function cascade(container, notes) {
    var bubble = container.querySelector(".bubble");
    if (!bubble || !notes) return;
    var payoff = bubble.querySelector(".payoff");
    if (payoff) payoff.style.display = "none";   // notifications replace the static chips
    var stack = el("div", "notif-stack");
    var nodes = notes.map(function (nt) { var n = buildNotif(nt, false); stack.appendChild(n); return n; });
    if (payoff && payoff.nextSibling) bubble.insertBefore(stack, payoff.nextSibling);
    else bubble.appendChild(stack);
    revealNotifs(nodes, container, 170);
  }
  function silenced(container, note) {
    if (!note) return;
    var bubble = container.querySelector(".bubble");
    if (!bubble) return;
    var stack = el("div", "notif-stack");
    var n = buildNotif(note, true);
    stack.appendChild(n);
    bubble.appendChild(stack);
    revealNotifs([n], container, 0);
  }

  // -- AI beat: Apple Intelligence (iOS) / Gemini + circle-to-search (Android)
  function aiIntro(container) {
    if (REDUCED) return;
    if (OS.cur === "ios") {
      var dev = document.getElementById("app");
      var glow = el("span", "ai-glow");
      var label = el("span", "ai-label", appleSparkSVG() + "<span>Apple Intelligence</span>");
      dev.appendChild(glow); dev.appendChild(label);
      setTimeout(function () { glow.remove(); label.remove(); }, 2000);
    } else {
      var viz = container.querySelector(".agentviz");
      if (viz) {
        viz.style.position = "relative";
        var lasso = el("span", "cts-lasso",
          "<svg width='100%' height='100%' viewBox='0 0 100 60' preserveAspectRatio='none'><ellipse cx='50' cy='30' rx='46' ry='23' pathLength='1'/></svg>");
        viz.appendChild(lasso);
        requestAnimationFrame(function () { lasso.classList.add("draw"); });
        setTimeout(function () { lasso.remove(); }, 1500);
      }
      var g = el("div", "gemini", geminiSparkSVG() +
        "<span class='gemini__txt'><b>Gemini</b> checks the module map: project context beats guessing across modules.</span>");
      var bubble = container.querySelector(".bubble");
      if (bubble) { bubble.appendChild(g); requestAnimationFrame(function () { g.classList.add("in"); }); }
    }
  }

  // -- Contact: iOS Contact Poster / Android Quick Share sheet ------------
  function poster(container) {
    var bubble = container.querySelector(".bubble");
    if (!bubble) return;
    var p = el("div", "poster",
      "<span class='poster__photo'><img src='assets/gianfranco.jpg' alt='' width='800' height='800'></span>" +
      "<span class='poster__scrim'></span>" +
      "<span class='poster__id'><span class='poster__sub'>contact</span><span class='poster__name'>Gian</span>" +
        "<span class='poster__full'>Gianfranco Gasbarri · Aveiro, PT</span></span>");
    var lead = bubble.querySelector(".answer-lead");
    if (lead && lead.nextSibling) bubble.insertBefore(p, lead.nextSibling);
    else bubble.appendChild(p);
    if (REDUCED) p.classList.add("in");
    else requestAnimationFrame(function () { p.classList.add("in"); });

    // The poster doubles as the share affordance: tapping it raises a real
    // share sheet (iOS Contact Poster share / Android Quick Share).
    p.setAttribute("role", "button");
    p.setAttribute("tabindex", "0");
    p.setAttribute("aria-label", "Share Gianfranco's page");
    p.addEventListener("click", function () { ShareSheet.open(p); });
    p.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ShareSheet.open(p); }
    });

    var share = el("button", "share-trigger",
      svg("<path d='M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7'/><path d='M12 16V3'/><path d='m7 8 5-5 5 5'/>") +
      "<span>Share this page</span>");
    share.type = "button";
    share.addEventListener("click", function () { haptic(10); ShareSheet.open(share); });
    if (p.nextSibling) bubble.insertBefore(share, p.nextSibling);
    else bubble.appendChild(share);
  }

  // -- the OS module -------------------------------------------------------
  var OS = {
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
      // Connected button group (Material 3 Expressive): pressing one segment
      // swells it and squishes its neighbour. The classes only have a visual
      // effect under the Android skin; CSS supplies the spring.
      function release() { self.btns.forEach(function (o) { o.classList.remove("is-pressing", "is-squished"); }); }
      this.btns.forEach(function (b) {
        b.addEventListener("click", function () { self.set(b.getAttribute("data-os")); });
        b.addEventListener("pointerdown", function () {
          haptic(7);
          if (self.cur !== "android") return;
          b.classList.add("is-pressing");
          self.btns.forEach(function (o) { if (o !== b) o.classList.add("is-squished"); });
        });
      });
      window.addEventListener("pointerup", release);
      window.addEventListener("pointercancel", release);
    },
    hero: function () { LA.app(data.heroActivity); LA.wake(); },
    onBeatStart: function (prompt) {
      setFocus(prompt.feature === "focus");
      var a = prompt.activity;
      if (a) { if (a.kind === "work") LA.work(a); else LA.app(a); }
    },
    onBeatReveal: function (prompt, container) {
      switch (prompt.feature) {
        case "ai":      aiIntro(container); break;
        case "focus":   silenced(container, prompt.silenced); break;
        case "cascade": if (!REDUCED) cascade(container, prompt.notes); break;
        case "poster":  poster(container); break;
      }
    }
  };

  /* ===================================================================
     Share sheet (contact beat). A real bottom sheet: slides up over the
     phone, drag-to-dismiss, and the primary target calls the Web Share API
     (navigator.share) when available, falling back to copy-link / mailto /
     LinkedIn. Skinned per-OS by CSS (Liquid Glass vs Quick Share).
     =================================================================== */
  var ShareSheet = (function () {
    var scrim, sheet, built = false, lastTrigger = null;
    var dragging = false, startY = 0, dragY = 0, sheetH = 0, isDesk = false;
    var SHARE = {
      title: "Ask Gianfranco",
      text: "Gianfranco Gasbarri, mobile systems, Aveiro.",
      url: location.href
    };

    function tIcon(name) {
      var p = {
        share: "<path d='M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7'/><path d='M12 16V3'/><path d='m7 8 5-5 5 5'/>",
        copy:  "<rect x='9' y='9' width='11' height='11' rx='2.2'/><path d='M5 15V5a2 2 0 0 1 2-2h10'/>",
        mail:  "<rect x='2.5' y='4.5' width='19' height='15' rx='2.5'/><path d='m3 6 9 6 9-6'/>",
        link:  "<path d='M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5'/><path d='M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5'/>"
      };
      return svg(p[name] || p.link);
    }
    function liLogo() {
      return "<svg viewBox='0 0 24 24' width='16' height='16' aria-hidden='true' fill='currentColor'><path d='M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z'/></svg>";
    }

    function target(cls, label, inner) {
      var b = el("button", "sheet__target " + cls,
        "<span class='sheet__ticon'>" + inner + "</span><span class='sheet__tlabel'>" + escapeHtml(label) + "</span>");
      b.type = "button";
      return b;
    }

    function build() {
      scrim = el("div", "sheet-scrim"); scrim.hidden = true;
      sheet = el("aside", "sheet"); sheet.hidden = true;
      sheet.setAttribute("role", "dialog");
      sheet.setAttribute("aria-modal", "true");
      sheet.setAttribute("aria-label", "Share Gianfranco's page");

      var grip = el("button", "sheet__grip"); grip.type = "button"; grip.setAttribute("aria-label", "Close share sheet");
      var title = el("span", "sheet__title", "Share"); // shown on Android only
      var head = el("div", "sheet__head",
        "<span class='sheet__avatar'><img src='assets/gianfranco.jpg' alt='' width='800' height='800'></span>" +
        "<span class='sheet__id'><span class='sheet__name'>Gianfranco Gasbarri</span>" +
        "<span class='sheet__sub'>ggasbarri.com</span></span>");
      var targets = el("div", "sheet__targets");

      // Native share first, when the browser exposes it (mobile + some desktop).
      if (navigator.share) {
        var tShare = target("sheet__target--share", "Share…", tIcon("share"));
        tShare.addEventListener("click", function () {
          haptic(10);
          navigator.share(SHARE).then(function () { close(); }).catch(function () {});
        });
        targets.appendChild(tShare);
      }
      var tCopy = target("sheet__target--copy", "Copy link", tIcon("copy"));
      tCopy.addEventListener("click", function () {
        haptic(8);
        copyLink(SHARE.url, tCopy);
      });
      var tMail = target("sheet__target--mail", "Email", tIcon("mail"));
      tMail.addEventListener("click", function () {
        haptic(8);
        location.href = "mailto:hey@ggasbarri.com?subject=" + encodeURIComponent("Hello Gian") +
          "&body=" + encodeURIComponent("Saw your page (" + SHARE.url + ") and wanted to reach out.");
      });
      var tLi = target("sheet__target--li", "LinkedIn", liLogo());
      tLi.addEventListener("click", function () {
        haptic(8);
        window.open("https://www.linkedin.com/in/ggasbarri/", "_blank", "noopener");
      });
      targets.appendChild(tCopy); targets.appendChild(tMail); targets.appendChild(tLi);

      var cancel = el("button", "sheet__cancel", "Cancel"); cancel.type = "button"; // iOS only
      cancel.addEventListener("click", close);

      sheet.appendChild(grip);
      sheet.appendChild(title);
      sheet.appendChild(head);
      sheet.appendChild(targets);
      sheet.appendChild(cancel);

      var device = document.getElementById("app");
      device.appendChild(scrim);
      device.appendChild(sheet);

      scrim.addEventListener("click", close);
      grip.addEventListener("click", close);
      bindDrag(grip);
      bindDrag(head);
      built = true;
    }

    function copyLink(url, btn) {
      function done() {
        btn.classList.add("is-done");
        var lbl = btn.querySelector(".sheet__tlabel");
        if (lbl) { lbl.textContent = "Copied"; setTimeout(function () { lbl.textContent = "Copy link"; btn.classList.remove("is-done"); }, 1600); }
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done).catch(fallback);
      } else { fallback(); }
      function fallback() {
        try {
          var ta = document.createElement("textarea");
          ta.value = url; ta.style.position = "fixed"; ta.style.opacity = "0";
          document.body.appendChild(ta); ta.select(); document.execCommand("copy");
          document.body.removeChild(ta); done();
        } catch (e) {}
      }
    }

    /* drag-to-dismiss: track the pointer, follow it downward, dismiss past a
       threshold, otherwise spring back to the open position. */
    function frame(y) { return isDesk ? "translateY(" + y + "px)" : "translate(-50%," + y + "px)"; }
    function bindDrag(handle) {
      handle.addEventListener("pointerdown", function (e) {
        if (e.button != null && e.button !== 0) return;
        dragging = true; startY = e.clientY; dragY = 0;
        isDesk = window.matchMedia("(min-width: 1080px)").matches;
        sheetH = sheet.offsetHeight || 1;
        sheet.classList.add("is-dragging");
        sheet.classList.remove("is-animating");
        try { handle.setPointerCapture(e.pointerId); } catch (er) {}
      });
      handle.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        dragY = Math.max(0, e.clientY - startY);
        sheet.style.transform = frame(dragY);
        if (scrim) scrim.style.opacity = String(Math.max(0, 1 - (dragY / sheetH) * 0.9));
      });
      function up() {
        if (!dragging) return;
        dragging = false;
        sheet.classList.remove("is-dragging");
        sheet.classList.add("is-animating");
        if (scrim) scrim.style.opacity = "";
        if (dragY > Math.min(sheetH * 0.4, 130)) { close(); }
        else { sheet.style.transform = frame(0); }
      }
      handle.addEventListener("pointerup", up);
      handle.addEventListener("pointercancel", up);
    }

    function onKey(e) { if (e.key === "Escape") close(); }

    function open(trigger) {
      if (!built) build();
      lastTrigger = trigger || null;
      isDesk = window.matchMedia("(min-width: 1080px)").matches;
      sheet.hidden = false; scrim.hidden = false;
      sheet.style.transform = "";
      haptic(12);
      requestAnimationFrame(function () {
        sheet.classList.add("is-animating");
        scrim.classList.add("is-open");
        sheet.classList.add("is-open");
      });
      document.addEventListener("keydown", onKey);
      setTimeout(function () {
        var f = sheet.querySelector(".sheet__target, .sheet__cancel, .sheet__grip");
        if (f) f.focus();
      }, REDUCED ? 0 : 140);
    }

    function close() {
      if (!built) return;
      scrim.classList.remove("is-open");
      sheet.classList.remove("is-open");
      sheet.classList.add("is-animating");
      sheet.style.transform = "";
      if (scrim) scrim.style.opacity = "";
      document.removeEventListener("keydown", onKey);
      function fin() { sheet.hidden = true; scrim.hidden = true; sheet.removeEventListener("transitionend", fin); }
      if (REDUCED) { fin(); }
      else { sheet.addEventListener("transitionend", fin); setTimeout(fin, 700); }
      if (lastTrigger && lastTrigger.focus) lastTrigger.focus();
    }

    return { open: open };
  })();

  /* ----------------------------------------------------------- the chips */
  function markChip(id) {
    var c = suggestEl.querySelector('[data-id="' + id + '"]');
    if (c) c.classList.add("chip--done");
  }
  function renderChips() {
    data.prompts.forEach(function (p) {
      var chip = el("button", "chip", escapeHtml(p.chip));
      chip.type = "button";
      chip.setAttribute("data-id", p.id);
      chip.setAttribute("role", "listitem");
      chip.addEventListener("click", function () {
        haptic(6);
        ask(p);
        chip.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      });
      suggestEl.appendChild(chip);
    });
  }

  function initChipDrag() {
    if (!suggestEl || !("PointerEvent" in window)) return;
    var drag = { on: false, moved: false, blockClick: false, startX: 0, scrollLeft: 0, id: null };

    function endDrag(e) {
      if (!drag.on) return;
      drag.on = false;
      suggestEl.classList.remove("suggest--dragging");
      if (drag.moved) {
        drag.blockClick = true;
        setTimeout(function () { drag.blockClick = false; }, 0);
      }
    }

    suggestEl.addEventListener("pointerdown", function (e) {
      if (e.button != null && e.button !== 0) return;
      drag.on = true;
      drag.moved = false;
      drag.id = e.pointerId;
      drag.startX = e.clientX;
      drag.scrollLeft = suggestEl.scrollLeft;
      suggestEl.classList.add("suggest--dragging");
    });
    window.addEventListener("pointermove", function (e) {
      if (!drag.on) return;
      var dx = e.clientX - drag.startX;
      if (Math.abs(dx) > 4) drag.moved = true;
      if (drag.moved) {
        suggestEl.scrollLeft = drag.scrollLeft - dx;
        e.preventDefault();
      }
    });
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    suggestEl.addEventListener("click", function (e) {
      if (!drag.blockClick) return;
      e.preventDefault();
      e.stopPropagation();
    }, true);
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

  function bootHero() {
    var hero = document.getElementById("hero-answer");
    var facts = document.getElementById("facts");

    OS.hero(); // wake the Live Activity: the app comes alive

    if (REDUCED) {
      observe(hero); observe(facts);
      Array.prototype.slice.call(thread.children, 2).forEach(observe);
      setMood("hook");
      markStory("hero");
      if (data.heroNext) appendNextCTA(facts, data.heroNext.next, data.heroNext.hook);
      return;
    }

    // Hold the static hero content until the opener "asks" the question.
    hero.style.display = "none";
    facts.style.display = "none";

    setTimeout(function () {
      // the opening question types itself into a fresh outgoing bubble
      var u = makeUserMsg("");
      var ubub = u.querySelector(".bubble");
      thread.insertBefore(u, hero);
      scrollInto(u);

      typeInto(ubub, data.hero)
        .then(function () { return delay(360); })
        .then(function () {
          var t = el("div", "msg msg--in");
          t.appendChild(typingBubble());
          thread.insertBefore(t, hero);
          scrollInto(t);

          return delay(760).then(function () {
            t.remove();
            hero.style.display = "";
            hero.classList.add("in");
            return streamText(hero.querySelector(".bubble"), hero);
          });
        })
        .then(function () {
          facts.style.display = "";
          observe(facts);
          setMood("hook");
          markStory("hero");
          setTimeout(function () {
            if (data.heroNext) appendNextCTA(facts, data.heroNext.next, data.heroNext.hook);
          }, 700);
        });
    }, 500);
  }

  /* ------------------------------------------------------------- kick off */
  OS.init();
  renderChips();
  initChipDrag();
  bootHero();
})();
