/* =========================================================================
   Ask Gianfranco — share sheet (contact beat)
   A real bottom sheet: slides up over the phone, drag-to-dismiss, and the
   primary target calls the Web Share API (navigator.share) when available.

   Layout follows the REAL platform sheets (CSS picks per body[data-os]):
     iOS    — grabber, header row (avatar + name + circled ✕), one native
              Share… circle, then a grouped inset list of action rows
              (label left, icon right). No Cancel button — iOS dropped it
              from share sheets in iOS 13.
     Android— drag handle, "Share" title, a row of tonal circular targets,
              28dp top corners.
   Both platforms get every action; each skin hides the other's affordance
   (iOS hides the copy/mail/linkedin circles, Android hides ✕ + the list).
   ========================================================================= */
window.AskShareSheet = (function () {
  "use strict";

  var U = window.AskUtil;
  var REDUCED = U.REDUCED;
  var el = U.el;
  var svg = U.svg;
  var escapeHtml = U.escapeHtml;
  var haptic = window.AskOS.haptic;

  var scrim, sheet, built = false, lastTrigger = null;
  var dragging = false, startY = 0, dragY = 0, sheetH = 0, isDesk = false;
  var SHARE = {
    title: "Ask Gianfranco",
    text: "Gianfranco Gasbarri, mobile systems, Aveiro.",
    url: location.href
  };

  function tIcon(name) {
    var p = {
      share: U.SHARE_PATH,
      copy:  "<rect x='9' y='9' width='11' height='11' rx='2.2'/><path d='M5 15V5a2 2 0 0 1 2-2h10'/>",
      mail:  "<rect x='2.5' y='4.5' width='19' height='15' rx='2.5'/><path d='m3 6 9 6 9-6'/>",
      close: "<path d='M6 6l12 12M18 6 6 18'/>"
    };
    return svg(p[name]);
  }
  function liLogo() {
    return "<svg viewBox='0 0 24 24' width='16' height='16' aria-hidden='true' fill='currentColor'><path d='M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z'/></svg>";
  }

  /* shared action handlers: the circles (Android) and the grouped rows (iOS)
     do exactly the same things */
  function doCopy(btn) {
    haptic("select");
    copyLink(SHARE.url, btn);
  }
  function doMail() {
    haptic("select");
    location.href = "mailto:hey@ggasbarri.com?subject=" + encodeURIComponent("Hello Gian") +
      "&body=" + encodeURIComponent("Saw your page (" + SHARE.url + ") and wanted to reach out.");
  }
  function doLinkedIn() {
    haptic("select");
    window.open("https://www.linkedin.com/in/ggasbarri/", "_blank", "noopener");
  }

  function target(cls, label, inner, handler) {
    var b = el("button", "sheet__target " + cls,
      "<span class='sheet__ticon'>" + inner + "</span><span class='sheet__tlabel'>" + escapeHtml(label) + "</span>");
    b.type = "button";
    b.addEventListener("click", handler);
    return b;
  }
  function actionRow(cls, label, inner, handler) {
    var b = el("button", "sheet__action " + cls,
      "<span class='sheet__alabel'>" + escapeHtml(label) + "</span>" + inner);
    b.type = "button";
    b.addEventListener("click", handler);
    return b;
  }

  function build() {
    scrim = el("div", "sheet-scrim"); scrim.hidden = true;
    sheet = el("aside", "sheet"); sheet.hidden = true;
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.setAttribute("aria-label", "Share Gianfranco's page");

    var grip = el("button", "sheet__grip"); grip.type = "button"; grip.setAttribute("aria-label", "Close share sheet");
    var title = el("span", "sheet__title", "Share"); // shown on Android only

    var head = el("div", "sheet__head",
      "<span class='sheet__avatar'><img src='assets/gianfranco.jpg' alt='' width='800' height='800'></span>" +
      "<span class='sheet__id'><span class='sheet__name'>Gianfranco Gasbarri</span>" +
      "<span class='sheet__sub'>ggasbarri.com</span></span>");
    var closeBtn = el("button", "sheet__close", tIcon("close"));
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.addEventListener("click", close);
    head.appendChild(closeBtn);

    var targets = el("div", "sheet__targets");
    // Native share first, when the browser exposes it (mobile + some desktop).
    if (navigator.share) {
      targets.appendChild(target("sheet__target--share", "Share…", tIcon("share"), function () {
        haptic("select");
        navigator.share(SHARE).then(function () { close(); }).catch(function () {});
      }));
    } else {
      // iOS skin shows only the native circle; without it the row collapses
      targets.classList.add("sheet__targets--noshare");
    }
    targets.appendChild(target("sheet__target--copy", "Copy link", tIcon("copy"), function () { doCopy(this); }));
    targets.appendChild(target("sheet__target--mail", "Email", tIcon("mail"), doMail));
    targets.appendChild(target("sheet__target--li", "LinkedIn", liLogo(), doLinkedIn));

    // grouped inset list (iOS layout; Android hides it)
    var actions = el("div", "sheet__actions");
    actions.appendChild(actionRow("sheet__action--copy", "Copy link", tIcon("copy"), function () { doCopy(this); }));
    actions.appendChild(actionRow("sheet__action--mail", "Email", tIcon("mail"), doMail));
    actions.appendChild(actionRow("sheet__action--li", "LinkedIn", liLogo(), doLinkedIn));

    sheet.appendChild(grip);
    sheet.appendChild(title);
    sheet.appendChild(head);
    sheet.appendChild(targets);
    sheet.appendChild(actions);

    var device = document.getElementById("app");
    device.appendChild(scrim);
    device.appendChild(sheet);

    scrim.addEventListener("click", close);
    grip.addEventListener("click", close);
    bindDrag(grip);
    bindDrag(head);
    built = true;
  }

  function copyLink(url, btn) {
    function done() {
      btn.classList.add("is-done");
      var lbl = btn.querySelector(".sheet__tlabel, .sheet__alabel");
      if (lbl) { lbl.textContent = "Copied"; setTimeout(function () { lbl.textContent = "Copy link"; btn.classList.remove("is-done"); }, 1600); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(fallback);
    } else { fallback(); }
    function fallback() {
      try {
        var ta = document.createElement("textarea");
        ta.value = url; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select(); document.execCommand("copy");
        document.body.removeChild(ta); done();
      } catch (e) {}
    }
  }

  /* drag-to-dismiss: track the pointer, follow it downward, dismiss past a
     threshold, otherwise spring back to the open position. */
  function frame(y) { return isDesk ? "translateY(" + y + "px)" : "translate(-50%," + y + "px)"; }
  function bindDrag(handle) {
    handle.addEventListener("pointerdown", function (e) {
      if (e.button != null && e.button !== 0) return;
      if (e.target.closest && e.target.closest(".sheet__close")) return; // ✕ taps never start a drag
      dragging = true; startY = e.clientY; dragY = 0;
      isDesk = window.AskOS.isFramed();
      sheetH = sheet.offsetHeight || 1;
      sheet.classList.add("is-dragging");
      sheet.classList.remove("is-animating");
      try { handle.setPointerCapture(e.pointerId); } catch (er) {}
    });
    handle.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      dragY = Math.max(0, e.clientY - startY);
      sheet.style.transform = frame(dragY);
      if (scrim) scrim.style.opacity = String(Math.max(0, 1 - (dragY / sheetH) * 0.9));
    });
    function up() {
      if (!dragging) return;
      dragging = false;
      sheet.classList.remove("is-dragging");
      sheet.classList.add("is-animating");
      if (scrim) scrim.style.opacity = "";
      if (dragY > Math.min(sheetH * 0.4, 130)) { close(); }
      else { sheet.style.transform = frame(0); }
    }
    handle.addEventListener("pointerup", up);
    handle.addEventListener("pointercancel", up);
  }

  function onKey(e) { if (e.key === "Escape") close(); }

  function visible(node) { return node && node.getClientRects().length > 0; }

  function open(trigger) {
    if (!built) build();
    lastTrigger = trigger || null;
    isDesk = window.AskOS.isFramed();
    sheet.hidden = false; scrim.hidden = false;
    sheet.style.transform = "";
    haptic("open");
    requestAnimationFrame(function () {
      sheet.classList.add("is-animating");
      scrim.classList.add("is-open");
      sheet.classList.add("is-open");
    });
    document.addEventListener("keydown", onKey);
    setTimeout(function () {
      var cands = sheet.querySelectorAll(".sheet__target, .sheet__action, .sheet__close, .sheet__grip");
      for (var i = 0; i < cands.length; i++) {
        if (visible(cands[i])) { cands[i].focus(); break; }
      }
    }, REDUCED ? 0 : 140);
  }

  function close() {
    if (!built) return;
    scrim.classList.remove("is-open");
    sheet.classList.remove("is-open");
    sheet.classList.add("is-animating");
    sheet.style.transform = "";
    if (scrim) scrim.style.opacity = "";
    document.removeEventListener("keydown", onKey);
    function fin() { sheet.hidden = true; scrim.hidden = true; sheet.removeEventListener("transitionend", fin); }
    if (REDUCED) { fin(); }
    else { sheet.addEventListener("transitionend", fin); setTimeout(fin, 700); }
    if (lastTrigger && lastTrigger.focus) lastTrigger.focus();
  }

  return { open: open };
})();
