/* =========================================================================
   Ask Gianfranco — Live Activity controller (the story spine)
   One element (#liveact), skinned per platform by CSS: iOS Dynamic Island
   (a single continuous black pill, like the real one) / Android Live Update
   status chip. Tracks the broad story path.

   The expanded detail card GROWS OUT OF the pill: CSS transitions width and
   border-radius, while this module drives the height as a px accordion
   (height: auto can't transition). All fragments are authored/trusted
   (static strings + data.js); dynamic values pass through escapeHtml().
   ========================================================================= */
window.AskLA = (function () {
  "use strict";

  var U = window.AskUtil;
  var REDUCED = U.REDUCED;
  var escapeHtml = U.escapeHtml;
  var setHtml = U.setHtml;
  var data = window.ASK_DATA || {};

  var liveact  = document.getElementById("liveact");
  var laTitle  = document.getElementById("liveactTitle");
  var laSub    = document.getElementById("liveactSub");
  var laTrail  = document.getElementById("liveactTrail");
  var laExpand = document.getElementById("liveactExpand");

  /* Measure the card's natural height at its expanded width without letting
     anything animate or paint: snapshot the expanded state with transitions
     off, read, and restore the collapsed geometry — all in one sync block. */
  function measureExpanded(startH) {
    laExpand.style.transition = "none";
    laExpand.style.height = "auto";
    liveact.classList.add("liveact--expanded");
    var h = laExpand.offsetHeight;
    liveact.classList.remove("liveact--expanded");
    laExpand.style.height = startH + "px";
    void laExpand.offsetHeight;          /* commit collapsed geometry */
    laExpand.style.transition = "";
    return h;
  }

  var LA = {
    last: null,
    setProg: function (p) { if (liveact) liveact.style.setProperty("--prog", p || 0); },
    bump: function (cls) { if (REDUCED || !liveact) return; liveact.classList.remove(cls); void liveact.offsetWidth; liveact.classList.add(cls); },
    wake: function () { this.bump("liveact--wake"); },
    hero: function () { this.app(data.heroActivity); this.wake(); },
    app: function (a) {
      if (!liveact) return;
      this.closeExpand();
      liveact.classList.remove("liveact--progress");
      var label = (a && a.label) || "ask gianfranco";
      laTitle.textContent = (a && a.short) || "ask";
      laSub.hidden = true; laTrail.hidden = true;
      this.setProg(0);
      liveact.setAttribute("aria-label", label + ", live");
    },
    work: function (a) {
      if (!liveact) return;
      this.last = a;
      var pct = Math.round((a.progress || 0) * 100);
      liveact.classList.add("liveact--progress");
      laTitle.textContent = a.short || (pct ? pct + "%" : "live");
      laSub.hidden = false; laSub.textContent = a.label || a.state || "";
      laTrail.hidden = false;
      this.setProg(a.progress);
      liveact.setAttribute("aria-label",
        ((data.activity && data.activity.title) || "Work in motion") +
        ", " + (a.label || a.state || "in progress") +
        (pct ? ", " + pct + "% progress" : ""));
      this.bump("liveact--pulse");
      if (a.expand) this.openExpand(); else this.closeExpand();
    },
    fillExpand: function () {
      var a = this.last || {};
      var pct = Math.round((a.progress || 0) * 100);
      setHtml(laExpand,
        "<div class='liveact__ehead'><span>" + escapeHtml((data.activity && data.activity.org) || "") + "</span><span>Live Update</span></div>" +
        "<div class='liveact__etitle'>" + escapeHtml((data.activity && data.activity.title) || "Work in motion") + "</div>" +
        "<div class='liveact__estate'>" + escapeHtml(a.label || a.state || "in progress") + " · " + pct + "%</div>" +
        "<div class='liveact__etrack' style='--pct:" + pct + "%'><span></span></div>" +
        "<div class='liveact__erow'><span class='liveact__ev'>Shared context</span><span class='liveact__es'>building</span></div>" +
        "<div class='liveact__erow'><span class='liveact__ev'>Tradeoffs</span><span class='liveact__es'>visible</span></div>" +
        "<div class='liveact__erow'><span class='liveact__ev'>Next step</span><span class='liveact__es'>clearer</span></div>");
      laExpand.hidden = false;
    },
    openExpand: function () {
      if (!liveact || !liveact.classList.contains("liveact--progress")) return;
      this.fillExpand();
      clearTimeout(this._hT);
      if (REDUCED) {
        liveact.classList.add("liveact--expanded");
        laExpand.style.height = "auto";
      } else {
        var startH = liveact.offsetHeight || 0;
        var target = measureExpanded(startH);
        liveact.classList.add("liveact--expanded");
        laExpand.style.height = target + "px";
        /* the lens map is geometry-keyed: refresh once the morph settles */
        if (window.LiquidGlass) {
          this._hT = setTimeout(function () { window.LiquidGlass.refresh(); }, 500);
        }
      }
      clearTimeout(this._ct);
      var self = this;
      this._ct = setTimeout(function () { self.closeExpand(); }, REDUCED ? 0 : 3400);
    },
    closeExpand: function () {
      if (!liveact || !liveact.classList.contains("liveact--expanded")) return;
      clearTimeout(this._hT);
      liveact.classList.remove("liveact--expanded");
      if (REDUCED) {
        laExpand.style.height = "";
        return;
      }
      /* drive the height back to the pill, then hand control back to CSS */
      laExpand.style.height = (liveact.offsetHeight || 0) + "px";
      this._hT = setTimeout(function () { laExpand.style.height = ""; }, 500);
    },
    toggle: function () {
      if (!liveact || !liveact.classList.contains("liveact--progress")) return;
      if (liveact.classList.contains("liveact--expanded")) this.closeExpand();
      else this.openExpand();
    }
  };

  if (liveact) liveact.addEventListener("click", function () { LA.toggle(); });

  return LA;
})();
