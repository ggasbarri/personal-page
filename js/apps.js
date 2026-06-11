/* =========================================================================
   GianOS — app router
   Opens full-screen app views from the home grid with a View Transitions
   shared-element morph (the icon tile becomes the app-bar glyph), and keeps
   the browser history honest: opening an app pushes a state, so the real
   back button / Android back gesture closes it, and #appid deep links open
   straight into an app. Inside an app: an oversized display title that
   collapses into the compact bar on scroll, and content blocks that reveal
   as they enter the viewport.
   ========================================================================= */
window.OSApps = (function () {
  "use strict";

  var U = window.OSUtil;
  var REDUCED = U.REDUCED;
  var el = U.el;
  var escapeHtml = U.escapeHtml;
  var sys = window.OSSystem;
  var data = window.GIAN_OS;

  var viewEl = document.getElementById("appview");
  var cur = null;       // open app id
  var curBtn = null;    // the icon that opened it (focus return)
  var pushed = false;   // we own a history entry for the open app
  var busy = false;     // a transition is running

  function appById(id) {
    return data.apps.filter(function (a) { return a.id === id; })[0];
  }
  function devUnlocked() {
    try { return localStorage.getItem("gianos-dev") === "1"; } catch (e) { return false; }
  }
  function canMorph() {
    return !REDUCED && typeof document.startViewTransition === "function";
  }

  /* --------------------------------------------------- reveal on scroll */
  var io = ("IntersectionObserver" in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      io.unobserve(e.target);
    });
  }, { threshold: 0.15 }) : null;

  function observeReveals(root) {
    var nodes = root.querySelectorAll(".reveal");
    if (!io || REDUCED) {
      nodes.forEach(function (n) { n.classList.add("in"); });
      return;
    }
    nodes.forEach(function (n, i) {
      n.style.setProperty("--stagger", Math.min(i, 5));
      io.observe(n);
    });
  }

  /* ------------------------------------------------------ build a view */
  function buildView(app) {
    var view = el("section", "app app--" + app.id);
    view.setAttribute("aria-label", app.name);

    var bar = el("header", "app__bar");
    var back = el("button", "app__back",
      U.svg("<path d='M15 5l-7 7 7 7'/>", null) + "<span class='vh'>Back to home</span>");
    back.type = "button";
    back.addEventListener("click", function () { sys.haptic("tap"); close(); });
    bar.appendChild(back);
    bar.appendChild(el("span", "app__glyph tint-" + app.tint, U.svg(app.glyph, null)));
    bar.appendChild(el("span", "app__name", escapeHtml(app.name)));
    view.appendChild(bar);

    var scroll = el("div", "app__scroll");
    var hero = el("div", "app__hero",
      "<span class='app__kicker'>" + escapeHtml(app.kicker || "") + "</span>" +
      "<h1 class='app__title'>" + escapeHtml(app.title || app.name) + "</h1>");
    scroll.appendChild(hero);
    scroll.appendChild(el("div", "app__content", app.html || ""));
    view.appendChild(scroll);

    // collapsing header: the compact bar title fades in once the oversized
    // hero title has scrolled away
    scroll.addEventListener("scroll", function () {
      view.classList.toggle("is-scrolled", scroll.scrollTop > 56);
    }, { passive: true });

    return view;
  }

  /* per-app wiring after the view is in the DOM */
  function wire(app, view) {
    if (app.id === "contact") {
      var trig = view.querySelector("#shareTrigger");
      if (trig) trig.addEventListener("click", function () {
        window.OSShareSheet.open(trig);
      });
    }
    if (app.id === "settings" && window.OSDev) window.OSDev.bindSettings(view);
    if (app.id === "terminal" && window.OSDev) window.OSDev.renderTerminal(view);
    observeReveals(view);
  }

  function mount(app) {
    U.setHtml(viewEl, "");
    viewEl.appendChild(buildView(app));
    cur = app.id;
    sys.setScreen("app");
  }
  function unmount() {
    U.setHtml(viewEl, "");
    cur = null;
    sys.setScreen("home");
  }

  function afterOpen(app) {
    wire(app, viewEl.firstChild);
    var back = viewEl.querySelector(".app__back");
    if (back) back.focus();
  }

  /* -------------------------------------------------------------- open */
  function open(id, fromBtn, opts) {
    opts = opts || {};
    var app = appById(id);
    if (!app || busy) return;
    if (app.hidden && !devUnlocked()) return;
    if (cur === id) return;

    curBtn = fromBtn || document.querySelector('[data-app="' + id + '"]');

    if (!opts.noHistory) {
      history.pushState({ app: id }, "", "#" + id);
      pushed = true;
    } else {
      history.replaceState({ app: id }, "", "#" + id);
      pushed = false;
    }

    var tile = curBtn ? curBtn.querySelector(".icon__tile") : null;
    if (canMorph() && tile && !opts.instant) {
      busy = true;
      tile.style.viewTransitionName = "app-hero";
      var vt = document.startViewTransition(function () {
        tile.style.viewTransitionName = "";
        mount(app);
        var glyph = viewEl.querySelector(".app__glyph");
        if (glyph) glyph.style.viewTransitionName = "app-hero";
      });
      vt.finished.catch(function () {}).then(function () {
        var glyph = viewEl.querySelector(".app__glyph");
        if (glyph) glyph.style.viewTransitionName = "";
        busy = false;
      });
      vt.ready.catch(function () {}).then(function () { afterOpen(app); });
    } else {
      mount(app);
      afterOpen(app);
    }
  }

  /* -------------------------------------------------------------- close */
  function close() {
    if (!cur || busy) return;
    if (pushed) { history.back(); return; } // popstate does the actual close
    doClose();
    history.replaceState({}, "", location.pathname + location.search);
  }

  function doClose() {
    if (!cur || busy) return;
    var id = cur;
    var btn = curBtn;
    var glyph = viewEl.querySelector(".app__glyph");
    pushed = false;

    function focusBack() {
      var b = btn && document.contains(btn) ? btn : document.querySelector('[data-app="' + id + '"]');
      if (b && b.focus) b.focus();
    }

    if (canMorph() && glyph) {
      busy = true;
      glyph.style.viewTransitionName = "app-hero";
      var vt = document.startViewTransition(function () {
        unmount();
        var b = document.querySelector('[data-app="' + id + '"] .icon__tile');
        if (b) b.style.viewTransitionName = "app-hero";
      });
      vt.finished.catch(function () {}).then(function () {
        var b = document.querySelector('[data-app="' + id + '"] .icon__tile');
        if (b) b.style.viewTransitionName = "";
        busy = false;
        focusBack();
      });
    } else {
      unmount();
      focusBack();
    }
  }

  /* ----------------------------------------------- history integration */
  /* One handler for every same-document navigation. The URL hash is the
     source of truth: back/forward traversal AND fresh hash sets (typed, or
     an anchor link) both land here — browsers fire popstate for hash
     navigations too, and hashchange covers any engine that doesn't. The
     cur === id guard makes the double dispatch harmless. */
  function onNav() {
    var id = (location.hash || "").slice(1);
    var app = appById(id);
    if (app && !(app.hidden && !devUnlocked())) {
      if (cur === id) return;
      if (cur) { U.setHtml(viewEl, ""); cur = null; } // app→app: plain swap
      history.replaceState({ app: id }, "", "#" + id);
      open(id, null, { noHistory: true, instant: true });
      pushed = true; // this entry sits above a base one we can go back to
    } else if (cur) {
      doClose();
    }
  }

  function onKey(e) {
    if (e.key === "Escape" && cur && sys.getScreen() === "app") close();
  }

  /* deep link: #work opens the Work app directly (no lock, no morph) */
  function route() {
    var id = (location.hash || "").slice(1);
    if (id && appById(id) && !(appById(id).hidden && !devUnlocked())) {
      open(id, null, { noHistory: true, instant: true });
      return true;
    }
    return false;
  }

  function init() {
    window.addEventListener("popstate", onNav);
    window.addEventListener("hashchange", onNav);
    document.addEventListener("keydown", onKey);
  }

  return { init: init, open: open, close: close, route: route, observeReveals: observeReveals };
})();
