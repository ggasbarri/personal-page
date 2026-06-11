/* =========================================================================
   GianOS — lock screen
   The front door: a real clock, the name set as kinetic display type
   (per-letter staggered rise), the one-line bio, and an unlock affordance
   that is both a swipe-up gesture and a real button (keyboard +
   reduced-motion path). Wallpaper layers parallax gently with the pointer.
   ========================================================================= */
window.OSLock = (function () {
  "use strict";

  var U = window.OSUtil;
  var REDUCED = U.REDUCED;
  var el = U.el;
  var escapeHtml = U.escapeHtml;
  var sys = window.OSSystem;
  var data = window.GIAN_OS;

  var lockEl = document.getElementById("lock");
  var onUnlock = null;

  /* split the name into word spans of letter spans so CSS can stagger the
     entrance; --i indexes the rise delay per letter */
  function kineticName(name) {
    var i = 0;
    return name.split(" ").map(function (word) {
      var letters = word.split("").map(function (ch) {
        return "<span class='lock__l' style='--i:" + (i++) + "'>" + escapeHtml(ch) + "</span>";
      }).join("");
      return "<span class='lock__w'>" + letters + "</span>";
    }).join(" ");
  }

  function build() {
    U.setHtml(lockEl,
      "<div class='lock__top'>" +
        "<span class='lock__date' data-date></span>" +
        "<span class='lock__clock' data-clock></span>" +
      "</div>" +
      "<div class='lock__hero'>" +
        "<h1 class='lock__name'>" + kineticName(data.lock.name) + "</h1>" +
        "<p class='lock__line'>" + escapeHtml(data.lock.line) + "</p>" +
        "<p class='lock__tag'>" + escapeHtml(data.identity.tagline) + "</p>" +
      "</div>" +
      "<button class='lock__unlock' type='button'>" +
        "<span class='lock__hint'>" + escapeHtml(data.lock.hint) + "</span>" +
        "<span class='lock__handle' aria-hidden='true'></span>" +
      "</button>");
    sys.tick(); // fill clock/date before first paint of the screen

    lockEl.querySelector(".lock__unlock").addEventListener("click", function () {
      unlock();
    });
    bindSwipe();
  }

  /* swipe-up anywhere on the lock screen unlocks; small drags follow the
     finger so the gesture feels owned, then spring back if under threshold */
  function bindSwipe() {
    var startY = 0, dy = 0, on = false;
    lockEl.addEventListener("pointerdown", function (e) {
      if (e.button != null && e.button !== 0) return;
      // presses on the unlock button stay clicks; capturing here would
      // retarget the click away from the button
      if (e.target.closest && e.target.closest(".lock__unlock")) return;
      on = true; startY = e.clientY; dy = 0;
      lockEl.classList.add("is-dragging");
      try { lockEl.setPointerCapture(e.pointerId); } catch (er) {}
    });
    lockEl.addEventListener("pointermove", function (e) {
      if (!on) return;
      dy = Math.min(0, e.clientY - startY);
      if (!REDUCED) lockEl.style.transform = "translateY(" + dy * 0.55 + "px)";
    });
    function up() {
      if (!on) return;
      on = false;
      lockEl.classList.remove("is-dragging");
      if (dy < -70) { unlock(); }
      else { lockEl.style.transform = ""; }
    }
    lockEl.addEventListener("pointerup", up);
    lockEl.addEventListener("pointercancel", up);
  }

  /* gentle two-layer wallpaper parallax; pointer-driven, transform-only */
  function bindParallax() {
    if (REDUCED) return;
    var wall = document.querySelector(".wall");
    if (!wall) return;
    var a = wall.querySelector(".wall__a"), b = wall.querySelector(".wall__b");
    var device = document.getElementById("device");
    device.addEventListener("pointermove", function (e) {
      var s = sys.getScreen();
      if (s !== "lock" && s !== "home") return;
      var r = device.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      a.style.transform = "translate(" + x * -14 + "px," + y * -10 + "px)";
      b.style.transform = "translate(" + x * 8 + "px," + y * 6 + "px)";
    });
  }

  function unlock() {
    sys.haptic("open");
    try { sessionStorage.setItem("gianos-unlocked", "1"); } catch (e) {}
    lockEl.style.transform = "";
    lockEl.classList.add("is-unlocking");
    var homeEl = document.getElementById("home");
    homeEl.classList.add("is-entering");
    sys.setScreen("home");
    var done = false;
    function fin() {
      if (done) return; done = true;
      lockEl.classList.remove("is-unlocking");
      homeEl.classList.remove("is-entering");
      if (onUnlock) onUnlock();
    }
    if (REDUCED) { fin(); }
    else { setTimeout(fin, 620); }
  }

  function show() {
    build();
    bindParallax();
    sys.setScreen("lock");
  }

  return {
    show: show,
    set onUnlock(fn) { onUnlock = fn; }
  };
})();
