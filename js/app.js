/**
 * 学生向けアプリ本体
 * STEP1: MBTIタイプを選択(または簡易診断)
 * STEP2: 会場マップ / ランキングでマッチ度を表示、企業詳細を閲覧
 */

(function () {
  "use strict";

  const state = {
    companies: COMPANIES,
    mapConfig: MAP_CONFIG,
    myType: null,
    results: [],
    quizAnswers: [],
    quizIndex: 0,
    selectedType: null,
  };

  const $ = (id) => document.getElementById(id);

  /* -------- 初期化 -------- */

  function init() {
    loadRemoteData().then(() => {
      renderTypeGrid();
      renderGroupLegend();
      bindEvents();
      const saved = localStorage.getItem("mbti-fes:myType");
      if (saved && MBTI_TYPES[saved]) {
        state.myType = saved;
        showResult();
      }
    });
  }

  async function loadRemoteData() {
    if (!APP_CONFIG.GAS_ENDPOINT) return;
    try {
      const res = await fetch(APP_CONFIG.GAS_ENDPOINT);
      const json = await res.json();
      if (Array.isArray(json.companies) && json.companies.length > 0) {
        state.companies = json.companies;
        if (json.mapConfig) state.mapConfig = json.mapConfig;
      }
    } catch (e) {
      console.warn("企業データの取得に失敗したため、内蔵データを使用します", e);
    }
  }

  function bindEvents() {
    $("btn-confirm-type").addEventListener("click", () => {
      if (!state.selectedType) return;
      state.myType = state.selectedType;
      localStorage.setItem("mbti-fes:myType", state.myType);
      showResult();
    });
    $("btn-start-quiz").addEventListener("click", startQuiz);
    $("btn-quiz-back").addEventListener("click", () => switchView("start"));
    $("quiz-choice-a").addEventListener("click", () => answerQuiz(0));
    $("quiz-choice-b").addEventListener("click", () => answerQuiz(1));
    $("btn-change-type").addEventListener("click", () => switchView("start"));
    $("tab-map").addEventListener("click", () => switchTab("map"));
    $("tab-list").addEventListener("click", () => switchTab("list"));
    $("modal-overlay").addEventListener("click", (e) => {
      if (e.target === $("modal-overlay")) closeModal();
    });
  }

  function switchView(name) {
    ["start", "quiz", "result"].forEach((v) => {
      $("view-" + v).classList.toggle("hidden", v !== name);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* -------- STEP1: タイプ選択 -------- */

  function renderTypeGrid() {
    const grid = $("type-grid");
    grid.innerHTML = "";
    MBTI_TYPE_LIST.forEach((type) => {
      const info = MBTI_TYPES[type];
      const group = MBTI_GROUPS[info.group];
      const cell = document.createElement("button");
      cell.className = "type-cell";
      cell.innerHTML = `
        <span class="group-dot" style="background:${group.color}"></span>
        <div class="code">${type}</div>
        <span class="nick">${info.name}</span>`;
      cell.addEventListener("click", () => {
        state.selectedType = type;
        grid.querySelectorAll(".type-cell").forEach((c) => c.classList.remove("selected"));
        cell.classList.add("selected");
        $("btn-confirm-type").disabled = false;
      });
      grid.appendChild(cell);
    });
  }

  function renderGroupLegend() {
    $("group-legend").innerHTML = Object.entries(MBTI_GROUPS)
      .map(([key, g]) =>
        `<span><span class="dot" style="background:${g.color}"></span>${g.name}(${key})</span>`
      )
      .join("");
  }

  /* -------- STEP1b: 簡易診断 -------- */

  function startQuiz() {
    state.quizAnswers = [];
    state.quizIndex = 0;
    switchView("quiz");
    renderQuiz();
  }

  function renderQuiz() {
    const i = state.quizIndex;
    const q = QUIZ_QUESTIONS[i];
    $("quiz-bar").style.width = `${(i / QUIZ_QUESTIONS.length) * 100}%`;
    $("quiz-count").textContent = `Q${i + 1} / ${QUIZ_QUESTIONS.length}（${AXIS_INFO[q.axis].theme}）`;
    $("quiz-question").textContent = q.q;
    $("quiz-choice-a").textContent = "A. " + q.a;
    $("quiz-choice-b").textContent = "B. " + q.b;
  }

  function answerQuiz(choice) {
    state.quizAnswers[state.quizIndex] = choice;
    state.quizIndex++;
    if (state.quizIndex < QUIZ_QUESTIONS.length) {
      renderQuiz();
    } else {
      state.myType = quizResultType(state.quizAnswers);
      localStorage.setItem("mbti-fes:myType", state.myType);
      showResult();
      flash(`診断結果: あなたは ${state.myType}（${MBTI_TYPES[state.myType].name}）タイプ！`);
    }
  }

  /* -------- STEP2: 結果表示 -------- */

  function showResult() {
    state.results = matchAllCompanies(state.myType, state.companies);
    const info = MBTI_TYPES[state.myType];
    const group = MBTI_GROUPS[info.group];

    $("my-type-code").textContent = state.myType;
    $("my-type-name").innerHTML =
      `${info.name}タイプ <span class="type-group-badge" style="background:${group.color}22;color:${group.color};border:1px solid ${group.color}44">${group.name}</span><br><span style="font-size:11px;color:var(--text-muted)">${info.desc}</span>`;

    renderMap();
    renderList();
    renderScoreLegend();
    switchView("result");
    switchTab("map");
  }

  function switchTab(tab) {
    $("tab-map").classList.toggle("active", tab === "map");
    $("tab-list").classList.toggle("active", tab === "list");
    $("panel-map").classList.toggle("hidden", tab !== "map");
    $("panel-list").classList.toggle("hidden", tab !== "list");
  }

  /* -------- マップ描画 -------- */

  function renderMap() {
    const cfg = state.mapConfig;
    $("map-title").textContent = cfg.title || "会場マップ";

    const grid = $("map-grid");
    grid.innerHTML = "";
    grid.style.gridTemplateColumns = `repeat(${cfg.cols}, 1fr)`;

    // 位置 → 結果 の索引
    const byPos = {};
    state.results.forEach((r) => {
      const b = r.company.booth || {};
      byPos[`${b.x},${b.y}`] = r;
    });

    for (let y = 0; y < cfg.rows; y++) {
      for (let x = 0; x < cfg.cols; x++) {
        const r = byPos[`${x},${y}`];
        const cell = document.createElement("div");
        if (!r) {
          cell.className = "booth empty";
        } else {
          cell.className = "booth" + (r.rank <= 3 ? ` rank-${r.rank}` : "");
          cell.style.background = scoreColor(r.match.score);
          cell.setAttribute("tabindex", "0");
          cell.setAttribute("role", "button");
          cell.setAttribute("aria-label", `${r.company.name} マッチ度${r.match.score}%`);
          cell.innerHTML = `
            ${r.rank <= 3 ? `<span class="booth-badge">${r.rank}位</span>` : ""}
            <div class="booth-label">${escapeHtml(r.company.booth.label || "")}</div>
            <div class="booth-name">${escapeHtml(r.company.name)}</div>
            <div class="booth-score">${r.match.score}%</div>`;
          cell.addEventListener("click", () => openDetail(r));
          cell.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") openDetail(r);
          });
        }
        grid.appendChild(cell);
      }
    }
  }

  function renderScoreLegend() {
    const bands = [
      { min: 75, label: "ベストマッチ" },
      { min: 60, label: "好相性" },
      { min: 45, label: "まずまず" },
      { min: 30, label: "ふつう" },
      { min: 0,  label: "意外な出会い" },
    ];
    $("score-legend").innerHTML = bands
      .map(({ min, label }) =>
        `<span class="score-legend-item">
          <span class="score-dot" style="background:${scoreColor(min)}"></span>${label}
        </span>`
      )
      .join("");
  }

  /* -------- ランキング -------- */

  function renderList() {
    const panel = $("panel-list");
    panel.innerHTML = "";
    state.results.forEach((r) => {
      const row = document.createElement("div");
      row.className = "company-row";
      row.innerHTML = `
        <div class="rank-num">${r.rank}</div>
        <div class="score-circle" style="background:${scoreColor(r.match.score)}">
          ${r.match.score}%<small>マッチ度</small>
        </div>
        <div class="info">
          <div class="name">${escapeHtml(r.company.name)}</div>
          <div class="meta">
            ${escapeHtml(r.company.industry || "")}
            &nbsp;|&nbsp; ブース ${escapeHtml((r.company.booth && r.company.booth.label) || "-")}
            &nbsp;<span class="score-tag" style="background:${scoreColor(r.match.score)}">${scoreLabel(r.match.score)}</span>
          </div>
        </div>`;
      row.addEventListener("click", () => openDetail(r));
      panel.appendChild(row);
    });
  }

  /* -------- 企業詳細モーダル -------- */

  function openDetail(r) {
    const c = r.company;
    const m = r.match;
    const tips = conversationStarters(state.myType, m);
    const topGroups = Object.entries(m.groupPct).sort((a, b) => b[1] - a[1]);

    const distHtml = m.topTypes
      .slice(0, 6)
      .map((t) => {
        const g = MBTI_TYPES[t.type] ? MBTI_TYPES[t.type].group : "SJ";
        return `
        <div class="dist-bar-row">
          <span class="type-code">${t.type}</span>
          <div class="bar-track">
            <div class="bar-fill" style="width:${t.pct}%;background:${MBTI_GROUPS[g].color}"></div>
          </div>
          <span class="pct">${t.pct}%（${t.count}人）</span>
        </div>`;
      })
      .join("");

    const boothLabel = (c.booth && c.booth.label) ? c.booth.label : "-";

    $("modal-body").innerHTML = `
      <div class="close-row">
        <button class="close-btn" id="btn-close-modal" aria-label="閉じる">✕</button>
      </div>
      <div class="detail-head">
        <h2>${escapeHtml(c.name)}</h2>
        <div class="industry">
          ${escapeHtml(c.industry || "")} &nbsp;|&nbsp;
          従業員 ${c.employees || m.total} 名 &nbsp;|&nbsp;
          ブース <strong style="color:var(--amber)">${escapeHtml(boothLabel)}</strong>
        </div>
      </div>

      <div class="match-banner" style="background:${scoreColor(m.score)}">
        <div class="label">あなた（${state.myType}）とのマッチ度</div>
        <div class="big">${m.score}%</div>
        <div class="label">${scoreLabel(m.score)} &nbsp;/&nbsp; 会場内 ${r.rank}位</div>
      </div>

      <div class="stat-row">
        <div class="stat-box">
          <div class="value">${m.kindredPct}%</div>
          <div class="label">気が合いそうな社員</div>
        </div>
        <div class="stat-box">
          <div class="value">${m.sameTypePct}%</div>
          <div class="label">同じタイプの社員</div>
        </div>
        <div class="stat-box">
          <div class="value" style="font-size:13px">${MBTI_GROUPS[topGroups[0][0]].name}</div>
          <div class="label">いちばん多い社風</div>
        </div>
      </div>

      <h3>会社紹介</h3>
      <p style="font-size:14px;line-height:1.7;color:var(--text);">${escapeHtml(c.description || "")}</p>
      ${c.pr ? `<p style="font-size:13px;margin-top:8px;color:var(--amber);font-weight:700;">${escapeHtml(c.pr)}</p>` : ""}

      <h3>社員のMBTI分布（全 ${m.total} 名が診断）</h3>
      ${distHtml}

      <h3>ブースでの話しかけるきっかけ</h3>
      <ul class="tips-list">
        ${tips.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}
      </ul>
      <p class="note" style="margin-top:12px;">
        ※ マッチ度はMBTIの分布に基づく参考値です。採用の合否とは関係ありません。気になった企業にはマッチ度に関わらず話を聞きに行きましょう！
      </p>
    `;

    $("modal-overlay").classList.remove("hidden");
    $("btn-close-modal").addEventListener("click", closeModal);
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    $("modal-overlay").classList.add("hidden");
    document.body.style.overflow = "";
  }

  /* -------- ユーティリティ -------- */

  let flashTimer = null;
  function flash(msg) {
    const el = $("flash");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => el.classList.remove("show"), 3500);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  init();
})();
