/* =========================================================================
   GianOS — Messages app
   Vanilla JS, no dependencies. Registers the Messages app with GG.Apps.
   Streams answers into a chat thread; suggested prompts drive navigation.
   Respects prefers-reduced-motion.

   Security note: every HTML fragment rendered here is authored content from
   data.js (trusted, shipped with the site). There is no user-generated input:
   the composer field is readonly and the only dynamic string (a question
   label, also from data.js) is passed through escapeHtml() before insertion.
   ========================================================================= */
(function () {
  "use strict";

  GG.Apps.register({
    id: "messages",
    label: "Messages",

    mount: function () {
      var REDUCED    = GG.REDUCED;
      var data       = GG.data;
      var el         = GG.Util.el;
      var setHtml    = GG.Util.setHtml;
      var escapeHtml = GG.Util.escapeHtml;
      var delay      = GG.Util.delay;
      var scrollInto = GG.Util.scrollInto;
      var streamText = GG.Util.streamText;
      var revealPops = GG.Util.revealPops;
      var typeInto   = GG.Util.typeInto;
      var canMorph   = GG.Util.canMorph;
      var observe    = GG.Util.observe;
      var LA         = GG.LA;
      var Platform   = GG.Platform;

      var thread    = document.getElementById("thread");
      var suggestEl = document.getElementById("suggest");

      var asked = {};            // id -> true once a prompt has been answered
      var busy  = false;         // a stream is in progress

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
          cta.disabled = true;
          markChip(nextId);
          // The button becomes the question: morph it into the user bubble.
          ask(np, cta);
        });
        container.appendChild(cta);
      }

      // Final beat (contact): a softer CTA back to the home grid, styled like the
      // continue button but outlined, inviting the visitor to explore the rest.
      function appendExploreCTA(container) {
        if (container.querySelector(".explore-cta")) return; // idempotent
        var cta = el("button", "next-cta next-cta--out explore-cta",
          "explore the rest<span class='next-cta__go' aria-hidden='true'>→</span>");
        cta.type = "button";
        cta.addEventListener("click", function () {
          if (GG.Shell && GG.Shell.goHome) GG.Shell.goHome();
        });
        container.appendChild(cta);
      }

      // -- Focus / Do Not Disturb (setback) -----------------------------------
      function setFocus(on) {
        document.body.classList.toggle("is-focus", on);
        var sys = document.querySelector(".statusbar__sys");
        if (!sys) return;
        var ex = sys.querySelector(".sysfocus");
        if (on && !ex) { sys.insertBefore(el("span", "sysfocus", moonSVG()), sys.firstChild); }
        else if (!on && ex) { ex.remove(); }
      }

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
        if (Platform.cur === "ios") {
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
      }

      // -- onBeatStart / onBeatReveal (ex-OS.onBeatStart / OS.onBeatReveal) ---
      function onBeatStart(prompt) {
        setFocus(prompt.feature === "focus");
        var a = prompt.activity;
        if (a) { if (a.kind === "work") LA.work(a); else LA.app(a); }
      }
      function onBeatReveal(prompt, container) {
        switch (prompt.feature) {
          case "ai":      aiIntro(container); break;
          case "focus":   silenced(container, prompt.silenced); break;
          case "cascade": if (!REDUCED) cascade(container, prompt.notes); break;
          case "poster":  poster(container); break;
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
            // contact is the last story beat: there is no next chat beat, so the
            // dopamine pull becomes an invitation to explore the rest of the OS.
            else if (prompt.id === "contact") appendExploreCTA(inWrap);
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
      function bootHero() {
        var hero = document.getElementById("hero-answer");
        var facts = document.getElementById("facts");

        Platform.hero(); // wake the Live Activity: the app comes alive

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

      // Store bootHero on the app def so onOpen can call it
      this._bootHero = bootHero;
      this._renderChips = renderChips;
      this._initChipDrag = initChipDrag;

      renderChips();
      initChipDrag();
    },

    onOpen: function () {
      if (this._opened) return;
      this._opened = true;
      if (this._bootHero) this._bootHero();
    },

    onClose: function () {}
  });
})();
