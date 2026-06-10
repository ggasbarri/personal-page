/* =========================================================================
   Ask Gianfranco — chat/story orchestrator
   Streams answers into the chat thread; suggested prompts drive navigation.
   Respects prefers-reduced-motion. Coordinates the OS layer per story beat:
   AskOS (skin + display mode), AskLA (Live Activity spine), AskFeatures
   (per-beat native features), AskShareSheet (contact beat).

   Security note: every HTML fragment rendered here is authored content from
   data.js (trusted, shipped with the site). There is no user-generated
   input; the only dynamic string (a question label, also from data.js) is
   passed through escapeHtml() before insertion.
   ========================================================================= */
(function () {
  "use strict";

  var U = window.AskUtil;
  var REDUCED = U.REDUCED;
  var el = U.el;
  var delay = U.delay;
  var scrollInto = U.scrollInto;
  var escapeHtml = U.escapeHtml;
  var data = window.ASK_DATA || { prompts: [] };

  /* Real Liquid Glass refraction is owned by js/glass.js: it builds a
     geometry-aware displacement filter per surface and decides, by
     capability, whether the lens can ride backdrop-filter (Chromium) —
     falling back to the frosted base everywhere else. */
  try { if (window.LiquidGlass) window.LiquidGlass.init(); } catch (e) {}

  var thread    = document.getElementById("thread");
  var suggestEl = document.getElementById("suggest");

  var asked = {};            // id -> true once a prompt has been answered
  var busy  = false;         // a stream is in progress

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
      window.AskOS.haptic("select");
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

  /* ---- per-beat OS choreography: the device behaves like a real OS ---- */
  function onBeatStart(prompt) {
    window.AskFeatures.setFocus(prompt.feature === "focus");
    var a = prompt.activity;
    if (a) { if (a.kind === "work") window.AskLA.work(a); else window.AskLA.app(a); }
  }
  function onBeatReveal(prompt, container) {
    switch (prompt.feature) {
      case "ai":      window.AskFeatures.aiIntro(container); break;
      case "focus":   window.AskFeatures.silenced(container, prompt.silenced); break;
      case "cascade": if (!REDUCED) window.AskFeatures.cascade(container, prompt.notes); break;
      case "poster":  window.AskFeatures.poster(container); break;
    }
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
    onBeatStart(prompt);

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
        onBeatReveal(prompt, inWrap);
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
        window.AskOS.haptic("tap");
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

    window.AskLA.hero(); // wake the Live Activity: the app comes alive

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
  window.AskOS.init();
  renderChips();
  initChipDrag();
  bootHero();
})();
