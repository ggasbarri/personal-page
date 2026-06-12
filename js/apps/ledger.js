/* =========================================================================
   GianOS — Ledger app
   Vanilla JS, no dependencies. Registers the Ledger app with GG.Apps.

   The Economics degree rendered as a banking app: courses are transactions,
   the degree completion percentage is a savings goal. Content is real; the
   joke is structural. Quiet, dry, satisfying.

   Signature moment (first open):
   - The account balance count-up (animateCount) runs on the done/total span.
   - The progress bar fill scales from 0 → (done/total) via transform:scaleX
     with transform-origin:left, matching the .story-progress__fill pattern.
   - Transaction rows stagger in with the .pop idiom (revealPops).
   - The Matemáticas Financieras +10.0 row gets a one-time shimmer on reveal.
   Re-open: no replay — bar, count, rows are already visible (REDUCED state).

   Reduced motion: count instant, bar instant, rows instant — no transitions.

   Security note: ALL content is authored data from APP_DATA.ledger (trusted,
   shipped with the site). There is no user input. Dynamic strings are inserted
   via textContent, never innerHTML. The one authored HTML fragment (the footer
   line) uses textContent too.
   ========================================================================= */
(function () {
  "use strict";

  var ld = (window.APP_DATA && window.APP_DATA.ledger) || {};
  var account      = ld.account      || { name: "Economics", sub: "" };
  var goal         = ld.goal         || { label: "completion", done: 0, total: 1 };
  var transactions = ld.transactions || [];
  var footer       = ld.footer       || "";
  var REDUCED      = GG.REDUCED;

  // -------------------------------------------------------------------------
  // Theme-color meta sync — Ledger wears a light green-paper tint.
  // -------------------------------------------------------------------------
  var LEDGER_THEME = "oklch(0.96 0.012 160)";   // matches --ldg-surface

  function syncMetaLedger() {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", LEDGER_THEME);
  }
  function syncMetaRestore() {
    if (GG.Theme && GG.Theme._syncMeta) GG.Theme._syncMeta();
  }

  // -------------------------------------------------------------------------
  // DOM refs — populated once during mount()
  // -------------------------------------------------------------------------
  var screenEl  = null;
  var barFillEl = null;  // .ldg-bar__fill
  var countEl   = null;  // the span carrying data-count for done courses

  // state
  var opened = false;    // has Ledger been opened at least once?

  // -------------------------------------------------------------------------
  // Format helpers
  // -------------------------------------------------------------------------
  function fmtGrade(v) {
    // Display as "+10.0" or "+9.8" — always one decimal
    return "+" + v.toFixed(1);
  }

  // -------------------------------------------------------------------------
  // Build DOM (mount — called once on first open)
  // -------------------------------------------------------------------------
  function mount() {
    screenEl = document.querySelector('.app-screen[data-app="ledger"]');
    if (!screenEl) return;
    var bodyEl = screenEl.querySelector(".app-body");
    if (!bodyEl) return;

    bodyEl.innerHTML = "";

    // ---- account header card ----------------------------------------------
    var headerCard = document.createElement("div");
    headerCard.className = "ldg-header";

    var acctName = document.createElement("p");
    acctName.className = "ldg-header__name";
    acctName.textContent = account.name;
    headerCard.appendChild(acctName);

    // "balance" = the done/total readout with count-up on the done number
    var balWrap = document.createElement("div");
    balWrap.className = "ldg-header__balance";
    balWrap.setAttribute("aria-label", goal.done + " of " + goal.total + " courses cleared");

    countEl = document.createElement("span");
    countEl.className = "ldg-header__count";
    countEl.setAttribute("data-count", goal.done);
    // data-suffix and data-divide are not needed (integer, no suffix for count-up,
    // we append " / 24" as a sibling)
    countEl.textContent = REDUCED ? String(goal.done) : "0";

    var balSep = document.createElement("span");
    balSep.className = "ldg-header__sep";
    balSep.setAttribute("aria-hidden", "true");
    balSep.textContent = " / " + goal.total;

    balWrap.appendChild(countEl);
    balWrap.appendChild(balSep);
    headerCard.appendChild(balWrap);

    var acctSub = document.createElement("p");
    acctSub.className = "ldg-header__sub";
    acctSub.textContent = account.sub;
    headerCard.appendChild(acctSub);

    bodyEl.appendChild(headerCard);

    // ---- savings-goal progress bar ----------------------------------------
    var goalSection = document.createElement("div");
    goalSection.className = "ldg-goal";

    var goalLabel = document.createElement("div");
    goalLabel.className = "ldg-goal__meta";

    var goalText = document.createElement("span");
    goalText.className = "ldg-goal__label";
    goalText.textContent = goal.label;

    var goalPct = document.createElement("span");
    goalPct.className = "ldg-goal__pct";
    var pct = Math.round((goal.done / goal.total) * 100);
    goalPct.textContent = pct + "%";

    goalLabel.appendChild(goalText);
    goalLabel.appendChild(goalPct);

    var barTrack = document.createElement("div");
    barTrack.className = "ldg-bar";
    barTrack.setAttribute("role", "progressbar");
    barTrack.setAttribute("aria-valuenow", goal.done);
    barTrack.setAttribute("aria-valuemax", goal.total);
    barTrack.setAttribute("aria-valuemin", "0");
    barTrack.setAttribute("aria-label", "degree completion: " + goal.done + " of " + goal.total + " courses");

    barFillEl = document.createElement("span");
    barFillEl.className = "ldg-bar__fill";
    // Start collapsed; onOpen will trigger the width via --bar-prog custom property
    barFillEl.style.setProperty("--bar-prog", "0");
    barTrack.appendChild(barFillEl);

    goalSection.appendChild(goalLabel);
    goalSection.appendChild(barTrack);
    bodyEl.appendChild(goalSection);

    // ---- transaction list --------------------------------------------------
    var listSection = document.createElement("section");
    listSection.className = "ldg-movements";
    listSection.setAttribute("aria-label", "Courses");

    var listHead = document.createElement("h2");
    listHead.className = "ldg-movements__h";
    listHead.textContent = "movements";
    listSection.appendChild(listHead);

    var list = document.createElement("ul");
    list.className = "ldg-list";
    list.setAttribute("role", "list");

    // Collect rows that need pop-in animation
    var popEls = [];

    transactions.forEach(function (tx, i) {
      var row = document.createElement("li");
      row.className = "ldg-row pop" + (tx.pending ? " ldg-row--pending" : "");
      if (tx.pending) {
        row.setAttribute("aria-label", tx.label + " — pending");
      }

      var left = document.createElement("div");
      left.className = "ldg-row__left";

      var label = document.createElement("span");
      label.className = "ldg-row__label";
      label.textContent = tx.label;
      left.appendChild(label);

      if (tx.note) {
        var note = document.createElement("span");
        note.className = "ldg-row__note";
        note.textContent = tx.note;
        left.appendChild(note);
      }

      var right = document.createElement("div");
      right.className = "ldg-row__right";

      if (tx.pending) {
        var chip = document.createElement("span");
        chip.className = "ldg-chip";
        chip.textContent = "pending";
        right.appendChild(chip);
      } else if (tx.value != null) {
        var val = document.createElement("span");
        val.className = "ldg-row__value";
        // Mark the 10.0 row for the flourish
        if (tx.value === 10.0) {
          val.className += " ldg-row__value--best";
        }
        val.textContent = fmtGrade(tx.value);
        right.appendChild(val);
      }

      row.appendChild(left);
      row.appendChild(right);
      list.appendChild(row);
      popEls.push(row);
    });

    listSection.appendChild(list);
    bodyEl.appendChild(listSection);

    // ---- footer line -------------------------------------------------------
    if (footer) {
      var foot = document.createElement("p");
      foot.className = "ldg-footer";
      foot.textContent = footer;
      bodyEl.appendChild(foot);
    }

    // Store pop elements for use in onOpen
    screenEl._ldgPops = popEls;
  }

  // -------------------------------------------------------------------------
  // First-open choreography
  // -------------------------------------------------------------------------
  function runFirstOpen() {
    // 1. Count-up on the done number
    if (!REDUCED && countEl) {
      GG.Util.animateCount(countEl);
    }

    // 2. Bar fill: set --bar-prog to target fraction, CSS transition does the rest
    //    Small delay so the mount layout has settled; matches Maps' START=90 pattern.
    var TARGET_PROG = goal.done / goal.total;
    if (barFillEl) {
      if (REDUCED) {
        barFillEl.style.setProperty("--bar-prog", TARGET_PROG);
      } else {
        setTimeout(function () {
          barFillEl.style.setProperty("--bar-prog", TARGET_PROG);
        }, 90);
      }
    }

    // 3. Stagger rows in using the .pop / revealPops idiom
    var pops = (screenEl && screenEl._ldgPops) || [];
    GG.Util.revealPops(pops, null);

    // 4. Flourish: shimmer-once on the +10.0 value after its row pops in.
    //    The 10.0 row is index 3 in the transactions array (0-based after 3
    //    pending rows). revealPops delays = 90 + idx*110ms. We fire the shimmer
    //    right after that row's pop delay, then it self-removes so it never
    //    replays on re-open.
    if (!REDUCED) {
      var bestIdx = -1;
      for (var i = 0; i < pops.length; i++) {
        if (pops[i].querySelector(".ldg-row__value--best")) { bestIdx = i; break; }
      }
      if (bestIdx >= 0) {
        var shimmerAt = 90 + bestIdx * 110 + 180;  // pop delay + small buffer
        setTimeout(function () {
          var valEl = pops[bestIdx] && pops[bestIdx].querySelector(".ldg-row__value--best");
          if (valEl) {
            valEl.classList.add("ldg-row__value--shimmer");
            // Remove after one cycle so reduced-motion users who toggle after load
            // never see it, and re-open stays clean
            valEl.addEventListener("animationend", function () {
              valEl.classList.remove("ldg-row__value--shimmer");
            }, { once: true });
          }
        }, shimmerAt);
      }
    }
  }

  // -------------------------------------------------------------------------
  // App lifecycle
  // -------------------------------------------------------------------------
  GG.Apps.register({
    id: "ledger",
    label: "Ledger",

    mount: mount,

    onOpen: function () {
      syncMetaLedger();

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
