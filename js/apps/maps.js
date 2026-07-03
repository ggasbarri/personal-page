/* =========================================================================
   GianOS — Maps app
   Vanilla JS, no dependencies. Registers the Maps app with GG.Apps.

   The Venezuela→Portugal journey as a quiet, stylized map. The map is NOT a
   geographic basemap: two abstract blob landmasses (Venezuela's coast bottom-
   left, Iberia top-right), the ocean as the app background, a faint graticule
   hint, and a curved bezier route arc across the Atlantic. Pins sit along the
   arc — chapters of a journey, not cities.

   Signature moment (first open): the route draws itself across the ocean
   (stroke-dasharray/dashoffset, the same technique as the existing .cts-lasso),
   pins pop in sequence as the line reaches each one, and the final "today" pin
   keeps a soft persistent pulse. Tapping a pin opens a bottom-sheet place card
   (per-OS skin); tapping another pin swaps content; tapping the map or the card
   close dismisses it. Re-open: route already drawn (no replay).

   Reduced motion: route pre-drawn, pins visible immediately, no pulse.

   Security note: ALL content is authored data from APP_DATA.maps (trusted,
   shipped with the site). There is no user input. The only dynamic strings
   (org / role / years / place) are inserted via textContent, never innerHTML.
   ========================================================================= */
(function () {
  "use strict";

  var md = (window.APP_DATA && window.APP_DATA.maps) || { stops: [] };
  var stops = md.stops || [];
  var REDUCED = GG.REDUCED;
  var SVGNS = "http://www.w3.org/2000/svg";

  // -------------------------------------------------------------------------
  // Theme-color meta sync — Maps wears a light blue-paper ocean.
  // On open: tint theme-color to the ocean; on close: restore the real accent.
  // -------------------------------------------------------------------------
  var MAPS_THEME = "oklch(0.93 0.02 230)";   // matches --map-ocean

  function syncMetaMaps() {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", MAPS_THEME);
  }
  function syncMetaRestore() {
    if (GG.Theme && GG.Theme._syncMeta) GG.Theme._syncMeta();
  }

  // -------------------------------------------------------------------------
  // Choreography timings (ms). Route draws over DRAW_MS; each pin pops in at a
  // fraction of that duration matched to where it sits along the arc, so the
  // pin appears just as the drawn line reaches it.
  // -------------------------------------------------------------------------
  var DRAW_MS = 2400;          // route stroke-draw duration
  var PIN_LEAD = 120;          // pin pops in slightly before the line "arrives"
  var CARD_HIDE_MS = 260;      // place-card slide-down before removal

  // -------------------------------------------------------------------------
  // DOM refs — populated once during mount()
  // -------------------------------------------------------------------------
  var screenEl = null;   // .app-screen[data-app=maps]
  var bodyEl   = null;   // .app-body
  var mapWrap  = null;   // .map-wrap (the SVG container)
  var routeEl  = null;   // the route <path>
  var pinEls   = [];     // pin <button> wrappers (HTML), one per stop
  var cardWrap = null;   // .map-card-wrap (bottom-sheet container)
  var cardEl   = null;   // .map-card (role=dialog)

  // state
  var opened   = false;  // has Maps been opened at least once?
  var drawn    = false;  // has the route finished drawing?
  var activePin = null;  // currently selected pin id (card open), or null
  var sizedOnce = false; // has the map-wrap ever been built with a real, nonzero size?
  var pendingFirstDraw = false; // onOpen() deferred drawRoute() until real geometry lands

  // -------------------------------------------------------------------------
  // The map SVG — hand-authored, minimal, stylized. viewBox 0 0 100 100.
  // Landmasses are soft blob paths; a graticule hint is 3 faint curved lines;
  // the route is a smooth bezier arc from VE (bottom-left) to Iberia (top-right).
  //
  // Coordinate alignment note: pins are HTML buttons positioned by CSS left/top
  // percentages of the map-wrap container. The SVG uses preserveAspectRatio=
  // "xMidYMid slice" on a square 0 0 100 100 viewBox; on portrait phones the
  // height drives the scale, cropping the SVG horizontally. The route endpoints
  // must be in SVG-viewBox coords that correspond to the pin's CSS-% pixel
  // position, otherwise the route exits the viewport without visually terminating
  // at the pin. routeD() computes these corrected coords dynamically from the
  // container's clientWidth/clientHeight at the time the SVG is built.
  // -------------------------------------------------------------------------
  // Venezuela coast — a soft landmass anchored bottom-left, coastline facing
  // up-right toward the ocean.
  var VE_PATH =
    "M -6 70 " +
    "C 4 66, 12 67, 19 71 " +
    "C 24 74, 31 73, 36 77 " +
    "C 40 80, 38 86, 32 89 " +
    "C 26 92, 16 93, 8 95 " +
    "C 2 96, -4 97, -10 96 " +
    "Z";

  // Iberia — a soft landmass anchored top-right, coastline facing down-left.
  var IB_PATH =
    "M 110 6 " +
    "C 100 4, 90 6, 82 9 " +
    "C 76 11, 70 12, 67 17 " +
    "C 64 22, 69 27, 76 29 " +
    "C 83 31, 92 30, 100 31 " +
    "C 106 31, 112 30, 116 28 " +
    "Z";

  // Faint graticule curves (latitude-ish arcs sweeping across the ocean).
  var GRATICULE = [
    "M -5 48 C 25 40, 55 44, 105 36",
    "M -5 64 C 28 58, 58 60, 105 52",
    "M -5 32 C 25 24, 60 28, 105 20"
  ];

  // The route arc. A single cubic bezier sweeping up-right across the ocean,
  // bowed slightly toward the top so it reads as an Atlantic crossing. Start
  // and end are converted from CSS-% pin positions to SVG viewBox coords via
  // the xMidYMid-slice transform, so the bezier visually terminates at the pins.
  // cW / cH are the container pixel dimensions at build time.
  function routeD(cW, cH) {
    var s = stops[0], e = stops[stops.length - 1];
    var VBW = 100, VBH = 100;
    // xMidYMid slice: the larger scale fills the container, the other axis crops
    var scale = Math.max(cW / VBW, cH / VBH);   // px per vb unit
    var scaledW = VBW * scale, scaledH = VBH * scale;
    var cropX = (scaledW - cW) / 2;              // px cropped from each horizontal side
    var cropY = (scaledH - cH) / 2;              // px cropped from each vertical side (usually 0)
    // convert CSS-% → SVG viewBox coord
    function toVbX(frac) { return (frac * cW + cropX) / scale; }
    function toVbY(frac) { return (frac * cH + cropY) / scale; }
    var sx = toVbX(s ? s.x : 0.155), sy = toVbY(s ? s.y : 0.80);
    var ex = toVbX(e ? e.x : 0.83),  ey = toVbY(e ? e.y : 0.245);
    // fixed control points bow the arc upward (lower y) for a gentle great-circle feel
    var c1x = 33, c1y = 50;
    var c2x = 66, c2y = 24;
    return "M " + sx.toFixed(2) + " " + sy.toFixed(2) +
           " C " + c1x + " " + c1y + ", " + c2x + " " + c2y +
           ", " + ex.toFixed(2) + " " + ey.toFixed(2);
  }

  // Middle stops have no fixed geography (no city claim), so their pins sit
  // ON the route arc: sample the same cubic bezier the route uses and convert
  // back to CSS fractions. Endpoint pins keep their authored positions.
  function bez(t, p0, p1, p2, p3) {
    var u = 1 - t;
    return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
  }

  function positionPins(cW, cH) {
    var VBW = 100, VBH = 100;
    var scale = Math.max(cW / VBW, cH / VBH);
    var cropX = (VBW * scale - cW) / 2;
    var cropY = (VBH * scale - cH) / 2;
    function toVbX(frac) { return (frac * cW + cropX) / scale; }
    function toVbY(frac) { return (frac * cH + cropY) / scale; }
    var s = stops[0], e = stops[stops.length - 1];
    var sx = toVbX(s.x), sy = toVbY(s.y), ex = toVbX(e.x), ey = toVbY(e.y);
    var n = stops.length;
    pinEls.forEach(function (pin, i) {
      var fx = stops[i].x, fy = stops[i].y;
      if (i > 0 && i < n - 1) {
        var t = i / (n - 1);
        // control points must match routeD()
        fx = (bez(t, sx, 33, 66, ex) * scale - cropX) / cW;
        fy = (bez(t, sy, 50, 24, ey) * scale - cropY) / cH;
      }
      pin.style.left = (fx * 100) + "%";
      pin.style.top = (fy * 100) + "%";
    });
  }

  // Build (or rebuild) the SVG contents for a given container size.
  // cW/cH are the map-wrap pixel dimensions; they drive the slice transform
  // so the route endpoints land exactly on the pins.
  function makeSVG(cW, cH) {
    var svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("class", "map-svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    svg.setAttribute("aria-hidden", "true");   // decorative; pins carry the labels
    svg.setAttribute("focusable", "false");

    // graticule hints (drawn first, behind everything)
    var grat = document.createElementNS(SVGNS, "g");
    grat.setAttribute("class", "map-graticule");
    GRATICULE.forEach(function (d) {
      var p = document.createElementNS(SVGNS, "path");
      p.setAttribute("d", d);
      grat.appendChild(p);
    });
    svg.appendChild(grat);

    // landmasses
    var land = document.createElementNS(SVGNS, "g");
    land.setAttribute("class", "map-land");
    [VE_PATH, IB_PATH].forEach(function (d) {
      var p = document.createElementNS(SVGNS, "path");
      p.setAttribute("d", d);
      land.appendChild(p);
    });
    svg.appendChild(land);

    // a small dot marker on the Iberia landmass near the final pin
    // Its position also needs the slice-corrected SVG coords
    var last = stops[stops.length - 1];
    var VBW = 100, VBH = 100;
    var scale = Math.max(cW / VBW, cH / VBH);
    var scaledW = VBW * scale, scaledH = VBH * scale;
    var cropX = (scaledW - cW) / 2;
    var cropY = (scaledH - cH) / 2;
    function toVbX(frac) { return (frac * cW + cropX) / scale; }
    function toVbY(frac) { return (frac * cH + cropY) / scale; }

    if (last) {
      var dot = document.createElementNS(SVGNS, "circle");
      dot.setAttribute("class", "map-place-dot");
      dot.setAttribute("cx", toVbX(last.x).toFixed(2));
      dot.setAttribute("cy", toVbY(last.y).toFixed(2));
      dot.setAttribute("r", "0.9");
      svg.appendChild(dot);
    }

    // the route path — drawn last so it sits above land
    routeEl = document.createElementNS(SVGNS, "path");
    routeEl.setAttribute("class", "map-route");
    routeEl.setAttribute("d", routeD(cW, cH));
    routeEl.setAttribute("fill", "none");
    routeEl.setAttribute("pathLength", "1");   // normalize for dasharray draw
    svg.appendChild(routeEl);

    // ---- always-visible endpoint labels (first and last stop only) --------
    // Tiny muted text next to the endpoint pins; aria-hidden (pins have labels).
    // "Valencia" label: right of the carabobo pin (near left edge).
    // "Aveiro" label:   left/below the olx pin (near right edge).
    // Font-size in vb units chosen so it reads as ~10-11px at 390px viewport.
    // At 390px wide with the slice transform, 1 vb unit ≈ scale px; we pick a
    // size that stays legible but doesn't dominate.
    var LABEL_FS = 1.6;   // viewBox units; ~11px once the slice scale (≈7 px/unit) applies
    var labelGroup = document.createElementNS(SVGNS, "g");
    labelGroup.setAttribute("class", "map-endpoint-labels");
    labelGroup.setAttribute("aria-hidden", "true");

    var first = stops[0];
    if (first) {
      // "Valencia" — right of pin, vertically centered at pin y, slight upward offset
      var lx = toVbX(first.x) + 1.6;
      var ly = toVbY(first.y) - 1.2;
      var t1 = document.createElementNS(SVGNS, "text");
      t1.setAttribute("x", lx.toFixed(2));
      t1.setAttribute("y", ly.toFixed(2));
      t1.setAttribute("font-size", LABEL_FS);
      t1.setAttribute("class", "map-label map-label--start");
      t1.textContent = "Valencia";
      labelGroup.appendChild(t1);
    }
    if (last) {
      // "Aveiro" — above-right of the today pin, clear of the incoming route
      var ax = toVbX(last.x) + 1.4;
      var ay = toVbY(last.y) - 1.6;
      var t2 = document.createElementNS(SVGNS, "text");
      t2.setAttribute("x", ax.toFixed(2));
      t2.setAttribute("y", ay.toFixed(2));
      t2.setAttribute("font-size", LABEL_FS);
      t2.setAttribute("class", "map-label map-label--start");
      t2.textContent = "Aveiro";
      labelGroup.appendChild(t2);
    }
    svg.appendChild(labelGroup);

    return svg;
  }

  // -------------------------------------------------------------------------
  // Pins — HTML buttons layered over the SVG, positioned by left/top percent.
  // Each is focusable in chronological order; Enter/Space opens the card.
  // -------------------------------------------------------------------------
  function makePin(stop, idx) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "map-pin" + (stop.today ? " map-pin--today" : "");
    btn.setAttribute("data-stop", stop.id);
    btn.style.left = (stop.x * 100) + "%";
    btn.style.top = (stop.y * 100) + "%";
    // aria-label: "Universidad de Carabobo, until 2017"
    btn.setAttribute("aria-label", stop.org + ", " + stop.years);
    btn.setAttribute("aria-haspopup", "dialog");

    var core = document.createElement("span");
    core.className = "map-pin__core";
    core.setAttribute("aria-hidden", "true");
    btn.appendChild(core);

    // the live "today" pin reuses the dot--live pulse pattern via a ring child
    if (stop.today) {
      var pulse = document.createElement("span");
      pulse.className = "map-pin__pulse";
      pulse.setAttribute("aria-hidden", "true");
      btn.appendChild(pulse);
    }

    btn.addEventListener("click", function () { openCard(stop.id); });
    return btn;
  }

  // -------------------------------------------------------------------------
  // Place card — a per-OS bottom sheet. role=dialog, aria-modal=false (the map
  // stays interactive behind it). Labelled by its title (the org).
  // -------------------------------------------------------------------------
  function buildCard() {
    cardWrap = document.createElement("div");
    cardWrap.className = "map-card-wrap";
    cardWrap.hidden = true;

    cardEl = document.createElement("div");
    cardEl.className = "map-card";
    cardEl.setAttribute("role", "dialog");
    cardEl.setAttribute("aria-modal", "false");
    cardEl.setAttribute("aria-labelledby", "mapCardTitle");
    cardEl.hidden = true;

    // grabber (decorative bottom-sheet handle)
    var grab = document.createElement("span");
    grab.className = "map-card__grab";
    grab.setAttribute("aria-hidden", "true");
    cardEl.appendChild(grab);

    var head = document.createElement("div");
    head.className = "map-card__head";

    var titleWrap = document.createElement("div");
    titleWrap.className = "map-card__titlewrap";

    var place = document.createElement("p");
    place.className = "map-card__place";
    place.id = "mapCardPlace";

    var title = document.createElement("h3");
    title.className = "map-card__title";
    title.id = "mapCardTitle";

    titleWrap.appendChild(place);
    titleWrap.appendChild(title);

    var close = document.createElement("button");
    close.type = "button";
    close.className = "map-card__close";
    close.setAttribute("aria-label", "Close place card");
    close.innerHTML = "<svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M18 6 6 18M6 6l12 12'/></svg>";
    close.addEventListener("click", function () { closeCard(); });

    head.appendChild(titleWrap);
    head.appendChild(close);
    cardEl.appendChild(head);

    var role = document.createElement("p");
    role.className = "map-card__role";
    role.id = "mapCardRole";
    cardEl.appendChild(role);

    var years = document.createElement("p");
    years.className = "map-card__years";
    years.id = "mapCardYears";
    cardEl.appendChild(years);

    cardWrap.appendChild(cardEl);

    // tapping the dimmed area outside the card dismisses it
    cardWrap.addEventListener("click", function (e) {
      if (e.target === cardWrap) closeCard();
    });

    return cardWrap;
  }

  function stopById(id) {
    for (var i = 0; i < stops.length; i++) { if (stops[i].id === id) return stops[i]; }
    return null;
  }

  // -------------------------------------------------------------------------
  // Card-scoped Escape handling. os.js wires a global bubble-phase "Escape
  // closes the open app" handler on `document` once, at boot (wireHomeControl,
  // long before any app mounts). Because both listeners live on the same
  // target, registration order decides call order for same-phase listeners —
  // so a handler added here later, in the bubble phase, would always fire
  // *after* the global one and stopPropagation() would be too late.
  // Registering in the CAPTURE phase instead guarantees this handler runs
  // first regardless of when the global one was registered, so
  // stopImmediatePropagation() here reliably prevents the global handler
  // (and anything else on document) from seeing the event. Wired on card
  // open, unwired on card close — mirrors os.js's lock-screen _wireEscape
  // add/remove-on-dismiss pattern.
  // -------------------------------------------------------------------------
  var cardEscHandler = null;

  function wireCardEscape() {
    if (cardEscHandler) return; // already wired
    cardEscHandler = function (e) {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        e.preventDefault();
        closeCard();
      }
    };
    document.addEventListener("keydown", cardEscHandler, true);
  }

  function unwireCardEscape() {
    if (!cardEscHandler) return;
    document.removeEventListener("keydown", cardEscHandler, true);
    cardEscHandler = null;
  }

  function openCard(id) {
    var stop = stopById(id);
    if (!stop || !cardEl) return;

    // fill content (textContent only — authored data, but kept consistent)
    var placeEl = cardEl.querySelector("#mapCardPlace");
    var titleEl = cardEl.querySelector("#mapCardTitle");
    var roleEl  = cardEl.querySelector("#mapCardRole");
    var yearsEl = cardEl.querySelector("#mapCardYears");

    if (stop.place) { placeEl.textContent = stop.place; placeEl.hidden = false; }
    else { placeEl.textContent = ""; placeEl.hidden = true; }
    titleEl.textContent = stop.org;
    roleEl.textContent = stop.role;
    yearsEl.textContent = stop.years;

    // mark the selected pin
    pinEls.forEach(function (p) {
      var on = p.getAttribute("data-stop") === id;
      p.classList.toggle("map-pin--active", on);
      p.setAttribute("aria-expanded", on ? "true" : "false");
    });

    var swapping = activePin && activePin !== id;
    activePin = id;

    // card is now open (or swapping content): (re)wire the capture-phase
    // Escape handler that closes just the card. wireCardEscape() no-ops if
    // already wired (the swap case), so it's safe to call unconditionally.
    wireCardEscape();

    // show + slide up (or swap content if a card is already open)
    if (mapWrap) mapWrap.classList.add("map-wrap--carded");  // hides the caption
    cardWrap.hidden = false;
    cardEl.hidden = false;
    if (swapping || REDUCED) {
      // already visible: content swapped in place (no re-entrance), or instant
      cardEl.classList.add("map-card--in");
    } else {
      cardEl.classList.remove("map-card--in");
      // force reflow so the slide-up transition runs from the hidden state
      void cardEl.offsetWidth;
      cardEl.classList.add("map-card--in");
    }
  }

  function closeCard() {
    if (!cardEl || activePin == null) return;
    var idToBlur = activePin;
    activePin = null;
    unwireCardEscape();
    pinEls.forEach(function (p) {
      p.classList.remove("map-pin--active");
      p.setAttribute("aria-expanded", "false");
    });
    if (mapWrap) mapWrap.classList.remove("map-wrap--carded");  // restore the caption

    if (REDUCED) {
      cardEl.classList.remove("map-card--in");
      cardEl.hidden = true;
      cardWrap.hidden = true;
    } else {
      cardEl.classList.remove("map-card--in");
      setTimeout(function () {
        if (activePin == null) { cardEl.hidden = true; cardWrap.hidden = true; }
      }, CARD_HIDE_MS);
    }

    // return focus to the pin the card belonged to
    var pin = mapWrap && mapWrap.querySelector('.map-pin[data-stop="' + idToBlur + '"]');
    if (pin) { try { pin.focus(); } catch (e) {} }
  }

  // -------------------------------------------------------------------------
  // Route-draw choreography. The route uses pathLength=1, so dashoffset goes
  // 1→0 over DRAW_MS. Pins pop in staggered, each timed to the fraction of the
  // path length where its x sits (linear approximation along the arc), so a pin
  // appears just as the drawn line reaches it.
  // -------------------------------------------------------------------------
  function drawRoute() {
    if (drawn) { showAllPins(); return; }
    drawn = true;

    if (REDUCED) {
      // pre-drawn: route solid, pins visible immediately, no pulse animation
      routeEl.classList.add("map-route--done");
      showAllPins();
      return;
    }

    // Start hidden (--draw pins the dashoffset at 1), then flip to --go to run
    // the stroke-draw transition. The flip is deferred with a short timeout
    // rather than rAF: the app opens inside a View Transition, during which
    // queued rAF callbacks can coalesce into the same frame as the initial
    // state — collapsing the transition. A timeout past the VT settle guarantees
    // a clean layout frame between the two states so the line actually draws.
    // The pins are sequenced from the same START moment, so they still pop in as
    // the line reaches them.
    routeEl.classList.add("map-route--draw");
    var START = 90;   // small delay so --draw paints before --go transitions
    setTimeout(function () { routeEl.classList.add("map-route--go"); }, START);

    // sequence the pins by their position along the route (use index fraction:
    // pins are evenly authored along the arc, so index/(n-1) tracks the draw)
    var n = stops.length;
    stops.forEach(function (stop, i) {
      var frac = n > 1 ? i / (n - 1) : 1;
      var at = START + Math.max(0, frac * DRAW_MS - PIN_LEAD);
      var pin = pinEls[i];
      setTimeout(function () {
        if (pin) pin.classList.add("map-pin--in");
      }, at);
    });
  }

  function showAllPins() {
    pinEls.forEach(function (p) { p.classList.add("map-pin--in"); });
    if (routeEl) routeEl.classList.add("map-route--done");
  }

  // Replace the SVG contents + reposition pins for a newly-known container
  // size. Shared by the ResizeObserver callback and onOpen()'s deferred-first-
  // draw fallback so both correct the same 390x699-fallback geometry the same
  // way. No-ops if mapWrap/routeEl aren't around yet (mount() hasn't run).
  function rebuildGeometry(w, h) {
    if (!mapWrap || !routeEl) return;
    var existingSvg = mapWrap.querySelector(".map-svg");
    if (!existingSvg) return;
    var newSvg = makeSVG(w, h);
    mapWrap.replaceChild(newSvg, existingSvg);
    positionPins(w, h);
    // restore draw state
    if (drawn) routeEl.classList.add("map-route--done");
  }

  // -------------------------------------------------------------------------
  // Build DOM (mount — called once on first open)
  // -------------------------------------------------------------------------
  function mount() {
    screenEl = document.querySelector('.app-screen[data-app="maps"]');
    if (!screenEl) return;
    bodyEl = screenEl.querySelector(".app-body");
    if (!bodyEl) return;

    bodyEl.innerHTML = "";

    // --- map surface ------------------------------------------------------
    mapWrap = document.createElement("div");
    mapWrap.className = "map-wrap";

    // Append mapWrap to DOM first so clientWidth/clientHeight reflect actual
    // layout; the SVG route endpoints depend on the container dimensions.
    bodyEl.appendChild(mapWrap);

    // On first mount the app-screen is still `display:none` (mount() runs
    // before the opening View Transition flips it to `.screen--active` — see
    // os.js openApp/Apps.ensure), so clientWidth/clientHeight read 0 here and
    // the || 390 / || 699 fallbacks are hit essentially every first open, not
    // just in some rare transitional case. Track that with sizedOnce so
    // onOpen() knows whether it's safe to run the draw choreography against
    // this geometry, or whether it must wait for the ResizeObserver below to
    // report the real size once the screen becomes visible.
    var mW = mapWrap.clientWidth  || 390;
    var mH = mapWrap.clientHeight || 699;
    sizedOnce = mapWrap.clientWidth > 0;
    var svg = makeSVG(mW, mH);
    mapWrap.appendChild(svg);

    // pins layered over the SVG
    pinEls = [];
    stops.forEach(function (stop, i) {
      var pin = makePin(stop, i);
      mapWrap.appendChild(pin);
      pinEls.push(pin);
    });
    positionPins(mW, mH);

    // route caption — a single quiet line (≈7,000 km)
    if (md.routeCaption) {
      var cap = document.createElement("p");
      cap.className = "map-caption";
      cap.textContent = md.routeCaption;
      mapWrap.appendChild(cap);
    }

    // tapping bare map (not a pin / not the card) closes any open card
    mapWrap.addEventListener("click", function (e) {
      if (activePin != null && !e.target.closest(".map-pin")) closeCard();
    });

    // --- place card (bottom sheet) ---------------------------------------
    bodyEl.appendChild(buildCard());

    // initial pin aria-expanded state
    pinEls.forEach(function (p) { p.setAttribute("aria-expanded", "false"); });

    // Rebuild the SVG route (and labels) when the container resizes so the
    // bezier endpoints stay aligned with the pins across orientations / sizes.
    if (typeof ResizeObserver !== "undefined") {
      var ro = new ResizeObserver(function () {
        if (!mapWrap || !routeEl) return;
        var w = mapWrap.clientWidth  || 390;
        var h = mapWrap.clientHeight || 699;
        // Still unsized (e.g. observed while the screen is display:none, or a
        // spurious 0-size callback mid-transition) — nothing to rebuild yet;
        // wait for the next callback that reports a real box.
        if (w === 0) return;
        var wasSizedOnce = sizedOnce;
        sizedOnce = true;
        rebuildGeometry(w, h);
        // This is the first time we've had real geometry, and onOpen() already
        // ran (against the placeholder 390x699 fallback) without drawing
        // because it saw !sizedOnce and deferred — run the draw choreography
        // now, against correct geometry. pendingFirstDraw / drawRoute()'s own
        // `drawn` guard keep this from ever double-drawing.
        if (!wasSizedOnce && pendingFirstDraw) {
          pendingFirstDraw = false;
          drawRoute();
        }
      });
      ro.observe(mapWrap);
    }
  }

  // -------------------------------------------------------------------------
  // App lifecycle
  // -------------------------------------------------------------------------
  GG.Apps.register({
    id: "maps",
    label: "Maps",

    mount: mount,

    onOpen: function () {
      syncMetaMaps();

      if (opened) {
        // re-open: route already drawn, pins already shown; nothing to replay
        return;
      }
      opened = true;

      // first open: draw the route, sequence the pins. If mount() ran before
      // the app-screen had real layout (display:none pre-VT, see mount()'s
      // sizedOnce comment) the route/pins were built against the 390x699
      // fallback — drawing now would animate a route that visually terminates
      // in the wrong place until the ResizeObserver's first real callback
      // corrects it (the exact misplaced-first-frame bug on tablet). Defer:
      // re-check on the next tick (same setTimeout-past-VT-settle idiom used
      // below in drawRoute()'s START delay and by ledger.js's runFirstOpen);
      // if the screen has settled to a real size by then, draw immediately.
      // Otherwise leave pendingFirstDraw set and let the ResizeObserver's
      // first real-size callback (in mount()) trigger the draw once the
      // screen actually becomes visible. drawRoute()'s own `drawn` guard
      // makes this safe even if both paths somehow fire.
      if (sizedOnce) {
        drawRoute();
      } else {
        pendingFirstDraw = true;
        setTimeout(function () {
          if (!pendingFirstDraw) return;   // ResizeObserver already handled it
          pendingFirstDraw = false;
          var w = mapWrap && mapWrap.clientWidth;
          var h = mapWrap && mapWrap.clientHeight;
          if (w > 0) {
            // Real size finally available (ResizeObserver hasn't fired yet,
            // e.g. unsupported, or its callback is merely queued behind this
            // timeout) — correct the fallback geometry before drawing.
            sizedOnce = true;
            rebuildGeometry(w, h);
          }
          // else: still unsized after 90ms (unusual) — draw against the
          // fallback geometry rather than hang forever; better a
          // slightly-off first frame than a route that never appears.
          drawRoute();
        }, 90);
      }
    },

    onClose: function () {
      syncMetaRestore();
      // dismiss any open card so re-open lands clean on the map
      if (activePin != null) {
        activePin = null;
        unwireCardEscape();
        if (cardEl) { cardEl.classList.remove("map-card--in"); cardEl.hidden = true; }
        if (cardWrap) cardWrap.hidden = true;
        if (mapWrap) mapWrap.classList.remove("map-wrap--carded");
        pinEls.forEach(function (p) {
          p.classList.remove("map-pin--active");
          p.setAttribute("aria-expanded", "false");
        });
      }
    }
  });

})();
