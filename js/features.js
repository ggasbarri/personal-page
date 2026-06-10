/* =========================================================================
   Ask Gianfranco — per-beat native OS features
   Focus / Do Not Disturb, the notification cascade + silenced card, the AI
   moment (Apple Intelligence edge glow / Gemini + circle-to-search), and
   the contact poster that raises the share sheet.

   All fragments are authored/trusted (static strings + data.js); dynamic
   values pass through escapeHtml(). Insertion goes through setHtml()/el(),
   the audited path in js/util.js.
   ========================================================================= */
window.AskFeatures = (function () {
  "use strict";

  var U = window.AskUtil;
  var REDUCED = U.REDUCED;
  var el = U.el;
  var svg = U.svg;
  var escapeHtml = U.escapeHtml;

  // -- Focus / Do Not Disturb (setback) -----------------------------------
  function setFocus(on) {
    document.body.classList.toggle("is-focus", on);
    // the moon glyph joins the simulated status cluster (visible framed-only)
    var sys = document.querySelector(".statusbar__sys");
    if (!sys) return;
    var ex = sys.querySelector(".sysfocus");
    if (on && !ex) { sys.insertBefore(el("span", "sysfocus", U.moonSVG()), sys.firstChild); }
    else if (!on && ex) { ex.remove(); }
  }

  // -- notifications (cascade marquee + silenced) -------------------------
  function buildNotif(nt, isSilenced) {
    var ic = (U.ICON[nt.icon] || U.ICON.doc)();
    var hush = isSilenced ? "<span class='notif__hushed'>" + U.bellOffSVG() + "silenced by Focus</span>" : "";
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
    if (window.AskOS.cur === "ios") {
      var dev = document.getElementById("app");
      var glow = el("span", "ai-glow");
      var label = el("span", "ai-label", U.appleSparkSVG() + "<span>Apple Intelligence</span>");
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
      var g = el("div", "gemini", U.geminiSparkSVG() +
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
    p.addEventListener("click", function () { window.AskShareSheet.open(p); });
    p.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); window.AskShareSheet.open(p); }
    });

    var share = el("button", "share-trigger",
      svg(U.SHARE_PATH) + "<span>Share this page</span>");
    share.type = "button";
    share.addEventListener("click", function () { window.AskOS.haptic("select"); window.AskShareSheet.open(share); });
    if (p.nextSibling) bubble.insertBefore(share, p.nextSibling);
    else bubble.appendChild(share);
  }

  return {
    setFocus: setFocus,
    cascade: cascade,
    silenced: silenced,
    aiIntro: aiIntro,
    poster: poster
  };
})();
