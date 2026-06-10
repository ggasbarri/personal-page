/* =========================================================================
   Ask Gianfranco — shared utilities
   Vanilla JS, no dependencies. One window global (AskUtil), matching the
   window.LiquidGlass / window.ASK_DATA convention.

   Security note: every HTML fragment rendered by these helpers is authored
   content from data.js or static strings (trusted, shipped with the site).
   There is no user-generated input; the only dynamic strings are passed
   through escapeHtml() before insertion.
   ========================================================================= */
window.AskUtil = (function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  // small inline SVG icons (24x24; stroke unless overridden)
  function svg(inner, attrs) {
    return "<svg viewBox='0 0 24 24' " +
      (attrs || "fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'") +
      " width='16' height='16' aria-hidden='true'>" + inner + "</svg>";
  }
  // shared so the contact share-trigger and the share-sheet tile stay identical
  var SHARE_PATH = "<path d='M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7'/><path d='M12 16V3'/><path d='m7 8 5-5 5 5'/>";
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

  return {
    REDUCED: REDUCED,
    setHtml: setHtml,
    el: el,
    delay: delay,
    scrollInto: scrollInto,
    escapeHtml: escapeHtml,
    svg: svg,
    SHARE_PATH: SHARE_PATH,
    ICON: ICON,
    moonSVG: moonSVG,
    bellOffSVG: bellOffSVG,
    appleSparkSVG: appleSparkSVG,
    geminiSparkSVG: geminiSparkSVG
  };
})();
