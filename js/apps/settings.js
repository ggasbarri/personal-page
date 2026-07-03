/* =========================================================================
   GianOS — Settings app
   Vanilla JS, no dependencies. Registers the Settings app with GG.Apps.

   Houses the theme toy (the dopamine recolor): a hue slider + preset swatches
   that rewrite --seed via GG.Theme, recoloring the whole OS live and persisting
   the choice. Also reflects the reduced-motion system setting (read-only) and
   keeps the relocated platform switch (its in-fiction home is here on mobile).

   The Appearance group is only built when relative-color is supported
   (GG.Theme.supported()) — without it the slider would be a dead control, so
   it is omitted entirely and the OS keeps its clay-red default.

   Tablet tier (@container device (min-width: 700px), see settings.css): a
   classic iPad-Settings split view. A left sidebar lists the same sections
   that stack on phone (Appearance, Platform, Accessibility, General) as
   selectable rows; the right pane shows only the selected section's body.
   Built here as purely additive DOM around the existing #settingsList
   sections (index.html untouched) — the sections themselves are relocated,
   never rebuilt, so the .os-switch--settings markup Platform.init() already
   wired stays intact either way. Inert on phone: the sidebar is display:none
   and every section stays visible, matching the single scrolling list that
   shipped before this wave. Selection is local app state (no router change,
   no hash); it resets to the first section per mount.

   Security note: every fragment is authored/static. The only dynamic value is
   the hue number (an integer 0..359 from a clamped range input), inserted into
   attribute/text contexts that never execute it.
   ========================================================================= */
(function () {
  "use strict";

  // Preset accent seeds. L/C pinned at the brand 0.47/0.155 (so contrast holds
  // and the family reads as one system) — except "slate", a deliberately
  // low-chroma neutral-accent option. Hue is the single variable.
  var PRESETS = [
    { id: "clay",   hue: 33,  c: 0.155, label: "Clay",   star: true },
    { id: "amber",  hue: 70,  c: 0.155, label: "Amber" },
    { id: "forest", hue: 150, c: 0.155, label: "Forest" },
    { id: "ocean",  hue: 250, c: 0.155, label: "Ocean" },
    { id: "plum",   hue: 320, c: 0.155, label: "Plum" },
    { id: "slate",  hue: 250, c: 0.045, label: "Slate" }  // low-chroma neutral accent
  ];

  GG.Apps.register({
    id: "settings",
    label: "Settings",

    mount: function () {
      var el         = GG.Util.el;
      var setHtml    = GG.Util.setHtml;
      var escapeHtml = GG.Util.escapeHtml;
      var Theme      = GG.Theme;

      var list = document.getElementById("settingsList");

      // ---- Accessibility: reflect the system reduced-motion preference -------
      // Read-only mirror of prefers-reduced-motion. Live-updates if the user
      // flips the OS setting while the page is open.
      var rmHint  = document.getElementById("set-reducemotion");
      var rmState = document.getElementById("set-reducemotion-state");
      if (rmHint && rmState && window.matchMedia) {
        var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        var paintRM = function () {
          var on = mq.matches;
          rmState.textContent = on ? "on" : "off";
          rmHint.textContent = "follows your system setting — currently " + (on ? "on" : "off");
        };
        paintRM();
        // Safari <14 uses addListener; modern browsers use addEventListener
        if (mq.addEventListener) mq.addEventListener("change", paintRM);
        else if (mq.addListener) mq.addListener(paintRM);
      }

      // ---- Appearance (the theme toy) ---------------------------------------
      // Only built when relative-color is supported; otherwise the OS stays
      // clay-red and this group never appears (no dead control).
      function buildAppearance() {
        var group = el("section", "settings-group settings-group--appearance");
        group.setAttribute("aria-labelledby", "set-appearance-h");

        // hue gradient track: enumerate oklch stops around the wheel at the
        // brand L/C so the slider previews the exact accent family it produces.
        var stops = [];
        for (var hh = 0; hh <= 360; hh += 30) {
          stops.push("oklch(0.47 0.155 " + hh + ")");
        }
        var trackGrad = "linear-gradient(90deg, " + stops.join(", ") + ")";

        // current hue (persisted) or the clay default
        var curHue = Theme.hue();
        var sliderVal = (curHue != null) ? curHue : 33;

        setHtml(group,
          "<h2 class='settings-group__h' id='set-appearance-h'>Appearance</h2>" +
          "<div class='settings-group__body'>" +
            "<div class='settings-row settings-row--stack'>" +
              "<div class='settings-row__main'>" +
                "<span class='settings-row__label'>Accent hue</span>" +
                "<span class='settings-row__hint'>Drag to re-seed the whole OS. Persisted on this device.</span>" +
              "</div>" +
              "<input class='hue-slider' id='hueSlider' type='range' min='0' max='359' step='1' " +
                "value='" + sliderVal + "' aria-label='Accent hue' " +
                "style='--hue-track:" + trackGrad + "'>" +
            "</div>" +
            "<div class='swatches' id='swatches' role='group' aria-label='Accent presets'></div>" +
            "<button class='settings-reset' id='hueReset' type='button'>" +
              "<svg viewBox='0 0 24 24' width='15' height='15' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M3 12a9 9 0 1 0 9-9'/><path d='M3 4v5h5'/></svg>" +
              "reset to clay</button>" +
          "</div>");

        // insert Appearance first so it sits at the top of the list
        list.insertBefore(group, list.firstChild);

        var slider    = group.querySelector("#hueSlider");
        var swatchWrap = group.querySelector("#swatches");
        var resetBtn  = group.querySelector("#hueReset");

        // build preset swatch buttons
        PRESETS.forEach(function (p) {
          var btn = el("button", "swatch");
          btn.type = "button";
          btn.setAttribute("data-hue", p.hue);
          btn.setAttribute("data-id", p.id);
          btn.setAttribute("aria-label", p.label + (p.star ? " (default)" : ""));
          btn.setAttribute("aria-pressed", "false");
          // preview chip uses the preset's exact seed (L/C may differ for slate)
          btn.style.setProperty("--swatch", "oklch(0.47 " + p.c + " " + p.hue + ")");
          setHtml(btn,
            "<span class='swatch__chip' aria-hidden='true'>" +
              (p.star ? "<span class='swatch__star'>★</span>" : "") +
            "</span>" +
            "<span class='swatch__name'>" + escapeHtml(p.label) + "</span>");
          swatchWrap.appendChild(btn);
        });
        var swatches = Array.prototype.slice.call(swatchWrap.querySelectorAll(".swatch"));

        // mark the active swatch (aria-pressed) when the current hue matches one
        function syncSwatchPressed(hue) {
          swatches.forEach(function (s) {
            var on = hue != null && String(s.getAttribute("data-hue")) === String(hue);
            s.setAttribute("aria-pressed", on ? "true" : "false");
          });
        }
        syncSwatchPressed(curHue);

        // live re-seed as the slider moves; clears any pressed preset that no
        // longer matches (a free drag is "custom").
        slider.addEventListener("input", function () {
          var h = parseInt(slider.value, 10);
          Theme.setHue(h);
          syncSwatchPressed(h);
        });

        // swatch click: snap slider + re-seed + mark pressed
        swatches.forEach(function (s) {
          s.addEventListener("click", function () {
            var h = parseInt(s.getAttribute("data-hue"), 10);
            slider.value = h;
            Theme.setHue(h);
            syncSwatchPressed(h);
          });
        });

        // reset: clear the seed (CSS falls back to clay-red) + snap controls
        resetBtn.addEventListener("click", function () {
          Theme.reset();
          slider.value = 33;
          syncSwatchPressed(33);  // clay preset lights up as the resting state
        });
      }
      if (Theme.supported() && list) buildAppearance();

      // ---- Tablet split view: sidebar + detail pane --------------------------
      // Classic iPad-Settings idiom: a left sidebar lists the same sections
      // that stack on phone, the right pane shows the selected one. Built as
      // purely additive DOM around the existing #settingsList sections — they
      // are relocated into a .settings-pane wrapper, never rebuilt, so the
      // .os-switch--settings instance Platform.init() already wired (and any
      // listeners settings.js just attached above) keep working untouched.
      // Inert on phone: settings.css hides .settings-sidebar and unwraps the
      // pane below the container threshold, so every section stays visible in
      // the single scrolling list exactly as before.
      function buildSplitView() {
        if (!list) return;
        var appBody = list.parentNode;                 // .app-body
        if (!appBody || appBody.querySelector(".settings-sidebar")) return; // idempotent

        var groups = Array.prototype.slice.call(list.querySelectorAll(".settings-group"));
        if (!groups.length) return;

        var sidebar = el("nav", "settings-sidebar");
        sidebar.setAttribute("aria-label", "Settings sections");
        var rowList = el("div", "settings-sidebar__list");
        rowList.setAttribute("role", "list");

        var rows = [];
        function select(index) {
          groups.forEach(function (g, i) {
            g.classList.toggle("settings-group--active", i === index);
          });
          rows.forEach(function (r, i) {
            r.setAttribute("aria-current", i === index ? "true" : "false");
          });
        }

        groups.forEach(function (g, i) {
          var heading = g.querySelector(".settings-group__h");
          var label = heading ? heading.textContent : "Section";
          var row = el("button", "settings-sidebar__row",
            "<span class='settings-sidebar__row-label'>" + escapeHtml(label) + "</span>" +
            "<svg class='settings-sidebar__row-chev' viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='m9 18 6-6-6-6'/></svg>");
          row.type = "button";
          row.setAttribute("role", "listitem");
          row.setAttribute("aria-current", "false");
          row.addEventListener("click", function () { select(i); });
          rowList.appendChild(row);
          rows.push(row);
        });
        sidebar.appendChild(rowList);

        // Pane wraps the existing list so it can scroll independently of the
        // fixed sidebar on tablet; on phone the CSS keeps it display:contents
        // so the sections sit in the .app-body flow exactly as before.
        var pane = el("div", "settings-pane");
        appBody.insertBefore(sidebar, list);
        appBody.insertBefore(pane, list);
        pane.appendChild(list);

        select(0); // default: first section, matches the phone reading order
      }
      buildSplitView();
    },

    onOpen: function () {},
    onClose: function () {}
  });
})();
