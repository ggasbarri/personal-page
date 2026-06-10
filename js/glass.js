/* =========================================================================
   Liquid Glass — dynamic refraction maps
   Vanilla JS, no dependencies. Builds a per-surface displacement map from each
   glass element's real rounded-rectangle geometry and wires it into an SVG
   filter, so the backdrop bends hard at the rounded rim and stays flat in the
   centre — a true convex lens, the way Apple's Liquid Glass (and Aave's
   "Building Glass for the Web") reads. The old map was two static linear
   gradients, so it bent the backdrop uniformly; that flat shift is the tell
   this replaces.

   How it plugs in:
     - Each surface gets its own  <filter id="lq-glass-N">  injected into the
       shared off-canvas <defs>, and  el.style.setProperty('--lq', url(#id)).
     - CSS consumes  var(--lq)  inside backdrop-filter, which bends the live
       backdrop on Chromium (the only engine that supports it; see detect()).
     - Safari/Firefox can't refract the backdrop, so they keep the blurred
       frosted base. If this script never runs, var(--lq, none) collapses to
       none and every surface keeps that frosted base too. Nothing breaks.

   Maps are immutable per id: a given id always paints the same map, so there is
   no stale-filter-cache problem (the issue Aave hit on Safari when mutating a
   map under a fixed id). New sizes mint new ids; identical sizes reuse one
   filter — so a row of equal chips shares a single map, not one each.
   ========================================================================= */
window.LiquidGlass = (function () {
  "use strict";

  /* Per-surface tuning. blur stays in CSS; here we only own the lens geometry.
       bezel  — px width of the refracting rim band (how far in the bend reaches)
       scale  — px displacement amplitude at the very rim
     radius is read from each element's computed border-radius, so pills (chips)
     and rounded cards get the right curvature without hardcoding. */
  var SURFACES = [
    /* the composer's glass is painted on its ::before, which is inset:0 — so the
       .composer box is the right thing to measure, and the var set on .composer
       cascades into the pseudo (custom properties inherit into ::before). */
    { sel: ".composer",        bezel: 26, scale: 8 },
    { sel: ".chip",            bezel: 14, scale: 6 },
    { sel: ".notif",           bezel: 20, scale: 7 },
    { sel: ".sheet",           bezel: 30, scale: 10 },
    { sel: ".liveact__expand", bezel: 22, scale: 7 }
  ];

  var CHROMA = 1.5;              // red channel bends a touch further → glassy edge fringe
  var MARGIN = 32;              // px of neutral padding around the map / filter region,
                                // so the rim displacement isn't clipped flush to the box.
                                // Harmless to backdrop-filter (clipped to the border-box,
                                // and the margin is neutral anyway).
  var uid = 0;                   // monotonic filter-id counter
  var defs = null;               // <defs> host for generated filters
  var mapCache = {};             // (w×h×r×bezel) -> displacement-map data URL
  var filterCache = {};          // (w×h×r×bezel×scale) -> filter id
  var enabled = false;           // refraction actually applies (else frosted base)

  function getDefs() {
    if (defs) return defs;
    var svg = document.querySelector("svg.goo-defs");
    defs = svg ? svg.querySelector("defs") : null;
    return defs;
  }

  /* ---- displacement map -------------------------------------------------- *
     Encodes a per-pixel outward-normal × refraction-profile into R (x bend) and
     G (y bend), 128 = neutral. Flat in the core; ramps up steeply at the rim via
     f = 1 - sqrt(1 - t²) (convex, concentrates the bend right at the edge).

     Exploits the rounded rectangle's four-fold symmetry: only the top-left
     quadrant is computed, then mirrored into the other three (R reflects across
     the vertical axis, G across the horizontal), quartering the per-pixel work —
     the same optimisation Aave calls out. */
  function makeMap(w, h, r, bezel) {
    var key = w + "x" + h + "x" + r + "x" + bezel;
    if (mapCache[key]) return mapCache[key];

    // canvas is the element box plus a neutral MARGIN on every side; the rounded
    // rect sits centred at element size, so the map's rim lines up with the
    // element's edges while the margin (left at 128 = no displacement) gives the
    // element-filter path room to keep its drop shadow.
    var cw = w + MARGIN * 2, ch = h + MARGIN * 2;
    var cv = document.createElement("canvas");
    cv.width = cw; cv.height = ch;
    var ctx = cv.getContext("2d");
    var img = ctx.createImageData(cw, ch);
    var data = img.data;
    var hx = w / 2, hy = h / 2;                  // half-extents of the rounded rect
    var cx = cw / 2, cy = ch / 2;                // centre of the padded canvas
    var qw = Math.ceil(cw / 2), qh = Math.ceil(ch / 2);

    function put(x, y, dr, dg) {
      var i = (y * cw + x) * 4;
      data[i]     = 128 + dr;   // R: horizontal displacement
      data[i + 1] = 128 + dg;   // G: vertical displacement
      data[i + 2] = 128;        // B: unused by feDisplacementMap
      data[i + 3] = 255;
    }

    for (var y = 0; y < qh; y++) {
      for (var x = 0; x < qw; x++) {
        // sample at pixel centre, relative to the canvas centre (top-left quadrant)
        var px = (x + 0.5) - cx;
        var py = (y + 0.5) - cy;
        var ax = Math.abs(px), ay = Math.abs(py);
        // rounded-rect signed distance: negative inside, 0 on the boundary
        var ex = ax - (hx - r);
        var ey = ay - (hy - r);
        var ox = Math.max(ex, 0), oy = Math.max(ey, 0);
        var outside = Math.sqrt(ox * ox + oy * oy);
        var inside = Math.min(Math.max(ex, ey), 0);
        var d = outside + inside - r;       // < 0 inside the surface
        var edge = -d;                       // depth in from the rim (0 at the rim)

        var dr = 0, dg = 0;
        if (edge >= 0 && edge < bezel) {
          var t = (bezel - edge) / bezel;    // 1 at rim → 0 at band's inner edge
          var f = 1 - Math.sqrt(Math.max(0, 1 - t * t));
          // outward normal of the rounded rect
          var nx, ny;
          if (ex > 0 && ey > 0) {            // corner arc
            var l = Math.sqrt(ex * ex + ey * ey) || 1;
            nx = (ex / l) * Math.sign(px);
            ny = (ey / l) * Math.sign(py);
          } else if (ex > ey) {              // left/right straight edge
            nx = Math.sign(px); ny = 0;
          } else {                            // top/bottom straight edge
            nx = 0; ny = Math.sign(py);
          }
          dr = Math.round(nx * f * 127);
          dg = Math.round(ny * f * 127);
        }

        // mirror the quadrant into all four (reflect the offsets about 128)
        var rx = cw - 1 - x, by = ch - 1 - y;
        put(x, y, dr, dg);
        if (rx !== x)            put(rx, y, -dr, dg);
        if (by !== y)            put(x, by, dr, -dg);
        if (rx !== x && by !== y) put(rx, by, -dr, -dg);
      }
    }

    ctx.putImageData(img, 0, 0);
    var url = cv.toDataURL("image/png");
    mapCache[key] = url;
    return url;
  }

  /* ---- filter ------------------------------------------------------------ *
     Two displacement passes — red slightly stronger than green/blue — recombined
     for a subtle chromatic split at the rim, then softened. Same shape as the
     original #lq-glass, but fed a geometry-aware map. SourceGraphic is the
     backdrop when used in backdrop-filter.

     Primitives are built with createElementNS, NOT innerHTML: setting innerHTML
     on an SVG node can parse the children into the HTML namespace, leaving the
     <filter> with no recognised primitives — an empty filter, which Chromium
     renders as backdrop-filter with no blur (washed-out, over-translucent glass).
     Explicit namespaced nodes avoid that entirely. */
  var SVGNS = "http://www.w3.org/2000/svg";
  function fe(tag, attrs) {
    var el = document.createElementNS(SVGNS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  function makeFilter(w, h, r, bezel, scale) {
    var key = w + "x" + h + "x" + r + "x" + bezel + "x" + scale;
    if (filterCache[key]) return filterCache[key];
    var host = getDefs();
    if (!host) return null;

    var id = "lq-glass-" + (++uid);
    var map = makeMap(w, h, r, bezel);
    var rS = (scale * CHROMA).toFixed(2);
    var gS = scale.toFixed(2);
    var f = fe("filter", { id: id, "color-interpolation-filters": "sRGB" });
    // filter region = element box grown by MARGIN on each side (as a % of the box,
    // since filterUnits defaults to objectBoundingBox). The feImage map was padded
    // by the same MARGIN, so its rim still lines up with the element's edges while
    // the region stays roomy enough not to clip the rim displacement.
    var mx = (MARGIN / w * 100), my = (MARGIN / h * 100);
    f.setAttribute("x", (-mx).toFixed(2) + "%");
    f.setAttribute("y", (-my).toFixed(2) + "%");
    f.setAttribute("width", (100 + mx * 2).toFixed(2) + "%");
    f.setAttribute("height", (100 + my * 2).toFixed(2) + "%");

    var feImg = fe("feImage", { preserveAspectRatio: "none", x: "0", y: "0", width: "100%", height: "100%", result: "map" });
    feImg.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", map);
    feImg.setAttribute("href", map);
    f.appendChild(feImg);
    f.appendChild(fe("feDisplacementMap", { "in": "SourceGraphic", in2: "map", scale: rS, xChannelSelector: "R", yChannelSelector: "G", result: "rD" }));
    f.appendChild(fe("feColorMatrix", { "in": "rD", type: "matrix", values: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0", result: "rOnly" }));
    f.appendChild(fe("feDisplacementMap", { "in": "SourceGraphic", in2: "map", scale: gS, xChannelSelector: "R", yChannelSelector: "G", result: "gbD" }));
    f.appendChild(fe("feColorMatrix", { "in": "gbD", type: "matrix", values: "0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0", result: "gbOnly" }));
    f.appendChild(fe("feBlend", { "in": "rOnly", in2: "gbOnly", mode: "screen", result: "aberr" }));
    f.appendChild(fe("feGaussianBlur", { "in": "aberr", stdDeviation: "0.4" }));

    host.appendChild(f);
    filterCache[key] = id;
    return id;
  }

  function pxRadius(el, w, h) {
    var cs = getComputedStyle(el);
    var raw = parseFloat(cs.borderTopLeftRadius) || 0;
    return Math.min(raw, Math.min(w, h) / 2);
  }

  function applyOne(el, cfg) {
    var rect = el.getBoundingClientRect();
    var w = Math.round(rect.width), h = Math.round(rect.height);
    if (w < 8 || h < 8) return;                 // hidden / not laid out yet
    var r = pxRadius(el, w, h);
    var id = makeFilter(w, h, r, cfg.bezel, cfg.scale);
    if (id) el.style.setProperty("--lq", 'url("#' + id + '")');
  }

  /* (Re)apply maps to every registered surface. Cheap: maps are static and
     cached by size, so this is mostly a measure + var write. */
  function refresh() {
    if (!enabled) return;
    SURFACES.forEach(function (cfg) {
      var els = document.querySelectorAll(cfg.sel);
      for (var i = 0; i < els.length; i++) applyOne(els[i], cfg);
    });
  }

  /* Watch for glass surfaces added after load (cascade notifications, the share
     sheet) so they pick up a lens without each creation site knowing about us. */
  function observe() {
    if (!window.MutationObserver) return;
    var sels = SURFACES.map(function (c) { return c.sel; });
    var mo = new MutationObserver(function (muts) {
      if (!enabled) return;
      var hit = false;
      for (var m = 0; m < muts.length && !hit; m++) {
        var added = muts[m].addedNodes;
        for (var n = 0; n < added.length; n++) {
          var node = added[n];
          if (node.nodeType !== 1) continue;
          for (var s = 0; s < sels.length; s++) {
            if (node.matches && (node.matches(sels[s]) || node.querySelector(sels[s]))) { hit = true; break; }
          }
          if (hit) break;
        }
      }
      if (hit) refresh();
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  /* Decide whether the lens can apply at all.
     Only Chromium supports an SVG filter inside backdrop-filter, which is the
     one way to bend the *live backdrop* — so that's the real Liquid Glass lens
     (html.refract drives var(--lq) into backdrop-filter; see css/ios.css).
     Safari/Firefox can't reference an SVG filter from backdrop-filter, and
     routing it through element `filter` makes Safari drop the backdrop blur
     (washed-out, over-translucent glass) — so they keep the blurred frosted
     base instead. Capability-detected, no UA sniff. */
  function detect() {
    if (!(window.CSS && CSS.supports)) return null;
    if (CSS.supports("backdrop-filter", 'url("#x")') ||
        CSS.supports("-webkit-backdrop-filter", 'url("#x")')) return "refract";
    return null;
  }

  function init() {
    if (!getDefs()) return;
    var mode = detect();
    if (!mode) return;                          // keep frosted base everywhere
    document.documentElement.classList.add(mode);
    enabled = true;
    refresh();
    observe();
    var t;
    function onResize() { clearTimeout(t); t = setTimeout(refresh, 150); }
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
  }

  return { init: init, refresh: refresh };
})();
