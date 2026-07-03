/* =========================================================================
   GianOS — Mail app
   Vanilla JS, no dependencies. Registers the Mail app with GG.Apps.

   A pre-drafted email composer. One screen, simple reveal choreography
   using the standard .pop pattern. The compose card shows header fields
   (To, From, Subject) and a short pre-drafted body with a soft-underlined
   blank for the visitor to fill in mentally. Two CTAs: a primary "Send"
   button that opens mailto:, and a secondary "or LinkedIn →" link.

   Tablet split view (@container device 700px, see mail.css): an iPad-Mail
   style layout — a mailbox sidebar (Drafts, Sent, Trash) on the left, the
   compose card on the right. Built additively here, same idiom as
   messages.js's buildSplitView: purely new DOM, inert on the phone tier
   (mail.css hides .mail-sidebar and unwraps .mail-pane below the
   breakpoint), so the phone experience is untouched. Sent/Trash are one
   interaction deep — clicking a mailbox swaps the pane to a tiny empty
   state with a way back to the draft; Drafts is always the way back.

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
  var paneEl = null;      // .mail-pane — holds the compose card OR a mailbox empty state
  var draftCard = null;   // the compose card itself, re-shown when a visitor comes back

  // state
  var opened = false;    // has Mail been opened at least once?
  var activeBox = "drafts";

  // -------------------------------------------------------------------------
  // Mailbox sidebar (tablet split view only — inert on phone, see mail.css)
  // Drafts is the one real mailbox; Sent and Trash are one interaction deep,
  // dry-wit empty states with a way back. Purely additive DOM, same idiom as
  // messages.js's buildSplitView.
  // -------------------------------------------------------------------------
  var MAILBOXES = [
    { id: "drafts", label: "Drafts", count: "1", empty: null },
    { id: "sent",   label: "Sent",   count: "0",
      empty: { title: "Nothing sent yet", body: "That part's on you." } },
    { id: "trash",  label: "Trash",  count: "0",
      empty: { title: "Empty", body: "As it should be." } }
  ];

  var sidebarRows = {}; // id -> row element, for the active-state toggle

  function buildSidebar(appBody) {
    var sidebar = document.createElement("aside");
    sidebar.className = "mail-sidebar";
    sidebar.setAttribute("aria-label", "Mailboxes");

    var head = document.createElement("div");
    head.className = "mail-sidebar__head";
    head.textContent = "Mail";
    sidebar.appendChild(head);

    var list = document.createElement("div");
    list.className = "mail-boxes";
    list.setAttribute("role", "list");

    MAILBOXES.forEach(function (box) {
      var row = document.createElement("button");
      row.type = "button";
      row.className = "mail-box" + (box.id === "drafts" ? " mail-box--active" : "");
      row.setAttribute("role", "listitem");
      row.setAttribute("aria-current", box.id === "drafts" ? "true" : "false");

      var label = document.createElement("span");
      label.className = "mail-box__label";
      label.textContent = box.label;
      row.appendChild(label);

      var count = document.createElement("span");
      count.className = "mail-box__count";
      count.textContent = box.count;
      row.appendChild(count);

      row.addEventListener("click", function () { selectBox(box.id); });
      list.appendChild(row);
      sidebarRows[box.id] = row;
    });

    sidebar.appendChild(list);
    appBody.appendChild(sidebar);
  }

  function selectBox(id) {
    if (id === activeBox) return;
    activeBox = id;

    Object.keys(sidebarRows).forEach(function (boxId) {
      var row = sidebarRows[boxId];
      var isActive = boxId === id;
      row.classList.toggle("mail-box--active", isActive);
      row.setAttribute("aria-current", isActive ? "true" : "false");
    });

    if (!paneEl) return;
    if (id === "drafts") {
      showDraft();
      return;
    }
    var box = MAILBOXES.filter(function (b) { return b.id === id; })[0];
    showMailboxEmpty(box);
  }

  function showDraft() {
    paneEl.innerHTML = "";
    paneEl.appendChild(draftCard);
  }

  function showMailboxEmpty(box) {
    paneEl.innerHTML = "";

    var wrap = document.createElement("div");
    wrap.className = "mail-empty";

    var title = document.createElement("p");
    title.className = "mail-empty__title";
    title.textContent = box.empty.title;
    wrap.appendChild(title);

    var body = document.createElement("p");
    body.className = "mail-empty__body";
    body.textContent = box.empty.body;
    wrap.appendChild(body);

    var back = document.createElement("button");
    back.type = "button";
    back.className = "mail-empty__back";
    back.textContent = "← Back to the draft";
    back.addEventListener("click", function () { selectBox("drafts"); });
    wrap.appendChild(back);

    paneEl.appendChild(wrap);
  }

  // -------------------------------------------------------------------------
  // Build DOM (mount — called once on first open)
  // -------------------------------------------------------------------------
  function mount() {
    screenEl = document.querySelector('.app-screen[data-app="mail"]');
    if (!screenEl) return;
    var bodyEl = screenEl.querySelector(".app-body");
    if (!bodyEl) return;

    bodyEl.innerHTML = "";

    // ---- sidebar (tablet only; CSS keeps this display:none on phone) ------
    buildSidebar(bodyEl);

    // ---- pane wrapper (tablet only; CSS keeps this display:contents on
    // phone, so the card sits directly in .app-body's flow like before) ----
    paneEl = document.createElement("div");
    paneEl.className = "mail-pane";
    bodyEl.appendChild(paneEl);

    // ---- compose card wrapper ---------------------------------------------
    var card = document.createElement("div");
    card.className = "mail-card";

    // ---- To field (header) ------------------------------------------------
    var toRow = document.createElement("div");
    toRow.className = "mail-row mail-row--to pop";

    var toLabel = document.createElement("span");
    toLabel.className = "mail-row__label";
    toLabel.textContent = "to:";

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
    fromLabel.textContent = "from:";

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
    subjectLabel.textContent = "subject:";

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
    var part1 = document.createTextNode("Hi Gian, saw your OS. Want to talk about ");
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

    draftCard = card;
    paneEl.appendChild(card);

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
