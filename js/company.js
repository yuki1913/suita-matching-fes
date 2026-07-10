/**
 * 企業向け登録フォーム
 * 会社情報 + 社員のMBTI人数集計を入力し、登録用JSONを生成する。
 * APP_CONFIG.GAS_ENDPOINT が設定されていればオンライン送信も可能。
 */

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  /* MBTI人数入力グリッドを生成 */
  function renderGrid() {
    const grid = $("mbti-grid");
    MBTI_TYPE_LIST.forEach((type) => {
      const info = MBTI_TYPES[type];
      const cell = document.createElement("div");
      cell.className = "mbti-count-cell";
      cell.innerHTML = `
        <span class="code">${type}</span>
        <span class="nick">${info.name}</span>
        <input type="number" min="0" value="" placeholder="0" data-type="${type}" inputmode="numeric" />`;
      grid.appendChild(cell);
    });
    grid.addEventListener("input", updateTotal);
  }

  function collectCounts() {
    const counts = {};
    document.querySelectorAll("#mbti-grid input").forEach((input) => {
      const n = parseInt(input.value, 10);
      if (n > 0) counts[input.dataset.type] = n;
    });
    return counts;
  }

  function updateTotal() {
    const total = Object.values(collectCounts()).reduce((s, n) => s + n, 0);
    $("total-count").textContent = total;
  }

  function buildEntry() {
    const name = $("f-name").value.trim();
    if (!name) {
      flash("企業名を入力してください");
      return null;
    }
    const counts = collectCounts();
    const total = Object.values(counts).reduce((s, n) => s + n, 0);
    if (total === 0) {
      flash("社員のMBTI人数を1名以上入力してください");
      return null;
    }
    return {
      id: "c-" + name.replace(/\s+/g, "").slice(0, 12) + "-" + total,
      name,
      industry: $("f-industry").value.trim(),
      employees: parseInt($("f-employees").value, 10) || total,
      description: $("f-description").value.trim(),
      pr: $("f-pr").value.trim(),
      booth: { label: "", x: null, y: null }, // ブース位置は運営側で設定
      mbti: counts,
    };
  }

  function bindEvents() {
    $("btn-generate").addEventListener("click", () => {
      const entry = buildEntry();
      if (!entry) return;
      $("output").value = JSON.stringify(entry, null, 2);
      $("output-wrap").classList.remove("hidden");
      if (APP_CONFIG.GAS_ENDPOINT) $("btn-send").classList.remove("hidden");
      $("output-wrap").scrollIntoView({ behavior: "smooth" });
    });

    $("btn-copy").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText($("output").value);
        flash("コピーしました!運営へお送りください");
      } catch (e) {
        $("output").select();
        document.execCommand("copy");
        flash("コピーしました");
      }
    });

    $("btn-download").addEventListener("click", () => {
      const blob = new Blob([$("output").value], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = ($("f-name").value.trim() || "company") + "_mbti.json";
      a.click();
      URL.revokeObjectURL(a.href);
    });

    $("btn-send").addEventListener("click", async () => {
      const body = $("output").value;
      if (!body) return;
      $("btn-send").disabled = true;
      try {
        // GAS Webアプリはtext/plainで送るとCORSプリフライトを回避できる
        await fetch(APP_CONFIG.GAS_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body,
        });
        flash("送信しました!ご協力ありがとうございます");
      } catch (e) {
        flash("送信に失敗しました。コピーしてメールでお送りください");
      } finally {
        $("btn-send").disabled = false;
      }
    });
  }

  let flashTimer = null;
  function flash(msg) {
    const el = $("flash");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => el.classList.remove("show"), 3000);
  }

  renderGrid();
  bindEvents();
})();
