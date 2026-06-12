/* =========================================================================
   GianOS — boot
   Orchestrates startup: system init, developer-mode restore, home render,
   app router, then the entry decision — a #appid deep link opens straight
   into that app, a returning visitor (sessionStorage) lands on home, and a
   first visit gets the lock screen. The no-JS fallback content in
   index.html is hidden by the html.js class set inline in <head>.
   ========================================================================= */
(function () {
  "use strict";

  var sys = window.OSSystem;

  sys.init();
  window.OSDev.init();
  window.OSHome.render();
  window.OSApps.init();

  // home handle (framed mode): on the app screen it goes home
  var handle = document.getElementById("homeHandle");
  if (handle) handle.addEventListener("click", function () {
    if (sys.getScreen() === "app") { sys.haptic("tap"); window.OSApps.close(); }
  });

  // desktop stage wordmark: a few px of pointer-driven shear (transform only)
  (function kineticMark() {
    if (window.OSUtil.REDUCED) return;
    var mark = document.querySelector(".stage-mark");
    if (!mark) return;
    var spans = mark.querySelectorAll("span");
    window.addEventListener("pointermove", function (e) {
      if (!sys.isFramed()) return;
      var x = e.clientX / window.innerWidth - 0.5;
      var y = e.clientY / window.innerHeight - 0.5;
      spans.forEach(function (s, i) {
        var k = (i + 1) * 4;
        s.style.transform = "translate(" + x * k + "px," + y * k * 0.6 + "px) skewX(" + x * -2 + "deg)";
      });
    });
  })();

  var unlockedBefore = false;
  try { unlockedBefore = sessionStorage.getItem("gianos-unlocked") === "1"; } catch (e) {}

  if (window.OSApps.route()) {
    // deep link straight into an app; the lock never shows
    try { sessionStorage.setItem("gianos-unlocked", "1"); } catch (e) {}
  } else if (unlockedBefore) {
    sys.setScreen("home");
  } else {
    window.OSLock.show();
  }

  // a quiet nudge for the kind of visitor who opens devtools
  try {
    console.log(
      "%cgian@gianos:~$ %cthere is more here than it looks. settings › build number.",
      "color:#93402a;font-weight:bold", "color:inherit"
    );
  } catch (e) {}
})();
