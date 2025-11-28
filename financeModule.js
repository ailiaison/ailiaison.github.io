(function (global) {
  "use strict";

  function safeNumber(n, def) {
    var v = Number(n);
    return isFinite(v) ? v : (def || 0);
  }

  function computeAggregatedRisk(legs) {
    if (!legs || !legs.length) {
      return { score: 50, avg: null, max: null, legsCount: 0 };
    }
    var scores = [];
    for (var i = 0; i < legs.length; i++) {
      var rs = Number(legs[i].risk_score);
      if (isFinite(rs)) scores.push(rs);
    }
    if (!scores.length) {
      return { score: 50, avg: null, max: null, legsCount: legs.length };
    }
    var sum = 0;
    var max = scores[0];
    for (var j = 0; j < scores.length; j++) {
      sum += scores[j];
      if (scores[j] > max) max = scores[j];
    }
    var avg = sum / scores.length;
    var agg = 0.6 * max + 0.4 * avg;
    return {
      score: Math.round(agg),
      avg: avg,
      max: max,
      legsCount: legs.length
    };
  }

  function bandFor(score) {
    if (score <= 33) return "low";
    if (score <= 66) return "medium";
    return "high";
  }

  function bandLabel(band) {
    if (band === "low") return "низкий";
    if (band === "medium") return "средний";
    return "высокий";
  }

  function localEscapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function money(v, currency) {
    var n = Number(v);
    if (!isFinite(n)) return "—";
    return (
      n.toLocaleString("en-US", { maximumFractionDigits: 2 }) +
      (currency ? " " + currency : "")
    );
  }

  function detectContextFlags(ctxText) {
    var t = (ctxText || "").toLowerCase();
    return {
      hasWarOrPiracy: /войн|боев|боевые|milit|war|pirat|пират/gi.test(t),
      hasSanctions: /санкц|sanction/gi.test(t),
      mentionsEurope: /европ|eu\b|europe|germany|deutschland|hamburg|rotterdam|antwerp/gi.test(
        t
      ),
      mentionsAsia: /кита|china|singapore|hong kong|shanghai|busan|yokohama/gi.test(
        t
      ),
      mentionsMena: /middle east|gulf|saudi|uae|dubai|qatar/gi.test(t)
    };
  }

  function baseFundingRate(band) {
    if (band === "low") return 0.045;
    if (band === "medium") return 0.06;
    return 0.08;
  }

  function spreadForStrategy(band, strategyId) {
    var base;
    if (band === "low") {
      base = { basic: 80, balanced: 120, conservative: 170 };
    } else if (band === "medium") {
      base = { basic: 140, balanced: 200, conservative: 260 };
    } else {
      base = { basic: 220, balanced: 300, conservative: 380 };
    }
    return base[strategyId] || 200;
  }

  function buildStrategies(model) {
    var band = model.band;
    var principal = model.financedAmount;
    var tenorDays = model.tenorDays;
    var tenorYears = tenorDays / 365;

    var strategiesMeta = [
      {
        id: "basic",
        label: "Базовый",
        instruments:
          "открытый счёт + страхование груза / политических рисков; оборотная кредитная линия",
        profile:
          "минимум документов, выше зависимость от платёжной дисциплины покупателя"
      },
      {
        id: "balanced",
        label: "Сбалансированный",
        instruments:
          "документарное инкассо или непокрытый аккредитив; страхование + ограниченный escrow",
        profile:
          "баланс скорости и защищённости, часть рисков переносится на банк"
      },
      {
        id: "conservative",
        label: "Консервативный",
        instruments:
          "подтверждённый документарный аккредитив + расширенный escrow / резервирование платежа",
        profile: "максимальная юридическая и санкционная защита, выше стоимость"
      }
    ];

    var baseRate = baseFundingRate(band);

    return strategiesMeta.map(function (meta) {
      var spreadBps = spreadForStrategy(band, meta.id);
      var fullRate = baseRate + spreadBps / 10000;
      var interest = principal * fullRate * tenorYears;
      var perTonne =
        model.cargoTonnage > 0 ? interest / model.cargoTonnage : null;
      var totalWithLogistics = model.logisticsCostTotal + interest;

      return {
        id: meta.id,
        label: meta.label,
        instruments: meta.instruments,
        profile: meta.profile,
        spread_bps: spreadBps,
        annual_rate: fullRate,
        interest_cost_usd: interest,
        interest_cost_per_tonne_usd: perTonne,
        total_cost_with_logistics_usd: totalWithLogistics
      };
    });
  }

  function buildFinanceProfile(routeData, scenario) {
    routeData = routeData || {};
    var dm = routeData.deal_metrics || {};
    var ctx = routeData.operational_context || {};
    var legs = Array.isArray(routeData.legs) ? routeData.legs : [];

    var aggRisk = computeAggregatedRisk(legs);
    var band = bandFor(aggRisk.score);

    var cargoValue = safeNumber(dm.cargo_value_usd, 0);
    var cargoTonnage = safeNumber(dm.cargo_tonnage, 0);
    var logisticsCost = safeNumber(dm.logistics_cost_total_usd, 0);

    var financedAmount = cargoValue || 0;
    if (financedAmount === 0 && logisticsCost > 0) {
      financedAmount = logisticsCost * 3;
    }
    financedAmount = financedAmount * 0.85;

    var mergedCtxText =
      (ctx.geopolitics || "") +
      " " +
      (ctx.sanctions || "") +
      " " +
      (ctx.war_and_piracy || "") +
      " " +
      (ctx.infrastructure_constraints || "");

    if (scenario && scenario.route) {
      mergedCtxText +=
        " " +
        (scenario.route.origin || "") +
        " " +
        (scenario.route.destination || "");
    }

    var flags = detectContextFlags(mergedCtxText);

    var model = {
      riskScore: aggRisk.score,
      band: band,
      bandLabel: bandLabel(band),
      avgLegRisk: aggRisk.avg,
      maxLegRisk: aggRisk.max,
      legsCount: aggRisk.legsCount,
      cargoTonnage: cargoTonnage,
      cargoValue: cargoValue,
      logisticsCostTotal: logisticsCost,
      financedAmount: financedAmount,
      tenorDays: 90,
      flags: flags
    };

    var strategies = buildStrategies(model);

    var notes = [];
    if (!cargoValue) {
      notes.push(
        "ИИ не вернул полную оценку стоимости груза, расчёт финансирования основан только на логистике и усреднённых параметрах."
      );
    }
    if (flags.hasSanctions) {
      notes.push(
        "В описании маршрута присутствуют санкционные риски — для консервативной стратегии потребуется отдельный комплаенс-ревью банка."
      );
    }
    if (flags.hasWarOrPiracy) {
      notes.push(
        "Для участков с военными рисками или пиратством логично закладывать повышенный резерв и специальные условия страхования."
      );
    }

    return {
      index: {
        score: model.riskScore,
        band: model.band,
        bandLabel: model.bandLabel,
        avgLegRisk: model.avgLegRisk,
        maxLegRisk: model.maxLegRisk,
        legsCount: model.legsCount
      },
      economics: {
        cargoTonnage: cargoTonnage,
        cargoValue: cargoValue,
        logisticsCostTotal: logisticsCost,
        financedAmount: financedAmount,
        tenorDays: model.tenorDays
      },
      flags: model.flags,
      strategies: strategies,
      notes: notes,
      _scenario: scenario || null
    };
  }

  function renderFinanceProfile(profile, options) {
    options = options || {};
    var selector = options.containerSelector || "#finance";
    var container =
      global.document && global.document.querySelector(selector);
    if (!container) return;

    if (!profile) {
      container.innerHTML = "";
      return;
    }

    var idx = profile.index || {};
    var eco = profile.economics || {};
    var strategies = profile.strategies || [];
    var notes = profile.notes || [];

    var rows = strategies
      .map(function (st) {
        var ratePct = st.annual_rate
          ? (st.annual_rate * 100).toFixed(2) + "%"
          : "—";
        var intCost = money(st.interest_cost_usd, "USD");
        var perTonne =
          st.interest_cost_per_tonne_usd != null &&
          isFinite(st.interest_cost_per_tonne_usd)
            ? st.interest_cost_per_tonne_usd.toFixed(2) + " USD/т"
            : "—";
        var totalWithLogistics = money(
          st.total_cost_with_logistics_usd,
          "USD"
        );

        return (
          "<tr>" +
          '<td><span class="finance-tag">' +
          localEscapeHtml(st.label) +
          "</span></td>" +
          "<td>" +
          localEscapeHtml(st.instruments) +
          "</td>" +
          "<td>" +
          ratePct +
          " (+" +
          st.spread_bps +
          " б.п.)</td>" +
          "<td>" +
          intCost +
          '<br/><span class="muted">' +
          perTonne +
          "</span></td>" +
          "<td>" +
          totalWithLogistics +
          "</td>" +
          "<td>" +
          localEscapeHtml(st.profile) +
          "</td>" +
          "</tr>"
        );
      })
      .join("");

    var headlineRisk = "";
    if (isFinite(idx.score)) {
      headlineRisk = idx.score + "/100, " + idx.bandLabel + " уровень";
    }

    var cargoLine = "";
    if (eco.cargoTonnage) {
      cargoLine += eco.cargoTonnage + " т";
    }
    if (eco.cargoValue) {
      cargoLine +=
        (cargoLine ? ", " : "") + money(eco.cargoValue, "USD");
    }

    var logisticsLine = eco.logisticsCostTotal
      ? money(eco.logisticsCostTotal, "USD")
      : "—";
    var financedLine = eco.financedAmount
      ? money(eco.financedAmount, "USD")
      : "—";

    var notesHtml = "";
    if (notes.length) {
      notesHtml =
        "<ul>" +
        notes
          .map(function (n) {
            return "<li>" + localEscapeHtml(n) + "</li>";
          })
          .join("") +
        "</ul>";
    }

    container.innerHTML =
      "<h3>Финансовая стратегия под сделку</h3>" +
      '<p class="muted">Индекс интегрального риска сделки: <strong>' +
      localEscapeHtml(headlineRisk) +
      "</strong>. Основан на " +
      (idx.legsCount || 0) +
      " плечах маршрута.</p>" +
      '<p class="muted">Параметры сделки: ' +
      localEscapeHtml(
        cargoLine || "нет данных по тоннажу и стоимости"
      ) +
      ". Ориентировочная стоимость логистики: " +
      logisticsLine +
      ". Объём финансирования для расчёта: " +
      financedLine +
      ".</p>" +
      '<div class="finance-table-wrapper">' +
      '<table class="finance-table">' +
      "<thead>" +
      "<tr>" +
      "<th>Пакет</th>" +
      "<th>Инструменты</th>" +
      "<th>Ставка (оценка)</th>" +
      "<th>Расходы по финансированию</th>" +
      "<th>Логистика + финансирование</th>" +
      "<th>Профиль использования</th>" +
      "</tr>" +
      "</thead>" +
      "<tbody>" +
      rows +
      "</tbody>" +
      "</table>" +
      "</div>" +
      (notesHtml
        ? '<p class="muted" style="margin-top:6px;">Замечания:</p>' +
          notesHtml
        : "") +
      '<div class="finance-offers" data-role="offers"></div>';
  }

  // ---- Подбор рыночных предложений ----

  var STATIC_OFFERS = [
    {
      id: "db_lc",
      provider: "Deutsche Bank",
      country: "Германия / глобально",
      url:
        "https://corporates.db.com/solutions/corporate-bank-solutions/trade-finance/letters-of-credit-documentary-collections-and-guarantees",
      product: "Letters of credit, documentary collections and guarantees",
      type: "lc_guarantees",
      region: "europe",
      riskBands: ["medium", "high"],
      minTenorDays: 30,
      maxTenorDays: 365,
      minTicketUsd: 1000000,
      modes: ["sea", "multimodal"],
      tags: ["импорт", "экспорт", "L/C", "гарантии"]
    },
    {
      id: "dz_short_term",
      provider: "DZ BANK",
      country: "Германия / ЕС",
      url:
        "https://corporates.dzbank.com/content/firmenkunden/en/homepage/products/international-business/import-export-financing/short-term_trade_finance.html",
      product: "Short-term trade finance: confirmed letters of credit",
      type: "short_term_lc",
      region: "europe",
      riskBands: ["medium", "high"],
      minTenorDays: 30,
      maxTenorDays: 365,
      minTicketUsd: 500000,
      modes: ["sea", "multimodal"],
      tags: ["экспорт", "подтверждённые L/C"]
    },
    {
      id: "lbbw_export",
      provider: "LBBW",
      country: "Германия",
      url:
        "https://www.lbbw.de/services/our-solutions/international-business/export-finance/export-finance_7vjzjmvb1_e.html",
      product: "Export finance (letters of credit, buyer’s credit, forfaiting)",
      type: "export_finance",
      region: "europe",
      riskBands: ["low", "medium"],
      minTenorDays: 90,
      maxTenorDays: 365 * 5,
      minTicketUsd: 1000000,
      modes: ["sea", "multimodal"],
      tags: ["экспорт", "среднесрочное финансирование"]
    },
    {
      id: "kfw_ipex",
      provider: "KfW IPEX-Bank",
      country: "Германия / глобально",
      url: "https://www.kfw-ipex-bank.de/International-financing/KfW-IPEX-Bank/",
      product: "International project and export finance",
      type: "project_export",
      region: "europe",
      riskBands: ["medium", "high"],
      minTenorDays: 365,
      maxTenorDays: 365 * 12,
      minTicketUsd: 10000000,
      modes: ["sea", "multimodal"],
      tags: ["крупные проекты", "инфраструктура", "энергетика"]
    },
    {
      id: "hsbc_lc",
      provider: "HSBC",
      country: "Global",
      url: "https://www.business.hsbc.com/en-gb/solutions/letters-of-credit",
      product: "Letters of credit and guarantees",
      type: "lc_guarantees",
      region: "global",
      riskBands: ["low", "medium", "high"],
      minTenorDays: 30,
      maxTenorDays: 365,
      minTicketUsd: 500000,
      modes: ["sea", "multimodal"],
      tags: ["международная торговля", "L/C"]
    },
    {
      id: "hsbc_scf_china",
      provider: "HSBC China",
      country: "Китай",
      url:
        "https://www.business.hsbc.com.cn/en-gb/campaigns/smarter-banking/global-trade-supply-chain-finance",
      product: "Supply Chain Finance (SCF)",
      type: "scf",
      region: "asia",
      riskBands: ["low", "medium"],
      minTenorDays: 30,
      maxTenorDays: 365,
      minTicketUsd: 300000,
      modes: ["sea", "multimodal"],
      tags: ["SCF", "цепочки поставок", "Азия"]
    },
    {
      id: "uk_export_finance",
      provider: "UK Export Finance",
      country: "Великобритания",
      url: "https://www.ukexportfinance.gov.uk/products-and-services/",
      product: "Export credit guarantees, buyer finance, insurance",
      type: "eca_support",
      region: "europe",
      riskBands: ["low", "medium", "high"],
      minTenorDays: 180,
      maxTenorDays: 365 * 10,
      minTicketUsd: 1000000,
      modes: ["sea", "multimodal"],
      tags: ["ECA", "гарантии", "страхование", "поддержка экспорта"]
    },
    {
      id: "german_ecg",
      provider: "Euler Hermes / German Federal Government ECG",
      country: "Германия",
      url: "https://www.exportkreditgarantien.de/en",
      product: "Export Credit Guarantees of the Federal Government",
      type: "eca_support",
      region: "europe",
      riskBands: ["low", "medium", "high"],
      minTenorDays: 180,
      maxTenorDays: 365 * 10,
      minTicketUsd: 500000,
      modes: ["sea", "multimodal"],
      tags: ["гарантии", "страхование экспортных рисков"]
    },
    {
      id: "ca_cib_shipping",
      provider: "Crédit Agricole CIB",
      country: "Франция / глобально",
      url:
        "https://www.ca-cib.com/en/expertise/solutions-support-your-financing-strategy/offering-structured-finance-solutions/shipping",
      product: "Structured shipping finance",
      type: "shipping_finance",
      region: "europe",
      riskBands: ["medium", "high"],
      minTenorDays: 365,
      maxTenorDays: 365 * 12,
      minTicketUsd: 20000000,
      modes: ["sea"],
      tags: ["флот", "LNG", "танкеры"]
    },
    {
      id: "smbc_maritime",
      provider: "SMBC Group",
      country: "Global / Япония",
      url:
        "https://www.smbcgroup.com/EMEA/products-services/maritime-finance",
      product: "Maritime and LNG shipping finance",
      type: "shipping_finance",
      region: "global",
      riskBands: ["medium", "high"],
      minTenorDays: 365,
      maxTenorDays: 365 * 15,
      minTicketUsd: 20000000,
      modes: ["sea"],
      tags: ["LNG", "флот", "долгосрочное финансирование"]
    }
  ];

  function inferRegion(profile) {
    var flags = (profile && profile.flags) || {};
    if (flags.mentionsEurope) return "europe";
    if (flags.mentionsAsia) return "asia";
    if (flags.mentionsMena) return "mena";
    return "global";
  }

  function selectStaticOffers(financeProfile) {
    var idx = financeProfile.index || {};
    var eco = financeProfile.economics || {};
    var band = idx.band || "medium";
    var financedAmount = Number(eco.financedAmount) || 0;
    var region = inferRegion(financeProfile);

    var candidates = STATIC_OFFERS.filter(function (offer) {
      if (offer.riskBands && offer.riskBands.indexOf(band) === -1) return false;
      if (
        region === "europe" &&
        offer.region &&
        offer.region !== "europe" &&
        offer.region !== "global"
      ) {
        return false;
      }
      if (
        region === "asia" &&
        offer.region &&
        offer.region !== "asia" &&
        offer.region !== "global"
      ) {
        return false;
      }
      if (
        financedAmount > 0 &&
        offer.minTicketUsd &&
        financedAmount < offer.minTicketUsd * 0.6
      ) {
        return false;
      }
      return true;
    });

    if (!candidates.length) {
      candidates = STATIC_OFFERS.slice();
    }

    candidates.sort(function (a, b) {
      var scoreA = 0;
      var scoreB = 0;
      if (a.region === region) scoreA += 2;
      if (b.region === region) scoreB += 2;
      if (band === "high") {
        if (a.type === "shipping_finance" || a.type === "project_export") scoreA += 1;
        if (b.type === "shipping_finance" || b.type === "project_export") scoreB += 1;
      }
      if (band === "low" && a.type === "scf") scoreA += 1;
      if (band === "low" && b.type === "scf") scoreB += 1;
      return scoreB - scoreA;
    });

    return candidates.slice(0, 4);
  }

  function buildOfferReason(offer, financeProfile) {
    var idx = financeProfile.index || {};
    var eco = financeProfile.economics || {};
    var bandLabelText = bandLabel(idx.band || "medium");
    var financedAmount = eco.financedAmount ? money(eco.financedAmount, "USD") : null;

    var base = "";
    if (offer.type === "shipping_finance") {
      base =
        "Структурированное судовое финансирование под крупные морские партии и флот, с длинным сроком и возможностью завязать кредит на конкретные суда или контракты.";
    } else if (offer.type === "project_export") {
      base =
        "Экспортно-проектное финансирование под капиталоёмкие поставки и инфраструктурные проекты, где важны длинный срок и привязка к экспортному контракту.";
    } else if (offer.type === "eca_support") {
      base =
        "Государственная поддержка экспорта через гарантии и страхование, которое снижает кредитный риск для банков и улучшает условия финансирования.";
    } else if (offer.type === "scf") {
      base =
        "Программы финансирования цепочек поставок, оптимизирующие оборотный капитал и позволяющие поставщикам получать оплату раньше по ставкам, завязанным на риск крупного покупателя.";
    } else if (
      offer.type === "short_term_lc" ||
      offer.type === "lc_guarantees"
    ) {
      base =
        "Классические инструменты документарного финансирования (аккредитивы, гарантии, инкассо) для хеджирования платёжного и странового риска в международной торговле.";
    } else {
      base =
        "Специализированный продукт для поддержки международной торговли и экспортных сделок.";
    }

    var extra =
      " Уровень интегрального риска по сделке оценивается как " +
      bandLabelText +
      ".";
    if (financedAmount) {
      extra +=
        " Типовой объём, который имеет смысл выводить на такой продукт в рамках текущей сделки, — порядка " +
        financedAmount +
        ".";
    }
    return base + extra;
  }

  function renderOffersInto(slot, offers, financeProfile) {
    if (!slot) return;
    if (!offers || !offers.length) {
      slot.innerHTML =
        '<h4>Реальные рыночные предложения</h4>' +
        '<p class="muted">Сейчас не удалось подобрать релевантные предложения по открытым продуктовым страницам. Проверь параметры сделки или используй собственную витрину банков.</p>';
      return;
    }

    var listHtml =
      '<ul class="finance-offers-list">' +
      offers
        .map(function (offer) {
          var reason = buildOfferReason(offer, financeProfile);
          return (
            '<li class="finance-offer-item">' +
            '<div class="finance-offer-header">' +
            '<span class="finance-offer-provider">' +
            localEscapeHtml(offer.provider) +
            "</span>" +
            (offer.country
              ? '<span class="finance-offer-country">' +
                localEscapeHtml(offer.country) +
                "</span>"
              : "") +
            "</div>" +
            '<div class="finance-offer-product">' +
            localEscapeHtml(offer.product) +
            "</div>" +
            '<p class="finance-offer-reason">' +
            localEscapeHtml(reason) +
            "</p>" +
            '<a class="finance-offer-link" href="' +
            localEscapeHtml(offer.url) +
            '" target="_blank" rel="noopener noreferrer">Открыть описание продукта</a>' +
            "</li>"
          );
        })
        .join("") +
      "</ul>";

    slot.innerHTML =
      '<h4>Реальные рыночные предложения</h4>' +
      '<p class="muted">Подборка открытых продуктовых страниц под параметры этой сделки. Перед использованием сверяй актуальные условия на стороне банка или агентства.</p>' +
      listHtml;
  }

  function fetchOffers(financeProfile, routeData) {
    routeData = routeData || {};
    var endpoint = global.FINANCE_OFFERS_ENDPOINT;
    if (!endpoint) {
      return Promise.resolve(selectStaticOffers(financeProfile));
    }
    try {
      var payload = {
        risk_index: financeProfile.index || null,
        economics: financeProfile.economics || null,
        scenario: financeProfile._scenario || null,
        raw_ai_response: routeData || null
      };
      return global
        .fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .then(function (data) {
          if (!data || !Array.isArray(data.offers)) {
            return selectStaticOffers(financeProfile);
          }
          return data.offers;
        })
        .catch(function () {
          return selectStaticOffers(financeProfile);
        });
    } catch (e) {
      return Promise.resolve(selectStaticOffers(financeProfile));
    }
  }

  function attachMarketOffers(financeProfile, routeData, options) {
    options = options || {};
    var selector = options.containerSelector || "#finance";
    var container =
      global.document && global.document.querySelector(selector);
    if (!container) return;
    var slot = container.querySelector("[data-role='offers']");
    if (!slot) return;

    fetchOffers(financeProfile, routeData).then(function (offers) {
      renderOffersInto(slot, offers, financeProfile);
    });
  }

  global.FinanceModule = {
    buildFinanceProfile: buildFinanceProfile,
    renderFinanceProfile: renderFinanceProfile,
    attachMarketOffers: attachMarketOffers
  };
})(typeof window !== "undefined" ? window : this);