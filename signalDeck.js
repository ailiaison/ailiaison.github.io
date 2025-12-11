// signalDeck.js
(function () {
  // ---------- 0. FIND CONTAINER ----------
  const host = document.querySelector(".sig");
  if (!host) {
    console.warn("SignalDeck: .sig container not found");
    return;
  }

  // ---------- 1. INJECT STYLES ----------
  const style = document.createElement("style");
  style.textContent = `
    .sd-root {
      margin-top: 16px;
      background: radial-gradient(circle at top left, rgba(15,23,42,0.9), rgba(15,23,42,0.98));
      border-radius: 18px;
      border: 1px solid rgba(148,163,184,0.35);
      box-shadow: 0 18px 40px rgba(15,23,42,0.96);
      padding: 12px 14px 16px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text-main, #e5e7eb);
    }

    .sd-header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 10px;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .sd-title {
      font-size: 0.95rem;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      margin: 0 0 4px;
    }

    .sd-subtitle {
      font-size: 0.8rem;
      color: var(--text-muted, #9ca3af);
      max-width: 520px;
      margin: 0;
    }

    .sd-pill {
      font-size: 0.7rem;
      padding: 3px 10px;
      border-radius: 999px;
      border: 1px solid rgba(56,189,248,0.6);
      background: rgba(15,23,42,0.9);
      color: #7dd3fc;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }

    .sd-pill-dot {
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: #22c55e;
      box-shadow: 0 0 10px rgba(34,197,94,0.9);
    }

    .sd-layout {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    @media (min-width: 960px) {
      .sd-layout {
        flex-direction: row;
        align-items: flex-start;
      }
    }

    .sd-col {
      flex: 1 1 0;
      min-width: 0;
    }

    .sd-col-left {
      flex: 3 1 0;
    }

    .sd-col-right {
      flex: 2 1 0;
    }

    .sd-card {
      background: radial-gradient(circle at top left, rgba(15,23,42,0.75), rgba(15,23,42,0.95));
      border-radius: 14px;
      border: 1px solid rgba(51,65,85,0.8);
      padding: 10px 11px 12px;
      box-shadow: 0 10px 26px rgba(15,23,42,0.9);
    }

    .sd-card h3 {
      margin: 0 0 4px;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }

    .sd-card p {
      margin: 0 0 6px;
      font-size: 0.78rem;
      color: var(--text-muted, #9ca3af);
    }

    .sd-form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0,1fr));
      gap: 8px;
      margin-top: 4px;
    }

    @media (max-width: 720px) {
      .sd-form-grid {
        grid-template-columns: repeat(1, minmax(0,1fr));
      }
    }

    .sd-field {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 0.78rem;
    }

    .sd-field label {
      color: var(--text-muted, #9ca3af);
    }

    .sd-field input,
    .sd-field select {
      padding: 6px 8px;
      border-radius: 8px;
      border: 1px solid rgba(51,65,85,0.9);
      background: rgba(15,23,42,0.96);
      color: #e5e7eb;
      font-size: 0.82rem;
    }

    .sd-form-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 8px;
      margin-top: 8px;
      font-size: 0.75rem;
      color: var(--text-muted, #9ca3af);
      align-items: center;
    }

    .sd-btn-primary {
      padding: 7px 12px;
      border-radius: 999px;
      border: none;
      cursor: pointer;
      color: #f9fafb;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      display: inline-flex;
      gap: 6px;
      align-items: center;
    }

    .sd-btn-primary:hover {
      opacity: 0.96;
      transform: translateY(-1px);
      box-shadow: 0 14px 30px rgba(37,99,235,1);
    }

    .sd-btn-primary:active {
      opacity: 0.9;
      transform: translateY(0);
      box-shadow: 0 8px 20px rgba(15,23,42,1);
    }

    .sd-btn-primary i {
      font-size: 0.75rem;
    }

    .sd-summary {
      margin-top: 6px;
      font-size: 0.78rem;
      color: var(--text-muted, #9ca3af);
    }

    .sd-summary b {
      color: #e5e7eb;
    }

    .sd-chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 6px;
    }

    .sd-chip {
      font-size: 0.72rem;
      padding: 3px 8px;
      border-radius: 999px;
      border: 1px solid rgba(148,163,184,0.6);
      color: var(--text-muted, #9ca3af);
    }

    .sd-chip-strong {
      border-color: rgba(34,197,94,0.8);
      color: #bbf7d0;
    }

    .sd-pairs-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      font-size: 0.76rem;
    }

    .sd-pairs-table th,
    .sd-pairs-table td {
      padding: 4px 6px;
      border-bottom: 1px solid rgba(30,64,175,0.45);
      text-align: left;
    }

    .sd-pairs-table th {
      font-weight: 600;
      color: #cbd5f5;
      background: rgba(15,23,42,0.98);
    }

    .sd-tag {
      font-size: 0.7rem;
      padding: 2px 7px;
      border-radius: 999px;
      border: 1px solid rgba(148,163,184,0.6);
    }

    .sd-tag-opportunity {
      background: rgba(22,163,74,0.22);
      border-color: rgba(34,197,94,0.9);
      color: #bbf7d0;
    }

    .sd-tag-watch {
      background: rgba(250,204,21,0.18);
      border-color: rgba(234,179,8,0.9);
      color: #facc15;
    }

    .sd-tag-wait {
      background: rgba(55,65,81,0.9);
      border-color: rgba(75,85,99,0.9);
      color: #e5e7eb;
    }

    .sd-index-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-top: 4px;
    }

    .sd-index-value {
      font-size: 1.8rem;
      font-weight: 700;
    }

    .sd-index-caption {
      font-size: 0.74rem;
      color: var(--text-muted, #9ca3af);
      max-width: 200px;
      text-align: right;
    }

    .sd-index-trend {
      font-size: 0.76rem;
      margin-top: 2px;
    }

    .sd-index-trend-pos { color: #4ade80; }
    .sd-index-trend-neg { color: #f97373; }

    .sd-toast-area {
      position: relative;
      margin-top: 8px;
    }

    .sd-toast {
      position: absolute;
      right: 0;
      bottom: 0;
      max-width: 360px;
      background: radial-gradient(circle at top left, rgba(15,23,42,1), rgba(15,23,42,0.98));
      border-radius: 16px;
      border: 1px solid rgba(56,189,248,0.5);
      box-shadow: 0 18px 40px rgba(15,23,42,1);
      padding: 10px 12px;
      font-size: 0.78rem;
      opacity: 0;
      transform: translateY(10px);
      pointer-events: none;
    }

    .sd-toast.show {
      animation: sd-toast-in 0.4s ease-out forwards;
    }

    .sd-toast.hide {
      animation: sd-toast-out 0.3s ease-in forwards;
    }

    .sd-toast-title {
      font-weight: 600;
      margin-bottom: 2px;
    }

    .sd-toast-body {
      color: var(--text-main, #e5e7eb);
    }

    .sd-toast-meta {
      color: var(--text-muted, #9ca3af);
      font-size: 0.7rem;
      margin-top: 3px;
    }

    .sd-toast-badge {
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      padding: 2px 7px;
      border-radius: 999px;
      border: 1px solid rgba(34,197,94,0.6);
      color: #bbf7d0;
      margin-bottom: 4px;
      display: inline-block;
    }

    @keyframes sd-toast-in {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes sd-toast-out {
      from { opacity: 1; transform: translateY(0); }
      to   { opacity: 0; transform: translateY(12px); }
    }
  `;
  document.head.appendChild(style);

  // ---------- 2. BUILD MARKUP ----------
  host.innerHTML = "";
  const root = document.createElement("div");
  root.className = "sd-root";
  root.innerHTML =
    '<div class="sd-header">' +
      '<div>' +
        '<h2 class="sd-title">Signal Deck — FX & risk radar</h2>' +
        '<p class="sd-subtitle">' +
          'Simulated module that helps exporters turn intuitive commodity trading into a ' +
          'data-driven process: FX windows, geopolitical signals and logistics hints.' +
        "</p>" +
      "</div>" +
      '<div class="sd-pill">' +
        '<span class="sd-pill-dot"></span>' +
        "<span>AI auto deals helper</span>" +
      "</div>" +
    "</div>" +
    '<div class="sd-layout">' +
      '<div class="sd-col sd-col-left">' +
        '<div class="sd-card">' +
          "<h3>Deal parameters</h3>" +
          "<p>Describe your trade and start the simulated signal engine.</p>" +
          '<form id="sdDealForm">' +
            '<div class="sd-form-grid">' +
              '<div class="sd-field">' +
                "<label for=\"sdCommodity\">Commodity</label>" +
                '<input id="sdCommodity" type="text" placeholder="e.g. crude oil, wheat, urea" />' +
              "</div>" +
              '<div class="sd-field">' +
                "<label for=\"sdExporter\">Exporting country</label>" +
                '<input id="sdExporter" type="text" placeholder="e.g. Russia, Ghana, Kenya" />' +
              "</div>" +
              '<div class="sd-field">' +
                "<label for=\"sdCurrency\">Payment currency</label>" +
                '<input id="sdCurrency" type="text" placeholder="e.g. CNY, AED, USD" />' +
              "</div>" +
              '<div class="sd-field">' +
                "<label for=\"sdMarket\">Target market</label>" +
                '<input id="sdMarket" type="text" placeholder="e.g. China, EU, ECOWAS" />' +
              "</div>" +
            "</div>" +
            '<div class="sd-form-actions">' +
              '<button type="submit" class="sd-btn-primary">' +
                '<span>Run signal simulation</span>' +
              "</button>" +
              '<span>Simulation only. No real market or news data – logic is mocked for demo.</span>' +
            "</div>" +
          "</form>" +
          '<div id="sdSummary" class="sd-summary">No deal loaded yet — using generic ECOWAS ↔ Russia profile.</div>' +
          '<div class="sd-chip-row">' +
            '<span class="sd-chip sd-chip-strong">Optimised FX payout (RUB/CNY, KES/AED, etc.)</span>' +
            '<span class="sd-chip">Geopolitical narrative & sanctions sentiment (mocked)</span>' +
            '<span class="sd-chip">Logistics frictions & hedging hints (mocked)</span>' +
          "</div>" +
        "</div>" +
      "</div>" +
      '<div class="sd-col sd-col-right">' +
        '<div class="sd-card">' +
          "<h3>FX opportunity scanner</h3>" +
          "<p>Simulated FX pairs that could maximise local-currency revenue for your deal.</p>" +
          '<div class="sd-index-row">' +
            '<div>' +
              '<div class="sd-index-value" id="sdIndexValue">0.0</div>' +
              '<div id="sdIndexTrend" class="sd-index-trend sd-index-trend-pos">waiting for signals…</div>' +
            "</div>" +
            '<div class="sd-index-caption">' +
              "Synthetic \"payout advantage\" index. Higher values mean stronger FX edge to lock in deals now." +
            "</div>" +
          "</div>" +
          '<table class="sd-pairs-table" id="sdPairsTable">' +
            "<thead>" +
              "<tr>" +
                "<th>Pair</th>" +
                "<th>Rate</th>" +
                "<th>Signal</th>" +
                "<th>Comment</th>" +
              "</tr>" +
            "</thead>" +
            "<tbody></tbody>" +
          "</table>" +
          '<div class="sd-toast-area">' +
            '<div id="sdToast" class="sd-toast"></div>' +
          "</div>" +
        "</div>" +
      "</div>" +
    "</div>";

  host.appendChild(root);

  // ---------- 3. STATE & DATA ----------
  const deal = {
    commodity: "",
    exporter: "",
    currency: "",
    market: "",
  };

  const pairs = [
    { key: "RUB/CNY", base: 9.30 },
    { key: "KES/AED", base: 0.027 },
    { key: "GHS/USD", base: 0.068 },
    { key: "RUB/TRY", base: 0.31 },
  ];

  const state = {
    tick: 0,
    indexHistory: [],
    timer: null,
  };

  // ---------- 4. DOM REFS ----------
  const form = root.querySelector("#sdDealForm");
  const summaryEl = root.querySelector("#sdSummary");
  const indexValueEl = root.querySelector("#sdIndexValue");
  const indexTrendEl = root.querySelector("#sdIndexTrend");
  const pairsTable = root.querySelector("#sdPairsTable tbody");
  const toastEl = root.querySelector("#sdToast");

  // ---------- 5. HELPERS ----------
  function randn() {
    // simple normal-ish noise
    let s = 0;
    for (let i = 0; i < 6; i++) s += Math.random();
    return s / 6 - 0.5;
  }

  function formatRate(x) {
    if (x >= 1) return x.toFixed(2);
    if (x >= 0.1) return x.toFixed(3);
    return x.toFixed(4);
  }

  function updateSummary() {
    if (!deal.commodity && !deal.exporter && !deal.currency && !deal.market) {
      summaryEl.textContent =
        "No deal loaded yet — using generic ECOWAS ↔ Russia export profile with mixed energy & agri flows.";
      return;
    }

    const c = deal.commodity || "your commodity";
    const e = deal.exporter || "your exporting country";
    const cur = deal.currency || "trade currency";
    const m = deal.market || "target market";

    summaryEl.innerHTML =
      "Simulating signals for <b>" +
      c +
      "</b> exported from <b>" +
      e +
      "</b> with payment in <b>" +
      cur +
      "</b> towards <b>" +
      m +
      "</b>. " +
      "Signal Deck will highlight FX windows where your local currency is weaker against the settlement currency, " +
      "maximising local-currency proceeds and helping you cover domestic costs.";
  }

  function classifySignal(score) {
    if (score > 0.65) return "opportunity";
    if (score > 0.35) return "watch";
    return "wait";
  }

  function labelForSignal(sig) {
    if (sig === "opportunity") return "OPPORTUNITY";
    if (sig === "watch") return "WATCH";
    return "WAIT";
  }

  function commentForSignal(sig, delta) {
    if (sig === "opportunity") {
      return "Local currency is meaningfully weaker vs. settlement currency — lock deals in next 24–48h.";
    }
    if (sig === "watch") {
      return "Momentum building. Monitor closely — potential window forming.";
    }
    if (delta < 0) {
      return "Pair moved against exporter — less attractive now.";
    }
    return "Neutral zone. No clear statistical edge.";
  }

  function showToast(best) {
    if (!best) return;

    const commodityText = deal.commodity || "your commodity";
    const cur = deal.currency || "settlement currency";

    const directionSentence =
      "Current synthetic rate for " +
      best.key +
      " is " +
      formatRate(best.rate) +
      " (" +
      (best.delta > 0 ? "+" : "") +
      best.delta.toFixed(2) +
      "% vs. baseline).";

    const adviceSentence =
      "This favours exporters paid in " +
      cur +
      " and converting back into their local currency. " +
      "Recommended to structure and close the deal within the next 24–48 hours.";

    toastEl.innerHTML =
      '<div class="sd-toast-badge">FX BUY WINDOW</div>' +
      '<div class="sd-toast-title">' +
      "Favourable moment for selling " +
      commodityText +
      " under " +
      best.key +
      "</div>" +
      '<div class="sd-toast-body">' +
      directionSentence +
      " " +
      adviceSentence +
      "</div>" +
      '<div class="sd-toast-meta">' +
      "Simulated NLP/geopolitics and logistics layers are assumed supportive (no real data, demo only)." +
      "</div>";

    toastEl.classList.remove("hide");
    toastEl.classList.add("show");
    toastEl.style.pointerEvents = "auto";

    setTimeout(function () {
      toastEl.classList.remove("show");
      toastEl.classList.add("hide");
      toastEl.style.pointerEvents = "none";
    }, 6500);
  }

  // ---------- 6. SIMULATION STEP ----------
  function step() {
    state.tick += 1;
    const rowHtml = [];
    let indexAcc = 0;
    let best = null;

    pairs.forEach(function (p) {
      const noise = randn() * 0.035;
      const rate = Math.max(0.0001, p.base * (1 + noise));
      const delta = ((rate - p.base) / p.base) * 100;

      // Synthetic "edge" score: stronger when local currency weakens (rate up if quoted that way)
      const rawScore = Math.max(0, Math.min(1, 0.5 + delta / 12));
      const sig = classifySignal(rawScore);

      indexAcc += rawScore;

      if (!best || rawScore > best.score) {
        best = { key: p.key, rate: rate, delta: delta, score: rawScore, sig: sig };
      }

      let tagClass = "sd-tag sd-tag-wait";
      if (sig === "opportunity") tagClass = "sd-tag sd-tag-opportunity";
      else if (sig === "watch") tagClass = "sd-tag sd-tag-watch";

      rowHtml.push(
        "<tr>" +
          "<td>" +
          p.key +
          "</td>" +
          "<td>" +
          formatRate(rate) +
          "</td>" +
          '<td><span class="' +
          tagClass +
          '">' +
          labelForSignal(sig) +
          "</span></td>" +
          "<td>" +
          commentForSignal(sig, delta) +
          "</td>" +
        "</tr>"
      );
    });

    pairsTable.innerHTML = rowHtml.join("");

    const index = indexAcc / pairs.length;
    state.indexHistory.push(index);
    if (state.indexHistory.length > 50) state.indexHistory.shift();

    const prev = state.indexHistory.length > 1 ? state.indexHistory[state.indexHistory.length - 2] : index;
    const diff = index - prev;

    indexValueEl.textContent = (index * 100).toFixed(1);

    indexTrendEl.classList.remove("sd-index-trend-pos", "sd-index-trend-neg");
    if (diff > 0.002) {
      indexTrendEl.classList.add("sd-index-trend-pos");
      indexTrendEl.textContent =
        "Edge improving for exporters (" + (diff * 100).toFixed(2) + " pts move in this tick).";
    } else if (diff < -0.002) {
      indexTrendEl.classList.add("sd-index-trend-neg");
      indexTrendEl.textContent =
        "Edge fading for exporters (" + (diff * 100).toFixed(2) + " pts move in this tick).";
    } else {
      indexTrendEl.textContent = "Stable regime — no major change in FX edge.";
    }

    // Occasionally show toast for best opportunity
    if (best && best.sig === "opportunity" && Math.random() < 0.35) {
      showToast(best);
    }
  }

  function startSimulation() {
    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(step, 1400);
  }

  // ---------- 7. FORM HANDLER ----------
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      deal.commodity = (root.querySelector("#sdCommodity").value || "").trim();
      deal.exporter = (root.querySelector("#sdExporter").value || "").trim();
      deal.currency = (root.querySelector("#sdCurrency").value || "").trim();
      deal.market = (root.querySelector("#sdMarket").value || "").trim();
      updateSummary();
      // лёгкий "пинок" симуляции, чтобы сразу было видно обновление
      step();
    });
  }

  // ---------- 8. INIT ----------
  updateSummary();
  startSimulation();
})();
