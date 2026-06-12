/* =========================================================================
   GianOS — home screen
   Renders the widgets, the app grid, and the dock from window.GIAN_OS.
   Icons are real buttons with tactile press physics (spring scale via CSS,
   haptic tap via JS); tapping one hands off to OSApps for the shared-element
   open. refresh() re-renders the grid — used when developer mode unlocks
   the Terminal icon.
   ========================================================================= */
window.OSHome = (function () {
  "use strict";

  var U = window.OSUtil;
  var el = U.el;
  var escapeHtml = U.escapeHtml;
  var sys = window.OSSystem;
  var data = window.GIAN_OS;

  var homeEl = document.getElementById("home");
  var built = false;

  function appById(id) {
    return data.apps.filter(function (a) { return a.id === id; })[0];
  }

  function devUnlocked() {
    try { return localStorage.getItem("gianos-dev") === "1"; } catch (e) { return false; }
  }

  function iconBtn(app) {
    var b = el("button", "icon",
      "<span class='icon__tile tint-" + app.tint + "'>" + U.svg(app.glyph, null) + "</span>" +
      "<span class='icon__label'>" + escapeHtml(app.name) + "</span>");
    b.type = "button";
    b.setAttribute("data-app", app.id);
    b.addEventListener("pointerdown", function () { sys.haptic("tap"); });
    b.addEventListener("click", function () {
      window.OSApps.open(app.id, b);
    });
    return b;
  }

  function render() {
    U.setHtml(homeEl, "");

    var widgets = el("div", "widgets");
    data.widgets.forEach(function (w) {
      widgets.appendChild(el("div", "widget widget--" + w.id, w.html));
    });
    homeEl.appendChild(widgets);

    var grid = el("div", "grid");
    grid.setAttribute("role", "list");
    data.apps.forEach(function (app) {
      if (data.dock.indexOf(app.id) !== -1) return;
      if (app.hidden && !devUnlocked()) return;
      var item = el("div", "grid__item");
      item.setAttribute("role", "listitem");
      item.appendChild(iconBtn(app));
      if (app.hidden) item.classList.add("grid__item--new"); // spring entrance
      grid.appendChild(item);
    });
    homeEl.appendChild(grid);

    var dock = el("div", "dock");
    dock.setAttribute("role", "list");
    data.dock.forEach(function (id) {
      var app = appById(id);
      if (!app) return;
      var item = el("div", "dock__item");
      item.setAttribute("role", "listitem");
      item.appendChild(iconBtn(app));
      dock.appendChild(item);
    });
    homeEl.appendChild(dock);
    built = true;
  }

  function refresh() { if (built) render(); }

  function focusApp(id) {
    var b = homeEl.querySelector('[data-app="' + id + '"]');
    if (b) b.focus();
  }

  return { render: render, refresh: refresh, focusApp: focusApp };
})();
