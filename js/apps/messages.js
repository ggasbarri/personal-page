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

      /* ------------------------------------------------- tablet split view ---
         On the tablet tier the app reads as a real iPad/tablet Messages: a
         conversation sidebar on the left, the chat thread + composer on the
         right. The split is built here (JS-only edit; index.html untouched) but
         is inert on the phone tier — CSS hides .msg-sidebar and unwraps the
         pane below @container device 700px, so the phone experience is
         pixel-identical to before. Purely additive DOM: #thread and #composer
         keep their ids and are only re-parented into a .msg-pane wrapper, so
         every existing query (thread, suggestEl, progressFill, all the beat
         features) still resolves. */
      var unreadDot = null;      // the sidebar row's unread dot, cleared on thread start
      function buildSplitView() {
        var appBody = thread && thread.parentNode;               // the .app-body scroller
        var composer = document.getElementById("composer");
        if (!appBody || !composer) return;
        if (appBody.querySelector(".msg-sidebar")) return;       // idempotent

        // Sidebar: a single pinned conversation ("Gian"). The only conversation,
        // so the row is permanently selected — clicking it is a harmless no-op
        // (re-selects self), never a dead end.
        var sidebar = el("aside", "msg-sidebar");
        sidebar.setAttribute("aria-label", "Conversations");
        var list = el("div", "msg-convos", "");
        list.setAttribute("role", "list");
        var row = el("button", "msg-convo msg-convo--active",
          "<span class='msg-convo__ava'>" +
            "<img src='assets/gianfranco.jpg' alt='' width='96' height='96' loading='lazy'>" +
            "<span class='msg-convo__dot' aria-hidden='true'></span>" +
          "</span>" +
          "<span class='msg-convo__main'>" +
            "<span class='msg-convo__top'><span class='msg-convo__name'>Gian</span>" +
              "<span class='msg-convo__time'>now</span></span>" +
            "<span class='msg-convo__preview'>who are you?</span>" +
          "</span>");
        row.type = "button";
        row.setAttribute("role", "listitem");
        row.setAttribute("aria-current", "true");
        row.setAttribute("aria-label", "Gian, conversation");
        // only conversation: selection never moves, so a click just keeps focus here
        row.addEventListener("click", function () { row.focus(); });
        list.appendChild(row);

        var head = el("div", "msg-sidebar__head", "<span class='msg-sidebar__title'>Messages</span>");
        sidebar.appendChild(head);
        sidebar.appendChild(list);
        unreadDot = row.querySelector(".msg-convo__dot");

        // Right pane wraps thread + composer so it can scroll independently of
        // the fixed sidebar on tablet. On phone the CSS keeps .msg-pane display
        // contents-like (it inherits the .app-body flow), so nothing shifts.
        var pane = el("div", "msg-pane");
        appBody.insertBefore(sidebar, thread);
        appBody.insertBefore(pane, thread);
        pane.appendChild(thread);
        pane.appendChild(composer);
      }

      // Clear the sidebar unread dot once the conversation has started (the
      // thread begins streaming). Idempotent; safe when the sidebar is hidden.
      function clearUnread() {
        if (unreadDot) { unreadDot.classList.add("msg-convo__dot--clear"); }
      }

      /* ------------------------------------------- tap-to-complete (H7) ---
         While a typewriter/stream animation runs, a tap on the thread fast-
         forwards it to its final state: full text, pops landed, in one beat.
         `skip` is a live { on: boolean } signal (see GG.Util.delay/typeInto/
         streamText) shared by reference into whichever animation is in
         flight; flipping it is picked up by that animation's own loop on its
         next tick, so this never touches the DOM directly and can't race or
         double-render. A fresh signal is created per beat so a tap can never
         reach into a *future* beat — see armSkip()/disarmSkip(). */
      var skip = null;
      function armSkip() {
        skip = { on: false };
        thread.classList.add("thread--skippable"); // quiet cursor:pointer cue, no visible button
        return skip;
      }
      function disarmSkip() {
        skip = null;
        thread.classList.remove("thread--skippable");
      }
      thread.addEventListener("click", function () {
        if (skip && !skip.on) skip.on = true;
      });

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
        cta.addEventListener("click", function (e) {
          // Stop this click from bubbling to the thread's tap-to-complete
          // listener: ask() below arms a *fresh* skip signal for the next
          // beat synchronously, and without this the same click would arm
          // then immediately skip that brand-new beat's typing indicator.
          e.stopPropagation();
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

          var s = armSkip(); // tap-to-complete signal for this beat only

          return delay(640, s).then(function () {
            var bubble = el("div", "bubble bubble--in", prompt.html);
            inWrap.replaceChild(bubble, typing);
            var kick = chapterLabel(prompt);
            if (kick) inWrap.insertBefore(el("span", "kicker", kick), bubble);
            return streamText(bubble, inWrap, s);
          }).then(function () {
            inWrap.appendChild(answerMeta(prompt.meta || "from my work"));
            onBeatReveal(prompt, inWrap);
            if (prompt.next && prompt.hook) appendNextCTA(inWrap, prompt.next, prompt.hook);
            // contact is the last story beat: there is no next chat beat, so the
            // dopamine pull becomes an invitation to explore the rest of the OS.
            else if (prompt.id === "contact") appendExploreCTA(inWrap);
            busy = false;
            disarmSkip(); // this beat is done: a further tap must not reach the next one
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
        clearUnread();   // the conversation is now open: clear the sidebar unread dot

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

          // The hero boot is its own self-typing/streaming sequence (it runs
          // before any prompt is asked, so ask()'s own busy/skip bookkeeping
          // doesn't cover it) — arm the same tap-to-complete signal around it.
          busy = true;
          var s = armSkip();

          typeInto(ubub, data.hero, s)
            .then(function () { return delay(360, s); })
            .then(function () {
              var t = el("div", "msg msg--in");
              t.appendChild(typingBubble());
              thread.insertBefore(t, hero);
              scrollInto(t);

              return delay(760, s).then(function () {
                t.remove();
                hero.style.display = "";
                hero.classList.add("in");
                return streamText(hero.querySelector(".bubble"), hero, s);
              });
            })
            .then(function () {
              facts.style.display = "";
              observe(facts);
              setMood("hook");
              markStory("hero");
              busy = false;
              disarmSkip();
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

      buildSplitView();
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
