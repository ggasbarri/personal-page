/* =========================================================================
   GianOS — system layer
   Haptics, the real clock, theme-color sync, the current screen
   (html[data-screen] = lock | home | app), and the DISPLAY MODE the chrome
   keys on:

     framed    — desktop (≥1080px): the page floats as a phone mockup and
                 draws its own simulated status bar.
     fullbleed — everything narrower (real phones, tablets, small windows):
                 the real device already has a status bar, so the simulated
                 chrome stays hidden (see css/shell.css).

   The mode mirrors the same media query CSS uses, exposed on
   html[data-display] so JS consumers and CSS stay in lockstep. theme-color
   follows the visible surface so browser chrome blends on real phones.
   ========================================================================= */
window.OSSystem = (function () {
  "use strict";

  var REDUCED = window.OSUtil.REDUCED;
  var root = document.documentElement;

  var FRAMED_MQ = window.matchMedia("(min-width: 1080px)");

  /* theme-color targets, matched to the rendered surfaces: the warm-clay
     wallpaper behind lock/home, the paper surface inside apps, the stage
     ecru around the desktop mockup. */
  var THEME = {
    framed: "#e7e2d9",
    lock: "#7d3a26",
    home: "#7d3a26",
    app: "#f8f7f2"
  };

  /* Haptics: a real Vibration-API tap wherever the browser exposes it
     (Android Chrome; iOS Safari has no web vibration by design).
     Intensity is semantic (tap < select < open), not a magic number. */
  var HAPTIC = { tap: 7, select: 10, open: 12 };
  function haptic(kind) {
    var ms = HAPTIC[kind] || HAPTIC.tap;
    try { if (!REDUCED && navigator.vibrate) navigator.vibrate(ms); } catch (e) {}
  }

  /* ----------------------------------------------------- display mode */
  function isFramed() { return FRAMED_MQ.matches; }

  function applyDisplayMode() {
    root.setAttribute("data-display", isFramed() ? "framed" : "fullbleed");
    syncTheme();
  }

  function syncTheme() {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    var screen = root.getAttribute("data-screen") || "lock";
    meta.setAttribute("content", isFramed() ? THEME.framed : (THEME[screen] || THEME.app));
  }

  /* -------------------------------------------------- current screen */
  function setScreen(name) {
    root.setAttribute("data-screen", name);
    syncTheme();
  }
  function getScreen() { return root.getAttribute("data-screen") || "lock"; }

  /* ----------------------------------------------------------- clock */
  /* One real clock feeds every [data-clock] (status bar, lock screen)
     and [data-date] (lock screen date line). */
  var DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  var MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  function tick() {
    var d = new Date();
    var h = d.getHours(), m = d.getMinutes();
    var t = h + ":" + (m < 10 ? "0" + m : m);
    var date = DAYS[d.getDay()] + " " + d.getDate() + " " + MONTHS[d.getMonth()];
    document.querySelectorAll("[data-clock]").forEach(function (n) { n.textContent = t; });
    document.querySelectorAll("[data-date]").forEach(function (n) { n.textContent = date; });
  }

  function init() {
    applyDisplayMode();
    if (FRAMED_MQ.addEventListener) FRAMED_MQ.addEventListener("change", applyDisplayMode);
    else if (FRAMED_MQ.addListener) FRAMED_MQ.addListener(applyDisplayMode);
    tick();
    setInterval(tick, 15000);
    // the chat-era OS preference is gone; don't leave the key behind
    try { localStorage.removeItem("ask-os"); } catch (e) {}
  }

  /* Set the display mode as early as possible so first paint already knows
     framed vs fullbleed. */
  applyDisplayMode();

  return {
    init: init,
    haptic: haptic,
    isFramed: isFramed,
    setScreen: setScreen,
    getScreen: getScreen,
    syncTheme: syncTheme,
    tick: tick
  };
})();
