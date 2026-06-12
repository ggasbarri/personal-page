/* =========================================================================
   GianOS — Mail app
   Vanilla JS, no dependencies. Registers the Mail app with GG.Apps.

   A pre-drafted email composer. One screen, simple reveal choreography
   using the standard .pop pattern. The compose card shows header fields
   (To, From, Subject) and a short pre-drafted body with a soft-underlined
   blank for the visitor to fill in mentally. Two CTAs: a primary "Send"
   button that opens mailto:, and a secondary "or LinkedIn →" link.

   Security note: ALL content is authored, trusted static strings. No user
   input is persisted or transmitted. The "blank" is a visual affordance
   (styled <span>), not a form input. Dynamic theme-color meta is synced
   on open/close matching Ledger's pattern.
   ========================================================================= */
(function () {
  "use strict";

  var REDUCED = GG.REDUCED;

  // -------------------------------------------------------------------------
  // Theme-color meta sync — Mail wears a light sky-blue tint.
  // -------------------------------------------------------------------------
  var MAIL_THEME = "oklch(0.96 0.012 240)";   // matches --mail-surface

  function syncMetaMail() {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", MAIL_THEME);
  }
  function syncMetaRestore() {
    if (GG.Theme && GG.Theme._syncMeta) GG.Theme._syncMeta();
  }

  // -------------------------------------------------------------------------
  // DOM refs — populated once during mount()
  // -------------------------------------------------------------------------
  var screenEl = null;

  // state
  var opened = false;    // has Mail been opened at least once?

  // -------------------------------------------------------------------------
  // Build DOM (mount — called once on first open)
  // -------------------------------------------------------------------------
  function mount() {
    screenEl = document.querySelector('.app-screen[data-app="mail"]');
    if (!screenEl) return;
    var bodyEl = screenEl.querySelector(".app-body");
    if (!bodyEl) return;

    bodyEl.innerHTML = "";

    // ---- compose card wrapper ---------------------------------------------
    var card = document.createElement("div");
    card.className = "mail-card";

    // ---- To field (header) ------------------------------------------------
    var toRow = document.createElement("div");
    toRow.className = "mail-row mail-row--to pop";

    var toLabel = document.createElement("span");
    toLabel.className = "mail-row__label";
    toLabel.textContent = "To:";

    var toPill = document.createElement("span");
    toPill.className = "mail-row__pill";
    toPill.textContent = "hey@ggasbarri.com";

    toRow.appendChild(toLabel);
    toRow.appendChild(toPill);
    card.appendChild(toRow);

    // ---- From field -------------------------------------------------------
    var fromRow = document.createElement("div");
    fromRow.className = "mail-row pop";

    var fromLabel = document.createElement("span");
    fromLabel.className = "mail-row__label";
    fromLabel.textContent = "From:";

    var fromValue = document.createElement("span");
    fromValue.className = "mail-row__value";
    fromValue.textContent = "you";

    fromRow.appendChild(fromLabel);
    fromRow.appendChild(fromValue);
    card.appendChild(fromRow);

    // ---- Subject field ----------------------------------------------------
    var subjectRow = document.createElement("div");
    subjectRow.className = "mail-row pop";

    var subjectLabel = document.createElement("span");
    subjectLabel.className = "mail-row__label";
    subjectLabel.textContent = "Subject:";

    var subjectValue = document.createElement("span");
    subjectValue.className = "mail-row__value";
    subjectValue.textContent = "hello";

    subjectRow.appendChild(subjectLabel);
    subjectRow.appendChild(subjectValue);
    card.appendChild(subjectRow);

    // ---- divider ----------------------------------------------------------
    var divider = document.createElement("div");
    divider.className = "mail-divider";
    card.appendChild(divider);

    // ---- body section with drafted note and soft blank --------------------
    var bodySection = document.createElement("div");
    bodySection.className = "mail-body pop";

    var bodyText = document.createElement("p");
    bodyText.className = "mail-body__text";

    // Build the body text with a soft-underlined blank span (authored, trusted HTML)
    var part1 = document.createTextNode("Hi Gian — saw your OS. Want to talk about ");
    bodyText.appendChild(part1);

    var blank = document.createElement("span");
    blank.className = "mail-blank";
    blank.textContent = "something interesting";
    bodyText.appendChild(blank);

    var part2 = document.createTextNode(".");
    bodyText.appendChild(part2);

    bodySection.appendChild(bodyText);
    card.appendChild(bodySection);

    // ---- CTA buttons section ----------------------------------------------
    var ctaSection = document.createElement("div");
    ctaSection.className = "mail-cta pop";

    // Primary: Send button
    var sendBtn = document.createElement("button");
    sendBtn.className = "mail-btn mail-btn--primary";
    sendBtn.type = "button";
    sendBtn.textContent = "Send";
    sendBtn.addEventListener("click", function () {
      location.href = "mailto:hey@ggasbarri.com?subject=hello";
    });
    ctaSection.appendChild(sendBtn);

    // Secondary: LinkedIn link with "or" text
    var orSpan = document.createElement("span");
    orSpan.className = "mail-cta__or";
    orSpan.textContent = "or ";

    var linkedinLink = document.createElement("a");
    linkedinLink.className = "mail-link";
    linkedinLink.href = "https://www.linkedin.com/in/ggasbarri/";
    linkedinLink.target = "_blank";
    linkedinLink.rel = "noopener";
    linkedinLink.textContent = "LinkedIn";

    var arrow = document.createElement("span");
    arrow.className = "mail-cta__arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = " →";

    ctaSection.appendChild(orSpan);
    ctaSection.appendChild(linkedinLink);
    ctaSection.appendChild(arrow);
    card.appendChild(ctaSection);

    // ---- add footer text (small, muted) -----------------------------------
    var footer = document.createElement("p");
    footer.className = "mail-footer pop";
    footer.textContent = "Replies land at hey@ggasbarri.com";

    card.appendChild(footer);

    bodyEl.appendChild(card);

    // Store the pop elements for reveal choreography
    screenEl._mailPops = Array.prototype.slice.call(card.querySelectorAll(".pop"));
  }

  // -------------------------------------------------------------------------
  // First-open choreography
  // -------------------------------------------------------------------------
  function runFirstOpen() {
    var pops = (screenEl && screenEl._mailPops) || [];
    GG.Util.revealPops(pops, null);
  }

  // -------------------------------------------------------------------------
  // App lifecycle
  // -------------------------------------------------------------------------
  GG.Apps.register({
    id: "mail",
    label: "Mail",

    mount: mount,

    onOpen: function () {
      syncMetaMail();

      if (opened) {
        // re-open: everything already visible, no replay
        return;
      }
      opened = true;

      runFirstOpen();
    },

    onClose: function () {
      syncMetaRestore();
    }
  });

})();
