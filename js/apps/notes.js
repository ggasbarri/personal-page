/* =========================================================================
   GianOS — Notes app (the completion reward)
   Vanilla JS, no dependencies. Registers the Notes app with GG.Apps.

   Notes is a BONUS app (bonus:true): it sits outside the discovery tracker
   and stays hidden on the home grid until all six base apps are explored,
   at which point Collection.reward() wakes its icon onto the grid. The app
   itself is one pinned note in Gian's voice — the quiet payoff for opening
   everything.

   Security note: ALL content is authored, trusted static strings from
   APP_DATA.notes. No user input. Theme-color meta synced on open/close
   matching the other apps' pattern.
   ========================================================================= */
(function () {
  "use strict";

  var REDUCED = GG.REDUCED;
  var nd = (window.APP_DATA && window.APP_DATA.notes) || {};

  // Notes wears a warm paper-yellow tint (matches --notes-surface).
  var NOTES_THEME = "oklch(0.95 0.03 95)";

  function syncMetaNotes() {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", NOTES_THEME);
  }
  function syncMetaRestore() {
    if (GG.Theme && GG.Theme._syncMeta) GG.Theme._syncMeta();
  }

  var screenEl = null;
  var opened = false;

  function mount() {
    screenEl = document.querySelector('.app-screen[data-app="notes"]');
    if (!screenEl) return;
    var bodyEl = screenEl.querySelector(".app-body");
    if (!bodyEl) return;

    bodyEl.innerHTML = "";

    // ---- the pinned note card ---------------------------------------------
    var note = document.createElement("article");
    note.className = "note-card";

    // pin marker + meta line
    var head = document.createElement("div");
    head.className = "note-card__head pop";

    var pin = document.createElement("span");
    pin.className = "note-card__pin";
    pin.setAttribute("aria-hidden", "true");
    // small pin glyph
    pin.innerHTML = "<svg viewBox='0 0 24 24' width='15' height='15' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 17v5'/><path d='M9 10.8V4h6v6.8l2 3.2H7l2-3.2z'/></svg>";
    head.appendChild(pin);

    var meta = document.createElement("span");
    meta.className = "note-card__meta";
    meta.textContent = nd.meta || "pinned";
    head.appendChild(meta);
    note.appendChild(head);

    // title
    var title = document.createElement("h2");
    title.className = "note-card__title pop";
    title.textContent = nd.title || "a note";
    note.appendChild(title);

    // body paragraphs
    var lines = nd.lines || [];
    lines.forEach(function (text) {
      var p = document.createElement("p");
      p.className = "note-card__line pop";
      p.textContent = text;
      note.appendChild(p);
    });

    // sign-off
    if (nd.sign) {
      var sign = document.createElement("p");
      sign.className = "note-card__sign pop";
      sign.textContent = nd.sign;
      note.appendChild(sign);
    }

    bodyEl.appendChild(note);
    screenEl._notePops = Array.prototype.slice.call(note.querySelectorAll(".pop"));
  }

  function runFirstOpen() {
    var pops = (screenEl && screenEl._notePops) || [];
    GG.Util.revealPops(pops, null);
  }

  GG.Apps.register({
    id: "notes",
    label: "Notes",
    bonus: true,          // hidden until the reward unlocks it; outside the tracker

    mount: mount,

    onOpen: function () {
      syncMetaNotes();
      if (opened) return;   // re-open: already revealed, no replay
      opened = true;
      runFirstOpen();
    },

    onClose: function () {
      syncMetaRestore();
    }
  });

})();
