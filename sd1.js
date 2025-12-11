(function () {
  // ---------- 0. FIND HOST ----------
  var host = document.querySelector(".sig");
  if (!host) {
    console.warn("SignalDeck: .sig container not found");
    return;
  }

  var hasChartJs = typeof Chart !== "undefined";

  // ---------- 1. INJECT STYLES ----------
  var style = document.createElement("style");
  style.textContent =
    ".sd-root{" +
      "margin-top:-5px;" +
      "background:radial-gradient(circle at top left,rgba(15,23,42,0.9),rgba(15,23,42,0.98));" +
      "border-radius:18px;" +
      "/*border:1px solid rgba(148,163,184,0.35);*/" +
      "padding:12px 14px 16px;" +
      "font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;" +
      "color:var(--text-main,#e5e7eb);" +
    "}" +

    ".sd-header{" +
      "display:flex;flex-wrap:wrap;justify-content:space-between;" +
      "gap:10px;align-items:flex-start;margin-bottom:8px;" +
    "}" +
    ".sd-title{" +
      "font-size:0.95rem;text-transform:uppercase;letter-spacing:0.16em;" +
      "margin:0 0 4px;" +
    "}" +
    ".sd-subtitle{" +
      "font-size:0.8rem;color:var(--text-muted,#9ca3af);max-width:520px;margin:0;" +
    "}" +
    ".sd-pill{" +
      "font-size:0.7rem;padding:3px 10px;border-radius:999px;" +
      "border:1px solid rgba(56,189,248,0.6);" +
      "background:rgba(15,23,42,0.9);" +
      "color:#7dd3fc;text-transform:uppercase;letter-spacing:0.16em;" +
      "display:inline-flex;align-items:center;gap:6px;white-space:nowrap;" +
    "}" +
    ".sd-pill-dot{" +
      "width:7px;height:7px;border-radius:999px;background:#22c55e;" +
      "animation:sd-pill-pulse 2.4s ease-in-out infinite;" +
    "}" +

    ".sd-layout{display:flex;flex-direction:column;gap:12px;}" +
    "@media (min-width:960px){" +
      ".sd-layout{flex-direction:row;align-items:flex-start;}" +
    "}" +
    ".sd-col{flex:1 1 0;min-width:0;}" +
    ".sd-col-left{flex:3 1 0;}" +
    ".sd-col-right{flex:2 1 0;}" +

    ".sd-card{" +
      "background:radial-gradient(circle at top left,rgba(15,23,42,0.75),rgba(15,23,42,0.95));" +
      "border-radius:14px;border:1px solid rgba(51,65,85,0.8);" +
      "padding:10px 11px 12px;" +
    "}" +
    ".sd-card h3{" +
      "margin:0 0 4px;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.12em;" +
    "}" +
    ".sd-card p{" +
      "margin:0 0 6px;font-size:0.78rem;color:var(--text-muted,#9ca3af);" +
    "}" +

    ".sd-form-grid{" +
      "display:grid;grid-template-columns:repeat(2,minmax(0,1fr));" +
      "gap:8px;margin-top:4px;" +
    "}" +
    "@media (max-width:720px){" +
      ".sd-form-grid{grid-template-columns:repeat(1,minmax(0,1fr));}" +
    "}" +
    ".sd-field{display:flex;flex-direction:column;gap:2px;font-size:0.78rem;}" +
    ".sd-field label{color:var(--text-muted,#9ca3af);}" +
    ".sd-field input{" +
      "padding:6px 8px;border-radius:8px;" +
      "border:1px solid rgba(51,65,85,0.9);" +
      "background:rgba(15,23,42,0.96);color:#e5e7eb;font-size:0.82rem;" +
    "}" +

    ".sd-form-actions{" +
      "display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;" +
      "margin-top:8px;font-size:0.75rem;color:var(--text-muted,#9ca3af);" +
      "align-items:center;" +
    "}" +
    ".sd-btn-primary{" +
      "padding:7px 12px;border-radius:8px;border:none;cursor:pointer;" +
      "background:linear-gradient(135deg,#22d3ee,#2563eb);" +
      "color:#f9fafb;font-size:0.8rem;font-weight:600;" +
      "letter-spacing:0.08em;text-transform:uppercase;" +
      "display:inline-flex;gap:6px;align-items:center;" +
      "transition:transform 0.12s ease-out,background 0.12s ease-out,opacity 0.12s;" +
    "}" +
    ".sd-btn-primary:hover{" +
      "opacity:0.96;transform:translateY(-1px);" +
    "}" +
    ".sd-btn-primary:active{" +
      "opacity:0.9;transform:translateY(0);" +
    "}" +

    ".sd-summary{" +
      "margin-top:6px;font-size:0.78rem;color:var(--text-muted,#9ca3af);" +
    "}" +
    ".sd-summary b{color:#e5e7eb;}" +

    ".sd-chip-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;}" +
    ".sd-chip{" +
      "font-size:0.72rem;padding:3px 8px;border-radius:999px;" +
      "border:1px solid rgba(148,163,184,0.6);" +
      "color:var(--text-muted,#9ca3af);" +
    "}" +
    ".sd-chip-strong{" +
      "border-color:rgba(34,197,94,0.8);color:#bbf7d0;" +
    "}" +

    ".sd-index-row{" +
      "display:flex;justify-content:space-between;align-items:baseline;margin-top:4px;" +
    "}" +
    ".sd-index-value{font-size:1.8rem;font-weight:700;}" +
    ".sd-index-caption{" +
      "font-size:0.74rem;color:var(--text-muted,#9ca3af);max-width:220px;text-align:right;display:none;" +
    "}" +
    ".sd-index-trend{font-size:0.76rem;margin-top:2px;}" +
    ".sd-index-trend-pos{color:#4ade80;}" +
    ".sd-index-trend-neg{color:#f97373;}" +

    ".sd-chart-main{" +
      "position:relative;height:170px;margin-top:6px;overflow:hidden;" +
      "border-radius:10px;border:1px solid rgba(30,64,175,0.6);" +
      "background:radial-gradient(circle at top,#020617,#020617 50%,#020617);" +
    "}" +
    ".sd-chart-main canvas{position:relative;z-index:1;}" +
    ".sd-chart-main::before{" +
      "content:'';position:absolute;inset:0;" +
      "background:linear-gradient(120deg,rgba(56,189,248,0.05),rgba(99,102,241,0.18),rgba(56,189,248,0.05));" +
      "opacity:0.8;mix-blend-mode:screen;" +
      "transform:translateX(-40%);" +
      "animation:sd-scan 14s linear infinite;" +
      "pointer-events:none;z-index:0;" +
    "}" +

    ".sd-mini-grid{" +
      "display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px;" +
    "}" +
    ".sd-mini{" +
      "position:relative;height:80px;border-radius:10px;" +
      "border:1px solid rgba(30,64,175,0.6);" +
      "background:radial-gradient(circle at top left,rgba(15,23,42,0.9),rgba(15,23,42,0.96));" +
      "padding:4px 6px 4px 6px;overflow:hidden;" +
    "}" +
    ".sd-mini-label{font-size:0.7rem;color:#cbd5f5;margin-bottom:1px;position:relative;z-index:1;}" +
    ".sd-mini canvas{position:absolute;left:0;right:0;bottom:0;top:14px;z-index:1;}" +
    ".sd-mini::after{" +
      "content:'';position:absolute;left:-30%;right:-30%;top:0;height:2px;" +
      "background:linear-gradient(to right,transparent,rgba(56,189,248,0.7),transparent);" +
      "opacity:0.7;animation:sd-mini-scan 9s linear infinite;z-index:0;" +
    "}" +

    ".sd-pairs-table{width:100%;border-collapse:collapse;margin-top:8px;font-size:0.76rem;}" +
    ".sd-pairs-table th,.sd-pairs-table td{" +
      "padding:4px 6px;border-bottom:1px solid rgba(30,64,175,0.45);text-align:left;" +
    "}" +
    ".sd-pairs-table th{" +
      "font-weight:600;color:#cbd5f5;background:rgba(15,23,42,0.98);" +
    "}" +
    ".sd-tag{" +
      "font-size:0.7rem;padding:2px 7px;border-radius:999px;" +
      "border:1px solid rgba(148,163,184,0.6);" +
    "}" +
    ".sd-tag-opportunity{" +
      "background:rgba(22,163,74,0.22);border-color:rgba(34,197,94,0.9);color:#bbf7d0;" +
    "}" +
    ".sd-tag-watch{" +
      "background:rgba(250,204,21,0.18);border-color:rgba(234,179,8,0.9);color:#facc15;" +
    "}" +
    ".sd-tag-wait{" +
      "background:rgba(55,65,81,0.9);border-color:rgba(75,85,99,0.9);color:#e5e7eb;" +
    "}" +

    ".sd-toast-area{position:relative;margin-top:8px;min-height:0;}" +
    ".sd-toast{" +
      "position:absolute;right:0;bottom:0;max-width:360px;" +
      "background:radial-gradient(circle at top left,rgba(15,23,42,1),rgba(15,23,42,0.98));" +
      "border-radius:16px;border:1px solid rgba(56,189,248,0.5);" +
      "padding:10px 12px;font-size:0.78rem;opacity:0;transform:translateY(10px);" +
      "pointer-events:none;" +
    "}" +
    ".sd-toast.show{animation:sd-toast-in 0.4s ease-out forwards;}" +
    ".sd-toast.hide{animation:sd-toast-out 0.3s ease-in forwards;}" +
    ".sd-toast-title{font-weight:600;margin-bottom:2px;}" +
    ".sd-toast-body{color:var(--text-main,#e5e7eb);}" +
    ".sd-toast-meta{color:var(--text-muted,#9ca3af);font-size:0.7rem;margin-top:3px;}" +
    ".sd-toast-badge{" +
      "font-size:0.68rem;text-transform:uppercase;letter-spacing:0.16em;" +
      "padding:2px 7px;border-radius:999px;" +
      "border:1px solid rgba(34,197,94,0.6);color:#bbf7d0;margin-bottom:4px;display:inline-block;" +
    "}" +

    "@keyframes sd-toast-in{" +
      "from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}" +
    "}" +
    "@keyframes sd-toast-out{" +
      "from{opacity:1;transform:translateY(0);}to{opacity:0;transform:translateY(12px);}" +
    "}" +
    "@keyframes sd-pill-pulse{" +
      "0%{transform:scale(1);opacity:0.8;}" +
      "50%{transform:scale(1.18);opacity:1;}" +
      "100%{transform:scale(1);opacity:0.8;}" +
    "}" +
    "@keyframes sd-scan{" +
      "0%{transform:translateX(-40%);}100%{transform:translateX(40%);}" +
    "}" +
    "@keyframes sd-mini-scan{" +
      "0%{transform:translateX(-20%);}100%{transform:translateX(20%);}" +
    "}";
  document.head.appendChild(style);

  // ---------- 2. BUILD DOM ----------
  host.innerHTML = "";
  var root = document.createElement("div");
  root.className = "sd-root";
  root.innerHTML =
    '<div class="sd-header">' +
      '<div>' +
        '<h2 class="sd-title">Signal Deck — FX & risk radar</h2>' +
        '<p class="sd-subtitle"><!--' +
          "Simulated module that finds better FX windows for your deal (RUB/CNY, KES/AED, etc.) " +
          "and wraps them into a simple, signal-based workflow." +
        "--></p>" +
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
          "<p>Parameters are auto-fetched from the main AI Liaison Officer form.<!--You may still edit them here.--></p>" +
          '<form id="sdDealForm">' +
            '<div class="sd-form-grid">' +
              '<div class="sd-field">' +
                '<label for="sdCommodity">Commodity</label>' +
                '<input id="sdCommodity" type="text" placeholder="e.g. crude oil, wheat, urea" />' +
              "</div>" +
              '<div class="sd-field">' +
                '<label for="sdExporter">Exporting country</label>' +
                '<input id="sdExporter" type="text" placeholder="e.g. Russia, Ghana, Kenya" />' +
              "</div>" +
              '<div class="sd-field">' +
                '<label for="sdCurrency">Payment currency</label>' +
                '<input id="sdCurrency" type="text" placeholder="e.g. CNY, AED, USD" />' +
              "</div>" +
              '<div class="sd-field">' +
                '<label for="sdMarket">Target market</label>' +
                '<input id="sdMarket" type="text" placeholder="e.g. China, EU, ECOWAS" />' +
              "</div>" +
            "</div>" +
            '<div class="sd-form-actions">' +
              '<button type="submit" class="sd-btn-primary">' +
                "<span>Run signal<!--simulation--></span>" +
              "</button>" +
              '<span><!-- Simulation only. No real market, news or port data — logic is mocked for demo. --></span>' +
            "</div>" +
          "</form>" +
          '<div id="sdSummary" class="sd-summary">' +
            "No deal loaded yet — using generic ECOWAS ↔ Russia export profile with mixed energy & agri flows." +
          "</div>" +
          '<div class="sd-chip-row">' +
            '<span class="sd-chip sd-chip-strong">FX windows: local currency weakness vs settlement currency</span>' +
            '<span class="sd-chip">Geopolitics / narrative risk (conceptual)</span>' +
            '<span class="sd-chip">Logistics frictions & hedging hints (conceptual)</span>' +
          "</div>" +
        "</div>" +
      "</div>" +
      '<div class="sd-col sd-col-right">' +
        '<div class="sd-card">' +
          "<h3>FX opportunity scanner</h3>" +
          "<p><!--Simulated FX pairs that could maximise local-currency proceeds for your deal.--></p>" +
          '<div class="sd-index-row">' +
            '<div>' +
              '<div class="sd-index-value" id="sdIndexValue">0.0</div>' +
              '<div id="sdIndexTrend" class="sd-index-trend sd-index-trend-pos">waiting for signals…</div>' +
            "</div>" +
            '<div class="sd-index-caption"><!--' +
              "Synthetic \"payout advantage\" index. Higher values mean stronger FX edge to lock in deals now." +
            "--></div>" +
          "</div>" +
          (hasChartJs
            ? '<div class="sd-chart-main"><canvas id="sdIndexChart"></canvas></div>' +
              '<div class="sd-mini-grid">' +
                '<div class="sd-mini">' +
                  '<div class="sd-mini-label">RUB/CNY</div>' +
                  '<canvas id="sdChart_RUBCNY"></canvas>' +
                "</div>" +
                '<div class="sd-mini">' +
                  '<div class="sd-mini-label">KES/AED</div>' +
                  '<canvas id="sdChart_KESAED"></canvas>' +
                "</div>" +
                '<div class="sd-mini">' +
                  '<div class="sd-mini-label">GHS/USD</div>' +
                  '<canvas id="sdChart_GHSUSD"></canvas>' +
                "</div>" +
                '<div class="sd-mini">' +
                  '<div class="sd-mini-label">RUB/TRY</div>' +
                  '<canvas id="sdChart_RUBTRY"></canvas>' +
                "</div>" +
              "</div>"
            : ""
          ) +
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

  // ---------- 3. STATE ----------
  var deal = {
    commodity: "",
    exporter: "",
    currency: "",
    market: ""
  };

  var pairs = [
    { key: "RUB/CNY", base: 9.30, chartId: "sdChart_RUBCNY" },
    { key: "KES/AED", base: 0.027, chartId: "sdChart_KESAED" },
    { key: "GHS/USD", base: 0.068, chartId: "sdChart_GHSUSD" },
    { key: "RUB/TRY", base: 0.31, chartId: "sdChart_RUBTRY" }
  ];

  var state = {
    tick: 0,
    indexHistory: [],
    timer: null,
    maxPoints: 60
  };

  var pairHistory = {};
  pairs.forEach(function (p) {
    pairHistory[p.key] = [];
  });

  // ---------- 4. DOM REFS ----------
  var form = root.querySelector("#sdDealForm");
  var summaryEl = root.querySelector("#sdSummary");
  var indexValueEl = root.querySelector("#sdIndexValue");
  var indexTrendEl = root.querySelector("#sdIndexTrend");
  var pairsTable = root.querySelector("#sdPairsTable tbody");
  var toastEl = root.querySelector("#sdToast");

  var indexChart = null;
  var pairCharts = {};

  // ---------- 5. CHART INIT ----------
  if (hasChartJs) {
    var indexCanvas = root.querySelector("#sdIndexChart");
    var indexCtx = indexCanvas ? indexCanvas.getContext("2d") : null;

    function makeLineChart(ctx, label, colorMain, colorFill) {
      return new Chart(ctx, {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              label: label,
              data: [],
              borderColor: colorMain,
              backgroundColor: colorFill,
              borderWidth: 1.4,
              tension: 0.32,
              pointRadius: 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { display: false },
            y: { display: false }
          },
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
          }
        }
      });
    }

    if (indexCtx) {
      indexChart = new Chart(indexCtx, {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              label: "Payout advantage index",
              data: [],
              borderColor: "#6366f1",
              backgroundColor: "rgba(99,102,241,0.25)",
              borderWidth: 1.6,
              tension: 0.32,
              pointRadius: 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { display: false },
            y: {
              display: true,
              ticks: {
                color: "#6b7280",
                callback: function (v) {
                  return v > 0 ? "+" + v.toFixed(1) : v.toFixed(1);
                }
              },
              grid: { color: "rgba(30,64,175,0.45)" }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
          }
        }
      });
    }

    pairs.forEach(function (p, idx) {
      var canvasMini = root.querySelector("#" + p.chartId);
      if (!canvasMini) return;
      var c = canvasMini.getContext("2d");
      var colors = ["#38bdf8", "#22c55e", "#f97373", "#facc15"];
      var fills = [
        "rgba(56,189,248,0.2)",
        "rgba(34,197,94,0.2)",
        "rgba(248,113,113,0.2)",
        "rgba(250,204,21,0.2)"
      ];
      pairCharts[p.key] = makeLineChart(
        c,
        p.key,
        colors[idx % colors.length],
        fills[idx % fills.length]
      );
    });
  }

  function pushToChart(chart, value) {
    if (!chart) return;
    var labels = chart.data.labels;
    var data = chart.data.datasets[0].data;
    labels.push("");
    data.push(value);
    if (data.length > state.maxPoints) {
      data.shift();
      labels.shift();
    }
    chart.update("none");
  }

  // ---------- 6. HELPERS ----------
  function randn() {
    var s = 0;
    for (var i = 0; i < 6; i++) s += Math.random();
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

    var c = deal.commodity || "your commodity";
    var e = deal.exporter || "your exporting country";
    var cur = deal.currency || "trade currency";
    var m = deal.market || "target market";

    summaryEl.innerHTML =
      "Signals for <b>" +
      c +
      "</b> exported from <b>" +
      e +
      "</b> with payment in <b>" +
      cur +
      "</b> towards <b>" +
      m +
      "</b>. " +
      "Signal Deck highlights FX windows where your local currency is weaker against the settlement currency, " +
      "maximising local-currency proceeds and helping cover domestic costs.";
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
      return "Local currency is meaningfully weaker vs settlement currency — lock deals in the next 24–48h.";
    }
    if (sig === "watch") {
      return "Momentum building, potential window forming — monitor closely.";
    }
    if (delta < 0) {
      return "Pair moved against exporter — less attractive at this moment.";
    }
    return "Neutral regime, no clear statistical edge.";
  }

  function classifyTrendText(diff) {
    if (diff > 0.002) {
      return {
        text: "Edge improving for exporters (" + (diff * 100).toFixed(2) + " pts in this tick).",
        cls: "sd-index-trend-pos"
      };
    }
    if (diff < -0.002) {
      return {
        text: "Edge fading for exporters (" + (diff * 100).toFixed(2) + " pts in this tick).",
        cls: "sd-index-trend-neg"
      };
    }
    return {
      text: "Stable regime — no major change in FX edge.",
      cls: ""
    };
  }

  function showToast(best) {
    if (!best) return;

    var commodityText = deal.commodity || "your commodity";
    var cur = deal.currency || "settlement currency";

    var directionSentence =
      "Current synthetic rate for " +
      best.key +
      " is " +
      formatRate(best.rate) +
      " (" +
      (best.delta > 0 ? "+" : "") +
      best.delta.toFixed(2) +
      "% vs baseline).";

    var adviceSentence =
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
      "Simulated NLP / geopolitics / logistics layers are assumed supportive (no real data, demo only)." +
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

  // ---------- 7. AUTO-BIND FROM MAIN APP ----------
  function readAny(el) {
    if (!el) return "";
    if (typeof el.value === "string") return el.value;
    if (el.textContent) return el.textContent;
    return "";
  }

  function autoBindFromMain() {
    var mainCommodity = document.querySelector(
      "#cargoType, #commodity, #goodsType, [data-role='commodity']"
    );
    var mainExporter = document.querySelector(
      "#exportCountry, #originCountry, #origin, [data-role='exportCountry']"
    );
    var mainCurrency = document.querySelector(
      "#paymentCurrency, #dealCurrency, #currency, [data-role='paymentCurrency']"
    );
    var mainMarket = document.querySelector(
      "#marketCountry, #destinationCountry, #destination, [data-role='marketCountry']"
    );

    var fCommodity = root.querySelector("#sdCommodity");
    var fExporter = root.querySelector("#sdExporter");
    var fCurrency = root.querySelector("#sdCurrency");
    var fMarket = root.querySelector("#sdMarket");

    if (mainCommodity && fCommodity && !fCommodity.value) {
      fCommodity.value = readAny(mainCommodity).trim();
    }
    if (mainExporter && fExporter && !fExporter.value) {
      fExporter.value = readAny(mainExporter).trim();
    }
    if (mainCurrency && fCurrency && !fCurrency.value) {
      fCurrency.value = readAny(mainCurrency).trim();
    }
    if (mainMarket && fMarket && !fMarket.value) {
      fMarket.value = readAny(mainMarket).trim();
    }

    // one-time listeners: если пользователь меняет форму основного приложения — подтягиваем
    if (mainCommodity) {
      mainCommodity.addEventListener("input", function () {
        if (fCommodity) fCommodity.value = readAny(mainCommodity).trim();
      });
      mainCommodity.addEventListener("change", function () {
        if (fCommodity) fCommodity.value = readAny(mainCommodity).trim();
      });
    }
    if (mainExporter) {
      mainExporter.addEventListener("input", function () {
        if (fExporter) fExporter.value = readAny(mainExporter).trim();
      });
      mainExporter.addEventListener("change", function () {
        if (fExporter) fExporter.value = readAny(mainExporter).trim();
      });
    }
    if (mainCurrency) {
      mainCurrency.addEventListener("input", function () {
        if (fCurrency) fCurrency.value = readAny(mainCurrency).trim();
      });
      mainCurrency.addEventListener("change", function () {
        if (fCurrency) fCurrency.value = readAny(mainCurrency).trim();
      });
    }
    if (mainMarket) {
      mainMarket.addEventListener("input", function () {
        if (fMarket) fMarket.value = readAny(mainMarket).trim();
      });
      mainMarket.addEventListener("change", function () {
        if (fMarket) fMarket.value = readAny(mainMarket).trim();
      });
    }
  }

  // ---------- 8. SIMULATION ----------
  function step() {
    state.tick += 1;
    var rowHtml = [];
    var indexAcc = 0;
    var best = null;

    pairs.forEach(function (p) {
      var noise = randn() * 0.035;
      var rate = Math.max(0.0001, p.base * (1 + noise));
      var delta = ((rate - p.base) / p.base) * 100;

      var rawScore = Math.max(0, Math.min(1, 0.5 + delta / 12));
      var sig = classifySignal(rawScore);

      indexAcc += rawScore;

      if (!best || rawScore > best.score) {
        best = { key: p.key, rate: rate, delta: delta, score: rawScore, sig: sig };
      }

      var history = pairHistory[p.key];
      history.push(rate);
      if (history.length > state.maxPoints) history.shift();

      if (hasChartJs && pairCharts[p.key]) {
        pushToChart(pairCharts[p.key], rate);
      }

      var tagClass = "sd-tag sd-tag-wait";
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

    var index = indexAcc / pairs.length;
    state.indexHistory.push(index);
    if (state.indexHistory.length > state.maxPoints) state.indexHistory.shift();

    var prevIndex =
      state.indexHistory.length > 1
        ? state.indexHistory[state.indexHistory.length - 2]
        : index;
    var diff = index - prevIndex;

    indexValueEl.textContent = (index * 100).toFixed(1);

    indexTrendEl.classList.remove("sd-index-trend-pos", "sd-index-trend-neg");
    var trendInfo = classifyTrendText(diff);
    indexTrendEl.textContent = trendInfo.text;
    if (trendInfo.cls) {
      indexTrendEl.classList.add(trendInfo.cls);
    }

    if (hasChartJs && indexChart) {
      pushToChart(indexChart, index * 100);
    }

    if (best && best.sig === "opportunity" && Math.random() < 0.35) {
      showToast(best);
    }
  }

  function startSimulation() {
    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(step, 1400);
  }

  // ---------- 9. FORM ----------
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      deal.commodity = (root.querySelector("#sdCommodity").value || "").trim();
      deal.exporter = (root.querySelector("#sdExporter").value || "").trim();
      deal.currency = (root.querySelector("#sdCurrency").value || "").trim();
      deal.market = (root.querySelector("#sdMarket").value || "").trim();
      updateSummary();
      step(); // подстройка симуляции под параметры сделки
    });
  }

  // ---------- 10. INIT ----------
  autoBindFromMain();
  updateSummary();
  startSimulation();
})();
