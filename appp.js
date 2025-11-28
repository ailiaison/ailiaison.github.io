const $ = (sel) => document.querySelector(sel);

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function riskClass(score) {
  const n = Number(score);
  if (!isFinite(n)) return "risk-medium";
  if (n <= 33) return "risk-low";
  if (n <= 66) return "risk-medium";
  return "risk-high";
}

function fmtMoney(n, currency = "USD") {
  const v = Number(n);
  if (!isFinite(v)) return "—";
  return (
    v.toLocaleString("en-US", { maximumFractionDigits: 2 }) + " " + currency
  );
}

/* ================== market board ================== */

const MARKET_BASE = {
  WTI: 78.2,
  BRENT: 82.5,
  WHEAT: 245.0,
  FERT: 410.0,
  REE_ND: 75.0,
  REE_DY: 350.0,
  REE_TB: 1500.0,
  REE_IDX: 120.0
};

const marketState = {};
for (const key in MARKET_BASE) {
  marketState[key] = { base: MARKET_BASE[key], value: MARKET_BASE[key] };
}

function computeFertilizerPrice(wheat, wti) {
  const base = MARKET_BASE.FERT;
  const energyPart = (wti || MARKET_BASE.WTI) * 4;
  const agriPart = (wheat || MARKET_BASE.WHEAT) * 0.6;
  return base * 0.4 + energyPart * 0.4 + agriPart * 0.2;
}

function computeReeIndex(nd, dy, tb) {
  nd = nd || MARKET_BASE.REE_ND;
  dy = dy || MARKET_BASE.REE_DY;
  tb = tb || MARKET_BASE.REE_TB;
  return nd * 0.4 + dy * 0.35 + tb * 0.25;
}

function updateMarketWidgets() {
  const widgets = document.querySelectorAll(".market-price");
  widgets.forEach((w) => {
    const key = w.getAttribute("data-market-key");
    if (!key || !marketState[key]) return;
    const span = w.querySelector(".value");
    if (!span) return;
    span.textContent = marketState[key].value.toFixed(2);
  });
}

function randomDrift() {
  ["WTI", "BRENT", "WHEAT", "REE_ND", "REE_DY", "REE_TB"].forEach((key) => {
    const s = marketState[key];
    const drift = s.base * 0.01;
    const delta = (Math.random() - 0.5) * 2 * drift;
    let next = s.value + delta;
    const lower = s.base * 0.85;
    const upper = s.base * 1.15;
    if (next < lower) next = lower;
    if (next > upper) next = upper;
    s.value = next;
  });

  marketState.FERT.value = computeFertilizerPrice(
    marketState.WHEAT.value,
    marketState.WTI.value
  );
  marketState.REE_IDX.value = computeReeIndex(
    marketState.REE_ND.value,
    marketState.REE_DY.value,
    marketState.REE_TB.value
  );

  updateMarketWidgets();
}

setInterval(randomDrift, 5000);
updateMarketWidgets();

/* ================ число прописью (RU) ================= */

function numberToWordsRu(num) {
  num = Math.floor(Number(num) || 0);
  if (num === 0) return "ноль";

  const units = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
  const unitsFem = ["", "одна", "две", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
  const teens = [
    "десять",
    "одиннадцать",
    "двенадцать",
    "тринадцать",
    "четырнадцать",
    "пятнадцать",
    "шестнадцать",
    "семнадцать",
    "восемнадцать",
    "девятнадцать"
  ];
  const tens = [
    "",
    "",
    "двадцать",
    "тридцать",
    "сорок",
    "пятьдесят",
    "шестьдесят",
    "семьдесят",
    "восемьдесят",
    "девяносто"
  ];
  const hundreds = [
    "",
    "сто",
    "двести",
    "триста",
    "четыреста",
    "пятьсот",
    "шестьсот",
    "семьсот",
    "восемьсот",
    "девятьсот"
  ];

  const forms = {
    rub: ["рубль", "рубля", "рублей"],
    th: ["тысяча", "тысячи", "тысяч"],
    mln: ["миллион", "миллиона", "миллионов"],
    mrd: ["миллиард", "миллиарда", "миллиардов"]
  };

  function getForm(n, one, few, many) {
    n = Math.abs(n) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return many;
    if (n1 > 1 && n1 < 5) return few;
    if (n1 === 1) return one;
    return many;
  }

  function triadToWords(num3, female) {
    let res = [];
    const h = Math.floor(num3 / 100);
    const t = Math.floor((num3 % 100) / 10);
    const u = num3 % 10;

    if (h) res.push(hundreds[h]);

    if (t > 1) {
      res.push(tens[t]);
      if (u > 0) {
        res.push((female ? unitsFem : units)[u]);
      }
    } else if (t === 1) {
      res.push(teens[u]);
    } else if (u > 0) {
      res.push((female ? unitsFem : units)[u]);
    }

    return res.join(" ");
  }

  const parts = [];
  const mrd = Math.floor(num / 1_000_000_000);
  const mln = Math.floor((num % 1_000_000_000) / 1_000_000);
  const th = Math.floor((num % 1_000_000) / 1000);
  const r = num % 1000;

  if (mrd) {
    parts.push(triadToWords(mrd, false));
    parts.push(getForm(mrd, forms.mrd[0], forms.mrd[1], forms.mrd[2]));
  }
  if (mln) {
    parts.push(triadToWords(mln, false));
    parts.push(getForm(mln, forms.mln[0], forms.mln[1], forms.mln[2]));
  }
  if (th) {
    parts.push(triadToWords(th, true));
    parts.push(getForm(th, forms.th[0], forms.th[1], forms.th[2]));
  }
  if (r) {
    parts.push(triadToWords(r, false));
  }

  parts.push(getForm(r, forms.rub[0], forms.rub[1], forms.rub[2]));
  return parts.join(" ");
}

/* ================ system prompt ================ */

const systemPrompt = `
Ты — логистический и геополитический ИИ-модуль платформы "Офицер связи".
Пользователь задаёт только базовые параметры: тип груза, объём (тонн), точку отправления и точку назначения.

Твоя задача:
1) Спроектировать оптимальный мультимодальный маршрут (минимум один морской участок, при необходимости перевалки и хабы).
2) Учитывать экспортно-импортные формальности и типичное распределение рисков (Incoterms можно выбирать по умолчанию — бери CIF как базовый сценарий и отражай это в assumptions).
3) Просчитать ориентировочные логистические издержки:
   - фрахт морского плеча;
   - стоимость бункера;
   - портовые сборы и обработку;
   - канальные сборы (если применимо);
   - страховку груза и рейса;
   - надбавку за санкционный / военный / пиратский риск;
   - прочие вероятные расходы (агентские, документация и т.п.).
4) Проанализировать мировую оперативную обстановку по маршруту:
   - геополитика и санкции;
   - войны, пиратство, зоны повышенного риска;
   - инфраструктурные узкие места (каналы, проливы, загруженность портов);
   - возможные альтернативные коридоры.
5) Вернуть СТРОГО Один JSON-объект по схеме ниже. Никакого текста вне JSON.

Схема целевого JSON:

{
  "summary": {
    "recommended_strategy": "краткое текстовое описание рекомендуемой логистической стратегии",
    "incoterms_comment": "как выбранные или предполагаемые Incoterms влияют на распределение рисков и затрат",
    "transshipment_required": true,
    "key_risks_short": ["список ключевых рисков в 1–2 словах каждый"]
  },
  "deal_metrics": {
    "cargo_tonnage": 50000,
    "cargo_value_usd": 20000000,
    "logistics_cost_total_usd": 1234567,
    "logistics_cost_per_tonne_usd": 24.6,
    "recommended_min_sale_price_per_tonne_usd": 30.0,
    "cargo_value_at_destination_usd": 21234567,
    "cargo_value_at_destination_per_tonne_usd": 29.0,
    "payback_comment": "краткий вывод по экономике сделки"
  },
  "legs": [
    {
      "sequence": 1,
      "mode": "sea",
      "from": "порт или хаб отправления",
      "to": "порт или хаб назначения",
      "distance_nm": 2500,
      "eta_days": 6.5,
      "transshipment": false,
      "risk_score": 40,
      "notes": "краткое описание плеча"
    }
  ],
  "costs": {
    "currency": "USD",
    "freight": 800000,
    "bunker": 300000,
    "port_charges": 120000,
    "canal_dues": 50000,
    "insurance": 70000,
    "risk_premium": 90000,
    "other": 60000,
    "total": 1490000
  },
  "operational_context": {
    "geopolitics": "описание геополитических факторов по маршруту",
    "sanctions": "какие санкционные режимы считаем значимыми",
    "war_and_piracy": "зоны боевых действий, пиратство, повышенные риски",
    "infrastructure_constraints": "ограничения портов, каналов, флота",
    "alternative_routes": "возможные альтернативные маршруты"
  },
  "assumptions": [
    "ключевые допущения по ставкам, котировкам, поведению рынков"
  ]
}
`;

/* ================ OpenAI вызовы ================ */

async function callAiRoutePlanner({ apiKey, scenario }) {
  const url = "https://api.openai.com/v1/chat/completions";
  const body = {
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content:
          "Сценарий экспортно-импортной сделки в формате JSON:\n\n" +
          JSON.stringify({ scenario }, null, 2) +
          "\n\nВерни только JSON-ответ по заданной схеме."
      }
    ],
    temperature: 0.2,
    response_format: { type: "json_object" }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error("Ошибка API: " + res.status + " " + res.statusText + " " + text);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Пустой ответ ИИ или неизвестный формат.");
  return content;
}

async function translateToEnglish(apiKey, text) {
  const url = "https://api.openai.com/v1/chat/completions";
  const body = {
    model: "gpt-4.1-mini",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content:
          "You are a professional translator. Translate the following Russian logistics strategy into concise, natural English, preserving numeric details."
      },
      { role: "user", content: text }
    ]
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error("Ошибка перевода на английский: " + res.status + " " + res.statusText + " " + t);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Пустой ответ перевода на английский.");
  return content;
}

async function translateToChinese(apiKey, text) {
  const url = "https://api.openai.com/v1/chat/completions";
  const body = {
    model: "gpt-4.1-mini",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content:
          "You are a professional translator. Translate the following Russian logistics strategy into concise, natural Mandarin Chinese, preserving numeric details."
      },
      { role: "user", content: text }
    ]
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error("Ошибка перевода: " + res.status + " " + res.statusText + " " + t);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Пустой ответ перевода на китайский.");
  return content;
}

async function generateTts({ apiKey, text }) {
  const url = "https://api.openai.com/v1/audio/speech";
  const body = {
    model: "gpt-4o-mini-tts",
    voice: "alloy",
    input: text
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error("Ошибка TTS: " + res.status + " " + res.statusText + " " + t);
  }
  const arrayBuffer = await res.arrayBuffer();
  return new Blob([arrayBuffer], { type: "audio/mpeg" });
}

/* ================ рендер JSON ================ */

function renderSummary(data) {
  const container = $("#summary");
  const s = data.summary || {};
  const risks = Array.isArray(s.key_risks_short) ? s.key_risks_short : [];
  container.innerHTML = `
    <h3>Стратегия</h3>
    <p>${escapeHtml(s.recommended_strategy || "Нет описания стратегии.")}</p>
    <p><strong>Incoterms:</strong> ${escapeHtml(s.incoterms_comment || "—")}</p>
    <p><strong>Перевалки:</strong> ${
      s.transshipment_required ? "нужны / возможны" : "не требуются"
    }</p>
    ${
      risks.length
        ? `<p><strong>Ключевые риски:</strong> ${risks
            .map((r) => escapeHtml(r))
            .join("; ")}</p>`
        : ""
    }
  `;
}

function renderDealMetrics(data) {
  const container = $("#dealMetrics");
  const m = data.deal_metrics || {};
  if (!Object.keys(m).length) {
    container.innerHTML = "";
    return;
  }
  const cargoAtDest =
    m.cargo_value_at_destination_usd != null
      ? fmtMoney(m.cargo_value_at_destination_usd)
      : "—";
  const cargoAtDestPerTonne =
    m.cargo_value_at_destination_per_tonne_usd != null
      ? m.cargo_value_at_destination_per_tonne_usd.toFixed(2) + " USD/т"
      : "—";
  container.innerHTML = `
    <h3>Экономика сделки</h3>
    <table>
      <tbody>
        <tr><td>Объём груза</td><td>${
          Number(m.cargo_tonnage) > 0 ? m.cargo_tonnage + " т" : "—"
        }</td></tr>
        <tr><td>Стоимость груза (в точке отправления)</td><td>${fmtMoney(
          m.cargo_value_usd
        )}</td></tr>
        <tr><td>Общая стоимость логистики</td><td>${fmtMoney(
          m.logistics_cost_total_usd
        )}</td></tr>
        <tr><td>Логистика на тонну</td><td>${
          Number(m.logistics_cost_per_tonne_usd) > 0
            ? Number(m.logistics_cost_per_tonne_usd).toFixed(2) + " USD/т"
            : "—"
        }</td></tr>
        <tr><td>Мин. цена продажи (рекомендация)</td><td>${
          Number(m.recommended_min_sale_price_per_tonne_usd) > 0
            ? Number(m.recommended_min_sale_price_per_tonne_usd).toFixed(2) + " USD/т"
            : "—"
        }</td></tr>
        <tr><td>Стоимость груза в конечной точке</td><td>${cargoAtDest}</td></tr>
        <tr><td>Стоимость в конечной точке на тонну</td><td>${cargoAtDestPerTonne}</td></tr>
      </tbody>
    </table>
    <p>${escapeHtml(m.payback_comment || "")}</p>
  `;
}

function renderCosts(data) {
  const container = $("#costs");
  const c = data.costs || {};
  if (!Object.keys(c).length) {
    container.innerHTML = "";
    return;
  }
  const currency = c.currency || "USD";
  const totalNumber = Number(c.total) || 0;
  const totalWords = totalNumber ? numberToWordsRu(totalNumber) : "—";

  container.innerHTML = `
    <h3>Стоимость основных логистических ресурсов</h3>
    <table>
      <tbody>
        <tr><td>Фрахт флота</td><td>${fmtMoney(c.freight, currency)}</td></tr>
        <tr><td>Бункер (топливо)</td><td>${fmtMoney(c.bunker, currency)}</td></tr>
        <tr><td>Портовые сборы и обработка</td><td>${fmtMoney(
          c.port_charges,
          currency
        )}</td></tr>
        <tr><td>Канальные сборы</td><td>${fmtMoney(c.canal_dues, currency)}</td></tr>
        <tr><td>Страхование</td><td>${fmtMoney(c.insurance, currency)}</td></tr>
        <tr><td>Надбавка за риск</td><td>${fmtMoney(
          c.risk_premium,
          currency
        )}</td></tr>
        <tr><td>Прочие расходы</td><td>${fmtMoney(c.other, currency)}</td></tr>
        <tr><th>Итого (всё подключ)</th><th>${fmtMoney(c.total, currency)}</th></tr>
        <tr><td>Сумма прописью</td><td>${escapeHtml(totalWords)}</td></tr>
      </tbody>
    </table>
  `;
}

function renderLegs(data) {
  const container = $("#legs");
  const legs = Array.isArray(data.legs) ? data.legs : [];
  if (!legs.length) {
    container.innerHTML = "";
    return;
  }
  const rows = legs
    .map((leg) => {
      const dist =
        Number(leg.distance_nm) > 0 ? Number(leg.distance_nm).toFixed(0) : "—";
      const eta =
        Number(leg.eta_days) > 0 ? Number(leg.eta_days).toFixed(1) : "—";
      const rc = riskClass(leg.risk_score);
      const riskLabel =
        Number(leg.risk_score) >= 0
          ? `${Number(leg.risk_score).toFixed(0)}/100`
          : "—";
      return `
        <tr>
          <td>${escapeHtml(leg.from || "")}</td>
          <td>${escapeHtml(leg.to || "")}</td>
          <td>${escapeHtml(leg.mode || "")}</td>
          <td>${dist}</td>
          <td>${eta}</td>
          <td><span class="risk-chip ${rc}"><i class="fa-solid fa-wave-square"></i>${riskLabel}</span></td>
          <td>${escapeHtml(leg.notes || "")}</td>
        </tr>
      `;
    })
    .join("");

  container.innerHTML = `
    <h3>Плечи маршрута</h3>
    <table>
      <thead>
        <tr>
          <th>Откуда</th><th>Куда</th><th>Мод</th><th>Мили</th><th>ETA, дн.</th><th>Риск</th><th>Комментарий</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

function renderRisks(data) {
  const container = $("#risks");
  const ctx = data.operational_context || {};
  const assumptions = Array.isArray(data.assumptions) ? data.assumptions : [];
  if (!Object.keys(ctx).length && !assumptions.length) {
    container.innerHTML = "";
    return;
  }
  container.innerHTML = `
    <h3>Оперативная обстановка и допущения</h3>
    <p><strong>Геополитика:</strong> ${escapeHtml(ctx.geopolitics || "—")}</p>
    <p><strong>Санкции:</strong> ${escapeHtml(ctx.sanctions || "—")}</p>
    <p><strong>Войны и пиратство:</strong> ${escapeHtml(ctx.war_and_piracy || "—")}</p>
    <p><strong>Инфраструктурные ограничения:</strong> ${escapeHtml(
      ctx.infrastructure_constraints || "—"
    )}</p>
    ${
      assumptions.length
        ? `<p><strong>Ключевые допущения:</strong></p><ul>${assumptions
            .map((a) => `<li>${escapeHtml(a)}</li>`)
            .join("")}</ul>`
        : ""
    }
  `;
}

/* ============= подробный текстовый отчёт для экрана и TTS ============= */

function buildStrategyTextRu(data) {
  const s = data.summary || {};
  const m = data.deal_metrics || {};
  const ctx = data.operational_context || {};
  const legs = Array.isArray(data.legs) ? data.legs : [];
  const costs = data.costs || {};
  const assumptions = Array.isArray(data.assumptions) ? data.assumptions : [];

  const totalLog =
    m.logistics_cost_total_usd != null ? fmtMoney(m.logistics_cost_total_usd) : "";
  const cargoAtDest =
    m.cargo_value_at_destination_usd != null ? fmtMoney(m.cargo_value_at_destination_usd) : "";
  const cargoAtDestPerTonne =
    m.cargo_value_at_destination_per_tonne_usd != null
      ? m.cargo_value_at_destination_per_tonne_usd.toFixed(2) + " USD за тонну"
      : "";
  const cargoValue = m.cargo_value_usd != null ? fmtMoney(m.cargo_value_usd) : "";
  const cargoTonnage = m.cargo_tonnage != null ? m.cargo_tonnage + " тонн" : "";

  const lines = [];

  // 1. Краткое резюме
  let summary = 'Стратегия логистики от платформы "Офицер связи".';
  if (s.recommended_strategy) {
    summary += " Рекомендуемая логистическая схема: " + s.recommended_strategy;
  }
  if (s.incoterms_comment) {
    summary +=
      " Условия поставки и распределение рисков по Incoterms: " +
      s.incoterms_comment;
  }
  if (Array.isArray(s.key_risks_short) && s.key_risks_short.length) {
    summary +=
      " Ключевые риски сделки: " + s.key_risks_short.join(", ") + ".";
  }
  lines.push(summary);

  // 2. Параметры сделки и экономики
  let economics = "Параметры сделки.";
  if (cargoTonnage) {
    economics += " Объём партии: " + cargoTonnage + ".";
  }
  if (cargoValue) {
    economics +=
      " Оценочная стоимость груза в точке отправления: " + cargoValue + ".";
  }
  if (totalLog) {
    economics +=
      " Ориентировочная совокупная стоимость логистики по всем плечам: " +
      totalLog +
      ".";
  }
  if (cargoAtDest) {
    economics +=
      " Совокупная стоимость груза в конечной точке маршрута с учётом логистики: " +
      cargoAtDest +
      (cargoAtDestPerTonne ? " (" + cargoAtDestPerTonne + ")." : ".");
  }
  if (m.recommended_min_sale_price_per_tonne_usd != null) {
    economics +=
      " Рекомендованная минимальная цена продажи на условиях CIF: " +
      m.recommended_min_sale_price_per_tonne_usd.toFixed(2) +
      " USD за тонну.";
  }
  if (m.payback_comment) {
    economics += " Вывод по экономике: " + m.payback_comment;
  }
  lines.push(economics);

  // 3. Маршрут и плечи
  if (legs.length) {
    let routeText =
      "Маршрут разбит на следующие ключевые плечи перевозки с оценкой расстояний, сроков и рисков.";
    legs.forEach((leg, idx) => {
      const dist =
        leg.distance_nm != null
          ? leg.distance_nm.toFixed(0) + " морских миль"
          : "без оценки расстояния";
      const eta =
        leg.eta_days != null
          ? leg.eta_days.toFixed(1) + " суток"
          : "без оценки срока";
      const risk =
        leg.risk_score != null
          ? "уровень риска " + leg.risk_score.toFixed(0) + " из 100"
          : "без числовой оценки риска";
      routeText +=
        " Плечо " +
        (idx + 1) +
        ": " +
        (leg.from || "неизвестный порт") +
        " → " +
        (leg.to || "неизвестный порт") +
        " (" +
        (leg.mode || "мод не указан") +
        "), расстояние " +
        dist +
        ", ориентировочный транзит " +
        eta +
        ", " +
        risk +
        ".";
      if (leg.notes) {
        routeText += " Комментарий: " + leg.notes + ".";
      }
    });
    lines.push(routeText);
  }

  // 4. Структура затрат
  const costParts = [];
  if (costs.freight != null) {
    costParts.push("фрахт флота — " + fmtMoney(costs.freight));
  }
  if (costs.bunker != null) {
    costParts.push("бункер (топливо) — " + fmtMoney(costs.bunker));
  }
  if (costs.port_charges != null) {
    costParts.push(
      "портовые сборы и обработка — " + fmtMoney(costs.port_charges)
    );
  }
  if (costs.canal_dues != null) {
    costParts.push("канальные сборы — " + fmtMoney(costs.canal_dues));
  }
  if (costs.insurance != null) {
    costParts.push("страхование — " + fmtMoney(costs.insurance));
  }
  if (costs.risk_premium != null) {
    costParts.push("надбавка за риск — " + fmtMoney(costs.risk_premium));
  }
  if (costs.other != null) {
    costParts.push("прочие расходы — " + fmtMoney(costs.other));
  }
  if (costParts.length) {
    let costText =
      "Структура совокупных расходов на логистику включает следующие основные блоки: " +
      costParts.join("; ") +
      ".";
    if (costs.total != null) {
      costText +=
        " Итоговая оценка всех логистических расходов: " +
        fmtMoney(costs.total) +
        ".";
    }
    lines.push(costText);
  }

  // 5. Геополитика и санкции
  let contextText = "";
  if (ctx.geopolitics) {
    contextText += "Геополитическая обстановка по маршруту: " + ctx.geopolitics + ". ";
  }
  if (ctx.sanctions) {
    contextText += "Санкционные ограничения и риски: " + ctx.sanctions + ". ";
  }
  if (ctx.war_and_piracy) {
    contextText +=
      "Военные риски, зоны боевых действий и пиратство: " +
      ctx.war_and_piracy +
      ". ";
  }
  if (ctx.infrastructure_constraints) {
    contextText +=
      "Инфраструктурные ограничения портов, каналов и хабов: " +
      ctx.infrastructure_constraints +
      ". ";
  }
  if (ctx.alternative_routes) {
    contextText +=
      "Альтернативные маршруты и коридоры: " + ctx.alternative_routes + ". ";
  }
  if (contextText) {
    lines.push(contextText);
  }

  // 6. Допущения
  if (assumptions.length) {
    lines.push(
      "Ключевые допущения при моделировании сделки: " +
        assumptions.join("; ") +
        "."
    );
  }

  return lines.join("\n\n");
}

function renderFullReport(data) {
  const container = $("#reportFull");
  if (!container) return;
  const report = buildStrategyTextRu(data);
  if (!report) {
    container.innerHTML = "";
    return;
  }
  const paragraphs = report.split("\n\n");
  const html =
    "<h3>Подробный текстовый отчёт</h3>" +
    paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
  container.innerHTML = html;
}

/* ============= Финансовый блок (через FinanceModule) ============= */

function renderFinance(data, scenario) {
  const container = $("#finance");
  if (!container || !window.FinanceModule) {
    if (container) container.innerHTML = "";
    return;
  }
  const profile = FinanceModule.buildFinanceProfile(data || {}, scenario || null);
  FinanceModule.renderFinanceProfile(profile, { containerSelector: "#finance" });
  FinanceModule.attachMarketOffers(profile, data || {}, { containerSelector: "#finance" });
}

/* ============= collapsible-карточки ============= */

function refreshCardHeight(cardSelector) {
  const card = document.querySelector(cardSelector);
  if (!card || card.classList.contains("collapsed")) return;
  const body = card.querySelector(".card-body");
  if (!body) return;
  body.style.maxHeight = body.scrollHeight + "px";
}

function initCollapsibles() {
  const cards = document.querySelectorAll(".card.collapsible");
  cards.forEach((card) => {
    const header = card.querySelector("h2");
    const body = card.querySelector(".card-body");
    if (!header || !body) return;

    // initial state: if card has .collapsed, keep it closed
    if (card.classList.contains("collapsed")) {
      body.style.maxHeight = 0;
    } else {
      body.style.maxHeight = body.scrollHeight + "px";
    }

    header.addEventListener("click", () => {
      const isCollapsed = card.classList.toggle("collapsed");
      if (isCollapsed) {
        body.style.maxHeight = 0;
      } else {
        body.style.maxHeight = body.scrollHeight + "px";
      }
    });
  });
}


  window.addEventListener("resize", () => {
    cards.forEach((card) => {
      if (card.classList.contains("collapsed")) return;
      const body = card.querySelector(".card-body");
      if (!body) return;
      body.style.maxHeight = body.scrollHeight + "px";
    });
  });
}

/* ============= форма, состояние, TTS ============= */

function buildScenarioFromForm() {
  return {
    cargo: {
      type: $("#cargoType").value.trim(),
      volume_tonnes: Number($("#cargoVolume").value) || null
    },
    route: {
      origin: $("#origin").value.trim(),
      destination: $("#destination").value.trim()
    }
  };
}

const form = $("#routeForm");
const statusEl = $("#status");
const loaderEl = $("#loader");
const rawJsonEl = $("#rawJson");
const ttsBtn = $("#ttsBtn");
const ttsLangSelect = $("#ttsLang");
const ttsAudio = $("#ttsAudio");
const ttsDownload = $("#ttsDownload");
const ttsWaveform = $("#ttsWaveform");
const ttsPlayPauseBtn = $("#ttsPlayPause");
const ttsStopBtn = $("#ttsStop");

let lastResultData = null;
let lastApiKey = null;
let lastScenario = null;
let strategyTextRuStore = "";
let strategyTextEn = "";
let strategyTextZh = "";
let waveSurfer = null;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusEl.className = "";
  statusEl.textContent = "";

  const apiKey = $("#aiApiKey").value.trim();
  if (!apiKey) {
    statusEl.textContent = "Укажи API-ключ ИИ, чтобы выполнить расчёт.";
    statusEl.classList.add("error");
    return;
  }

  const scenario = buildScenarioFromForm();
  lastScenario = scenario;

  statusEl.textContent = "Считаем маршрут, стоимость ресурсов и риски...";
  statusEl.classList.remove("error", "ok");
  loaderEl.style.display = "flex";
  ttsBtn.disabled = true;
  if (ttsPlayPauseBtn) ttsPlayPauseBtn.disabled = true;
  if (ttsStopBtn) ttsStopBtn.disabled = true;

  try {
    const content = await callAiRoutePlanner({ apiKey, scenario });
    rawJsonEl.textContent = content;

    let data;
    try {
      data = JSON.parse(content);
    } catch (e) {
      throw new Error("Не удалось распарсить JSON-ответ ИИ. Детали: " + e.message);
    }

    renderSummary(data);
    renderDealMetrics(data);
    renderFullReport(data);
    renderFinance(data, scenario);
    renderCosts(data);
    renderLegs(data);
    renderRisks(data);

    // пересчитать высоту блока "Результат", чтобы анимация не обрезала контент
    refreshCardHeight("#resultCard");

    lastResultData = data;
    lastApiKey = apiKey;
    strategyTextRuStore = buildStrategyTextRu(data);
    strategyTextEn = "";
    strategyTextZh = "";

    ttsBtn.disabled = false;
    statusEl.textContent =
      'Готово. Смотри итог "всё подключ" и детальный отчёт по сделке.';
    statusEl.classList.add("ok");
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Ошибка расчёта: " + err.message;
    statusEl.classList.add("error");
  } finally {
    loaderEl.style.display = "none";
  }
});

ttsBtn.addEventListener("click", async () => {
  if (!lastResultData || !lastApiKey) {
    statusEl.textContent = "Сначала посчитай маршрут, потом генерируй аудио.";
    statusEl.classList.add("error");
    return;
  }
  const lang = ttsLangSelect.value;
  let textForTts = strategyTextRuStore || "";

  try {
    if (lang === "ru") {
      statusEl.textContent = "Готовим русскую аудио-версию стратегии...";
    } else if (lang === "en") {
      statusEl.textContent = "Preparing English audio version of the strategy...";
    } else if (lang === "zh") {
      statusEl.textContent = "正在准备中文语音版本的物流策略...";
    } else {
      statusEl.textContent = "Готовим аудио-версию стратегии...";
    }
    statusEl.classList.remove("error", "ok");
    loaderEl.style.display = "flex";

    if (lang === "en") {
      if (!strategyTextEn) {
        strategyTextEn = await translateToEnglish(lastApiKey, strategyTextRuStore);
      }
      textForTts = strategyTextEn;
    } else if (lang === "zh") {
      if (!strategyTextZh) {
        strategyTextZh = await translateToChinese(lastApiKey, strategyTextRuStore);
      }
      textForTts = strategyTextZh;
    }

    const blob = await generateTts({ apiKey: lastApiKey, text: textForTts });
    const url = URL.createObjectURL(blob);

    ttsAudio.src = url;
    ttsAudio.style.display = "none";

    ttsDownload.href = url;
    ttsDownload.download = `officer_strategy_${lang}.mp3`;
    ttsDownload.style.display = "inline-block";

    if (window.WaveSurfer && ttsWaveform) {
      if (!waveSurfer) {
        waveSurfer = WaveSurfer.create({
          container: ttsWaveform,
          waveColor: "#38bdf8",
          progressColor: "#0ea5e9",
          cursorColor: "#e5e7eb",
          height: 64,
          responsive: true,
          barWidth: 2,
          barGap: 2,
          barRadius: 2
        });

        waveSurfer.on("play", () => updatePlayPauseIcon(true));
        waveSurfer.on("pause", () => updatePlayPauseIcon(false));
        waveSurfer.on("finish", () => updatePlayPauseIcon(false));
      }

      waveSurfer.load(url);

      if (ttsPlayPauseBtn) ttsPlayPauseBtn.disabled = false;
      if (ttsStopBtn) ttsStopBtn.disabled = false;
    }

    if (lang === "ru") {
      statusEl.textContent = "Аудио стратегии сгенерировано. Можно прослушать или скачать.";
    } else if (lang === "en") {
      statusEl.textContent = "Strategy audio generated. You can listen or download it.";
    } else if (lang === "zh") {
      statusEl.textContent = "物流策略语音已生成，可以收听或下载。";
    } else {
      statusEl.textContent = "Аудио стратегии готово.";
    }
    statusEl.classList.add("ok");
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Ошибка генерации аудио: " + err.message;
    statusEl.classList.add("error");
  } finally {
    loaderEl.style.display = "none";
  }
});

function updatePlayPauseIcon(playing) {
  if (!ttsPlayPauseBtn) return;
  ttsPlayPauseBtn.innerHTML = playing
    ? '<i class="fa-solid fa-pause"></i>'
    : '<i class="fa-solid fa-play"></i>';
}

if (ttsPlayPauseBtn) {
  ttsPlayPauseBtn.addEventListener("click", () => {
    if (!waveSurfer) return;
    if (waveSurfer.isPlaying()) {
      waveSurfer.pause();
    } else {
      waveSurfer.play();
    }
  });
}

if (ttsStopBtn) {
  ttsStopBtn.addEventListener("click", () => {
    if (!waveSurfer) return;
    waveSurfer.stop();
  });
}

/* инициализация collapsible-карточек после загрузки скрипта */
initCollapsibles();
