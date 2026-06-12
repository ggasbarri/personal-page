/* =========================================================================
   GianOS — shared utilities
   Vanilla JS, no dependencies. One window global (OSUtil), matching the
   window.GIAN_OS convention.

   Security note: every HTML fragment rendered by these helpers is authored
   content from data.js or static strings (trusted, shipped with the site).
   There is no user-generated input rendered as HTML; the only dynamic
   strings are passed through escapeHtml() or inserted via textContent.
   ========================================================================= */
window.OSUtil = (function () {
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

  /* All animation/transition durations route through --motion-scale on :root,
     so the Animator-duration-scale developer option slows the whole OS. */
  function setMotionScale(x) {
    document.documentElement.style.setProperty("--motion-scale", String(x));
  }

  /* OS toast: a small status pill at the bottom of the device. Queued so the
     7-tap easter egg countdown reads one message at a time. */
  var toastEl = null, toastTimer = null, toastQueue = [];
  function toast(msg) {
    if (!toastEl) {
      toastEl = el("div", "toast");
      toastEl.setAttribute("role", "status");
      (document.getElementById("device") || document.body).appendChild(toastEl);
    }
    toastQueue.push(msg);
    if (!toastTimer) nextToast();
  }
  function nextToast() {
    var msg = toastQueue.shift();
    if (msg == null) { toastTimer = null; toastEl.classList.remove("is-on"); return; }
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("is-on");
      toastTimer = setTimeout(nextToast, REDUCED ? 0 : 200);
    }, 1500);
  }

  return {
    REDUCED: REDUCED,
    setHtml: setHtml,
    el: el,
    delay: delay,
    escapeHtml: escapeHtml,
    svg: svg,
    SHARE_PATH: SHARE_PATH,
    setMotionScale: setMotionScale,
    toast: toast
  };
})();
