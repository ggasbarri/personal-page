/* =========================================================================
   Ask Gianfranco — OS layer
   Platform selection (iOS / Android skins via body[data-os]), haptics, the
   simulated clock, and the DISPLAY MODE that the whole chrome layer keys on:

     framed    — desktop (≥1080px): the page floats as a phone mockup and
                 draws its own simulated status bar.
     fullbleed — everything narrower (real phones, tablets, small windows):
                 the real device already has a status bar, so the simulated
                 chrome stays hidden (see css/chrome.css).

   The mode mirrors the same media query CSS uses, exposed on
   html[data-display] so JS consumers (share sheet) and CSS stay in lockstep.
   Also keeps the theme-color meta in sync so the browser chrome blends with
   the page on real phones instead of clashing with it.
   ========================================================================= */
window.AskOS = (function () {
  "use strict";

  var REDUCED = window.AskUtil.REDUCED;

  var FRAMED_MQ = window.matchMedia("(min-width: 1080px)");

  /* theme-color targets, matched to the rendered surface colors (the header
     is translucent over .device, so the device surface is the right blend) */
  var THEME = {
    framed: "#e7e2d9",                       /* stage ecru behind the mockup */
    ios: "#f8f7f2",                          /* oklch(0.975 0.006 86) */
    android: "#faf5f0"                       /* oklch(0.972 0.009 64) */
  };

  /* Haptics: a real Vibration-API tap on supported devices (Android Chrome).
     iOS Safari has no web vibration, so this is a no-op there by design.
     Intensity is semantic (tap < select < open), not a per-call magic number. */
  var HAPTIC = { tap: 7, select: 10, open: 12 };
  function haptic(kind) {
    var ms = HAPTIC[kind] || HAPTIC.tap;
    try { if (!REDUCED && OS.cur === "android" && navigator.vibrate) navigator.vibrate(ms); } catch (e) {}
  }

  /* ----------------------------------------------------- display mode */
  function isFramed() { return FRAMED_MQ.matches; }

  function applyDisplayMode() {
    document.documentElement.setAttribute("data-display", isFramed() ? "framed" : "fullbleed");
    syncTheme();
  }

  function syncTheme() {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    meta.setAttribute("content", isFramed() ? THEME.framed : (THEME[OS.cur] || THEME.ios));
  }

  /* ------------------------------------------------- simulated clock */
  /* Only visible in framed mode (fullbleed hides the fake status bar),
     but ticking is cheap and keeps the markup truthful either way. */
  var clockEl = document.getElementById("clock");
  function tick() {
    if (!clockEl) return;
    var d = new Date();
    var h = d.getHours(), m = d.getMinutes();
    clockEl.textContent = h + ":" + (m < 10 ? "0" + m : m);
  }

  /* --------------------------------------------------- the OS module */
  var osSwitch = document.getElementById("osSwitch");

  var OS = {
    cur: "ios",
    btns: osSwitch ? Array.prototype.slice.call(osSwitch.querySelectorAll(".os-switch__btn")) : [],
    haptic: haptic,
    isFramed: isFramed,
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
      syncTheme();
      // glass surfaces only render (and have a measurable size) under iOS — refresh
      // the lenses once the skin is on so each picks up a correctly-sized map.
      if (os === "ios" && window.LiquidGlass) {
        requestAnimationFrame(function () { window.LiquidGlass.refresh(); });
      }
    },
    set: function (os) {
      if (os === this.cur) return;
      this.apply(os);
      try { localStorage.setItem("ask-os", os); } catch (e) {}
    },
    init: function () {
      applyDisplayMode();
      if (FRAMED_MQ.addEventListener) FRAMED_MQ.addEventListener("change", applyDisplayMode);
      else if (FRAMED_MQ.addListener) FRAMED_MQ.addListener(applyDisplayMode);

      tick();
      setInterval(tick, 15000);

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
          haptic("tap");
          if (self.cur !== "android") return;
          b.classList.add("is-pressing");
          self.btns.forEach(function (o) { if (o !== b) o.classList.add("is-squished"); });
        });
      });
      window.addEventListener("pointerup", release);
      window.addEventListener("pointercancel", release);
    }
  };

  /* Set the display mode as early as possible (before app.js boots) so the
     first paint already knows framed vs fullbleed. */
  applyDisplayMode();

  return OS;
})();
