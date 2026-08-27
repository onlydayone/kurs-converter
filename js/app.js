import { getCurrencyInfo } from "./currencies.js";
import { fetchRates } from "./api.js";
import {
  getHistory,
  saveHistory,
  clearHistory,
  getFavorite,
  saveFavorite,
} from "./storage.js";
import { updateChart } from "./chart.js";
import {
  $,
  buildSearchDropdown,
  loadTicker,
  animateCount,
  setStatus,
  renderMulti,
  showToast,
} from "./ui.js";

let fromDropdown, toDropdown;
let lastRate = null;
let activeTimeframe = "30D";
let debounceTimer = null;

function getFrom() {
  return fromDropdown ? fromDropdown.getCode() : "USD";
}
function getTo() {
  return toDropdown ? toDropdown.getCode() : "IDR";
}

// ─── RIWAYAT ───
function renderHistoryUI() {
  const history = getHistory();
  const el = $("historyList");
  const clearBtn = $("clearHistBtn");

  if (!history.length) {
    el.innerHTML = '<li class="empty">BELUM ADA AKTIVITAS TRANSAKSI</li>';
    clearBtn.hidden = true;
    return;
  }

  clearBtn.hidden = false;
  el.innerHTML = history
    .map((e, i) => {
      const fi = getCurrencyInfo(e.from);
      const ti = getCurrencyInfo(e.to);
      return `
      <li class="hist-item">
        <span class="hist-pair">${fi.flag} ${e.from} → ${ti.flag} ${e.to}</span>
        <span class="hist-val">${Number(e.amount).toLocaleString()} = ${Number(e.result).toLocaleString("en-US", { maximumFractionDigits: 4 })}</span>
        <button class="hist-reuse" data-i="${i}" title="Gunakan pasangan ini">↺</button>
      </li>`;
    })
    .join("");

  el.querySelectorAll(".hist-reuse").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = getHistory()[+btn.dataset.i];
      if (!item) return;
      $("amount").value = item.amount;
      fromDropdown.setValue(item.from);
      toDropdown.setValue(item.to);
      formatAmountDisplay();
      convert();
      updateChart(item.from, item.to, activeTimeframe);
    });
  });
}

// ─── FAVORIT ───
function updateFavBtnUI() {
  const fav = getFavorite();
  const isSaved = fav && fav.from === getFrom() && fav.to === getTo();
  $("favBtn").textContent = isSaved ? "★ TERSIMPAN" : "☆ FAVORIT";
}

function onFavClick() {
  saveFavorite({ from: getFrom(), to: getTo() });
  updateFavBtnUI();
  const btn = $("favBtn");
  btn.classList.add("fav-pop");
  setTimeout(() => btn.classList.remove("fav-pop"), 300);
  showToast("⭐ Pasangan tersimpan sebagai default!");
}

// ─── FORMAT DISPLAY ───
function formatAmountDisplay() {
  const num = parseFloat($("amount").value);
  $("amountDisplay").textContent =
    !isNaN(num) && num > 0 ? num.toLocaleString("en-US") : "";
}

function setPreset(val) {
  $("amount").value = val;
  formatAmountDisplay();
  convert();
}

// ─── SWAP ───
function swapCurrencies() {
  const swapBtn = $("swapBtn");
  swapBtn.classList.add("spinning");
  setTimeout(() => swapBtn.classList.remove("spinning"), 300);

  const currentFrom = getFrom();
  const currentTo = getTo();
  fromDropdown.setValue(currentTo);
  toDropdown.setValue(currentFrom);
  lastRate = null;
  updateFavBtnUI();
  if ($("amount").value) convert();
  updateChart(currentTo, currentFrom, activeTimeframe);
}

// ─── KONVERSI ───
async function convert() {
  const amount = parseFloat($("amount").value);
  const from = getFrom();
  const to = getTo();

  if (!amount || amount <= 0 || !from || !to) {
    $("amount").focus();
    return;
  }

  const btn = $("convertBtn");
  btn.disabled = true;
  $("result").hidden = false;
  $("resultValue").textContent = "—";
  $("resultValue").classList.add("loading");

  try {
    const rates = await fetchRates(from);
    const rate = rates[to];
    if (rate === undefined) throw new Error("Kurs tidak ditemukan");

    const result = amount * rate;
    const decimals = result >= 100 ? 2 : result >= 1 ? 4 : 8;
    const fromInfo = getCurrencyInfo(from);
    const toInfo = getCurrencyInfo(to);

    let direction = null;
    if (lastRate !== null) {
      direction = rate > lastRate ? "up" : rate < lastRate ? "down" : null;
    }
    lastRate = rate;

    const resultEl = $("result");
    resultEl.style.animation = "none";
    resultEl.offsetHeight;
    resultEl.style.animation = "";

    $("resultValue").classList.remove("loading");
    animateCount($("resultValue"), result, toInfo.code, decimals, direction);

    $("resultFrom").textContent =
      `${fromInfo.flag} ${amount.toLocaleString("en-US")} ${from}`;
    $("resultRate").textContent =
      `1 ${from} = ${rate.toLocaleString("en-US", { maximumFractionDigits: decimals })} ${to}`;

    const reverseRate = rate ? 1 / rate : 0;
    const revDec = reverseRate >= 100 ? 2 : reverseRate >= 1 ? 4 : 8;
    $("resultReverse").textContent =
      `1 ${to} = ${reverseRate.toLocaleString("en-US", { maximumFractionDigits: revDec })} ${from}`;

    const badge = $("rateBadge");
    if (direction) {
      badge.textContent = direction === "up" ? "▲ NAIK" : "▼ TURUN";
      badge.className = `rate-badge ${direction}`;
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }

    const now = new Date();
    $("resultTime").textContent = now.toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    saveHistory({ from, to, amount, result: result.toFixed(6) });
    renderHistoryUI();
    setStatus(true);

    if (!$("multiView").hidden) {
      renderMulti(from, amount, $("multiSearchInput")?.value || "");
    }
  } catch (err) {
    console.error(err);
    setStatus(false);
    $("resultValue").classList.remove("loading");
    $("resultValue").textContent = "KURS TIDAK TERSEDIA";
  } finally {
    btn.disabled = false;
  }
}

// ─── SALIN & BAGIKAN ───
async function copyResult() {
  const val = $("resultValue").textContent;
  const rate = $("resultRate").textContent;
  if (!val || val === "—") return;
  try {
    await navigator.clipboard.writeText(`${val} (${rate})`);
    showToast("✓ Nilai konversi disalin ke clipboard!");
    $("copyBtn").textContent = "✓ TERSALIN";
    setTimeout(() => {
      $("copyBtn").textContent = "⧉ SALIN HASIL";
    }, 1500);
  } catch {}
}

async function shareResult() {
  const from = getFrom();
  const to = getTo();
  const amount = $("amount").value || "1";
  const url = `${window.location.origin}${window.location.pathname}?amount=${amount}&from=${from}&to=${to}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `KURS // CONVERTER — ${from}/${to}`,
        text: `Cek konversi ${amount} ${from} ke ${to} di Web3 KURS Converter:`,
        url: url,
      });
      return;
    } catch {}
  }

  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(url);
    showToast("🔗 Link konversi disalin!");
  } catch {
    showToast("Gagal membagikan link");
  }
}

// ─── MULTI VIEW TOGGLE ───
function toggleMultiView() {
  const el = $("multiView");
  const btn = $("multiBtn");
  el.hidden = !el.hidden;
  btn.textContent = el.hidden ? "◈ MULTI-KURS" : "✕ TUTUP";
  if (!el.hidden) {
    const amount = parseFloat($("amount").value) || 1;
    renderMulti(getFrom(), amount, $("multiSearchInput")?.value || "");
  }
}

// ─── INIT ───
function init() {
  // Build dropdowns WITHOUT triggering onSelect callbacks during init
  fromDropdown = buildSearchDropdown("fromInput", "fromList", (code) => {
    updateFavBtnUI();
    if ($("amount").value) convert();
    if (toDropdown) updateChart(code, getTo(), activeTimeframe);
  });

  toDropdown = buildSearchDropdown("toInput", "toList", (code) => {
    updateFavBtnUI();
    if ($("amount").value) convert();
    updateChart(getFrom(), code, activeTimeframe);
  });

  // Deep linking via URL Search Params
  const urlParams = new URLSearchParams(window.location.search);
  const paramFrom = urlParams.get("from");
  const paramTo = urlParams.get("to");
  const paramAmount = urlParams.get("amount");

  if (paramAmount) $("amount").value = paramAmount;

  if (paramFrom && paramTo) {
    fromDropdown.setValue(paramFrom.toUpperCase(), true);
    toDropdown.setValue(paramTo.toUpperCase(), true);
  } else {
    const fav = getFavorite();
    if (fav && fav.from && fav.to) {
      fromDropdown.setValue(fav.from, true);
      toDropdown.setValue(fav.to, true);
    } else {
      fromDropdown.setValue("USD", true);
      toDropdown.setValue("IDR", true);
    }
  }

  updateFavBtnUI();
  formatAmountDisplay();
  renderHistoryUI();
  loadTicker();
  convert();

  // Load initial TradingView Chart — both dropdowns are set now
  updateChart(getFrom(), getTo(), activeTimeframe);

  // Online / Offline Listeners
  window.addEventListener("online", () => setStatus(true));
  window.addEventListener("offline", () => setStatus(false));
  setStatus(navigator.onLine);

  // Timeframe selector
  document.querySelectorAll(".tf-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".tf-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeTimeframe = btn.dataset.tf;
      updateChart(getFrom(), getTo(), activeTimeframe);
    });
  });

  // Event listeners
  $("swapBtn").addEventListener("click", swapCurrencies);

  // Real-time live conversion on input typing
  $("amount").addEventListener("input", () => {
    formatAmountDisplay();
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      convert();
    }, 250);
  });

  $("clearAmountBtn").addEventListener("click", () => {
    $("amount").value = "";
    formatAmountDisplay();
    $("amount").focus();
  });

  $("amount").addEventListener("keydown", (e) => {
    if (e.key === "Enter") convert();
  });
  $("convertBtn").addEventListener("click", convert);
  $("copyBtn").addEventListener("click", copyResult);
  $("shareBtn").addEventListener("click", shareResult);
  $("favBtn").addEventListener("click", onFavClick);
  $("clearHistBtn").addEventListener("click", () => {
    clearHistory();
    renderHistoryUI();
    showToast("Riwayat dibersihkan");
  });
  $("multiBtn").addEventListener("click", toggleMultiView);

  $("multiSearchInput")?.addEventListener("input", (e) => {
    const amount = parseFloat($("amount").value) || 1;
    renderMulti(getFrom(), amount, e.target.value);
  });

  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => setPreset(+btn.dataset.val));
  });

  document.addEventListener("keydown", (e) => {
    if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
    if (e.key === "s" || e.key === "S") swapCurrencies();
    if (e.key === "c" || e.key === "C") copyResult();
    if (e.key === "Enter") convert();
  });
}

// Start
init();
