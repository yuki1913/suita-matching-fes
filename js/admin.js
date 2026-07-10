/**
 * 運営管理ページ
 * - 企業から届いた登録JSONを取り込み(localStorageに保存)
 * - ブース番号・位置を割り当て
 * - 学生アプリ用の data.js を書き出し
 */

(function () {
  "use strict";

  const STORAGE_KEY = "mbti-fes:admin-companies";
  const $ = (id) => document.getElementById(id);

  let companies = loadCompanies();

  function loadCompanies() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
  }

  /* ---------- 取り込み ---------- */

  function importJson() {
    const text = $("import-area").value.trim();
    if (!text) return flash("JSONを貼り付けてください");
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return flash("JSONの形式が正しくありません: " + e.message);
    }
    const list = Array.isArray(parsed) ? parsed : [parsed];
    let added = 0;
    for (const entry of list) {
      if (!entry || !entry.name || !entry.mbti) continue;
      entry.booth = entry.booth || { label: "", x: null, y: null };
      entry.id = entry.id || "c-" + Date.now() + "-" + added;
      // 同名企業は上書き
      const idx = companies.findIndex((c) => c.name === entry.name);
      if (idx >= 0) companies[idx] = entry;
      else companies.push(entry);
      added++;
    }
    if (added === 0) return flash("有効な企業データが見つかりません(name と mbti が必要です)");
    save();
    $("import-area").value = "";
    renderAll();
    flash(`${added}社を取り込みました`);
  }

  /* ---------- 一覧 & 配置編集 ---------- */

  function renderList() {
    const wrap = $("company-list");
    wrap.innerHTML = "";
    if (companies.length === 0) {
      wrap.innerHTML = '<p class="note">まだ企業データがありません。</p>';
      return;
    }
    companies.forEach((c, i) => {
      const total = Object.values(c.mbti || {}).reduce((s, n) => s + (Number(n) || 0), 0);
      const row = document.createElement("div");
      row.className = "admin-company-row";
      row.innerHTML = `
        <div style="min-width:0;">
          <div class="name">${escapeHtml(c.name)}</div>
          <div class="meta">${escapeHtml(c.industry || "業種未設定")} / 診断済 ${total}名</div>
        </div>
        <div class="controls">
          <input type="text" placeholder="A-1" value="${escapeHtml((c.booth && c.booth.label) || "")}" data-i="${i}" data-k="label" title="ブース番号" />
          <input type="number" placeholder="列" min="0" value="${numOrEmpty(c.booth && c.booth.x)}" data-i="${i}" data-k="x" title="列(0始まり)" />
          <input type="number" placeholder="行" min="0" value="${numOrEmpty(c.booth && c.booth.y)}" data-i="${i}" data-k="y" title="行(0始まり)" />
          <button class="btn btn-ghost btn-sm" data-del="${i}">削除</button>
        </div>`;
      wrap.appendChild(row);
    });

    wrap.querySelectorAll("input").forEach((input) => {
      input.addEventListener("change", () => {
        const c = companies[Number(input.dataset.i)];
        c.booth = c.booth || {};
        if (input.dataset.k === "label") {
          c.booth.label = input.value.trim();
        } else {
          const n = parseInt(input.value, 10);
          c.booth[input.dataset.k] = isNaN(n) ? null : n;
        }
        save();
        renderPreview();
      });
    });
    wrap.querySelectorAll("button[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const c = companies[Number(btn.dataset.del)];
        if (!confirm(`「${c.name}」を削除しますか?`)) return;
        companies.splice(Number(btn.dataset.del), 1);
        save();
        renderAll();
      });
    });
  }

  function autoAssign() {
    const cols = getCols();
    const rowLetters = "ABCDEFGH";
    companies.forEach((c, i) => {
      const x = i % cols;
      const y = Math.floor(i / cols);
      c.booth = { label: `${rowLetters[y] || "Z"}-${x + 1}`, x, y };
    });
    // 必要な行数に合わせて入力欄も更新
    $("map-rows").value = Math.max(1, Math.ceil(companies.length / cols));
    save();
    renderAll();
    flash("ブースを自動割り当てしました");
  }

  function renderPreview() {
    const cols = getCols();
    const rows = getRows();
    const grid = $("preview-grid");
    grid.innerHTML = "";
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    const byPos = {};
    companies.forEach((c) => {
      if (c.booth && c.booth.x != null && c.booth.y != null) {
        byPos[`${c.booth.x},${c.booth.y}`] = c;
      }
    });
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const c = byPos[`${x},${y}`];
        const cell = document.createElement("div");
        if (!c) {
          cell.className = "booth empty";
          cell.innerHTML = `<div class="booth-label">${x},${y}</div>`;
        } else {
          cell.className = "booth";
          cell.style.background = "#3b5bd0";
          cell.innerHTML = `
            <div class="booth-label">${escapeHtml(c.booth.label || "")}</div>
            <div class="booth-name">${escapeHtml(c.name)}</div>`;
        }
        grid.appendChild(cell);
      }
    }
  }

  function getCols() {
    return Math.max(1, parseInt($("map-cols").value, 10) || 4);
  }
  function getRows() {
    return Math.max(1, parseInt($("map-rows").value, 10) || 3);
  }

  /* ---------- 書き出し ---------- */

  function exportData() {
    if (companies.length === 0) return flash("企業データがありません");
    const unplaced = companies.filter(
      (c) => !c.booth || c.booth.x == null || c.booth.y == null
    );
    if (unplaced.length > 0) {
      flash(`未配置の企業が${unplaced.length}社あります(自動割り当てを使えます)`);
    }
    const mapConfig = {
      cols: getCols(),
      rows: getRows(),
      title: "吹田みらい企業マッチングフェス 会場マップ",
    };
    const content =
      "/**\n * 企業データ(運営管理ページから書き出し)\n */\n\n" +
      "const MAP_CONFIG = " +
      JSON.stringify(mapConfig, null, 2) +
      ";\n\nconst COMPANIES = " +
      JSON.stringify(companies, null, 2) +
      ";\n";
    $("export-area").value = content;
    $("export-wrap").classList.remove("hidden");
  }

  /* ---------- イベント ---------- */

  $("btn-import").addEventListener("click", importJson);
  $("btn-load-sample").addEventListener("click", () => {
    companies = JSON.parse(JSON.stringify(COMPANIES));
    save();
    renderAll();
    flash("サンプル12社を読み込みました");
  });
  $("btn-clear").addEventListener("click", () => {
    if (!confirm("取り込み済みの企業データをすべて削除しますか?")) return;
    companies = [];
    save();
    renderAll();
  });
  $("btn-auto-assign").addEventListener("click", autoAssign);
  $("map-cols").addEventListener("change", renderPreview);
  $("map-rows").addEventListener("change", renderPreview);
  $("btn-export").addEventListener("click", exportData);
  $("btn-export-copy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText($("export-area").value);
      flash("コピーしました");
    } catch (e) {
      $("export-area").select();
      document.execCommand("copy");
      flash("コピーしました");
    }
  });
  $("btn-export-download").addEventListener("click", () => {
    const blob = new Blob([$("export-area").value], { type: "text/javascript" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "data.js";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  /* ---------- ユーティリティ ---------- */

  function numOrEmpty(v) {
    return v == null || isNaN(v) ? "" : v;
  }

  let flashTimer = null;
  function flash(msg) {
    const el = $("flash");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => el.classList.remove("show"), 3000);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderAll() {
    renderList();
    renderPreview();
  }

  renderAll();
})();
