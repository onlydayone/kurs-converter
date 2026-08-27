import { CURRENCIES, getCurrencyInfo } from "./currencies.js";
import { fetchRates, fetchCryptoPrices } from "./api.js";

export const $ = (id) => document.getElementById(id);

export function showToast(message, duration = 2500) {
  const toast = $("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  setTimeout(() => {
    toast.hidden = true;
  }, duration);
}

export function buildSearchDropdown(inputId, listId, onSelect) {
  const input = $(inputId);
  const list = $(listId);

  function render(query = "") {
    const q = query.toLowerCase().trim();
    const filtered = CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
    );
    list.innerHTML = filtered
      .map(
        (c) =>
          `<li data-code="${c.code}">
        <span>${c.flag}</span>
        <strong>${c.code}</strong> — ${c.name}
        ${c.type === "crypto" ? '<span class="crypto-badge">CRYPTO</span>' : ""}
      </li>`,
      )
      .join("");
  }

  function setValue(code, silent = false) {
    const c = getCurrencyInfo(code);
    input.value = `${c.flag} ${c.code} — ${c.name}`;
    input.dataset.code = code;
    list.hidden = true;
    if (!silent && onSelect) onSelect(code);
  }

  input.addEventListener("focus", () => {
    input.value = "";
    render("");
    list.hidden = false;
  });

  input.addEventListener("input", () => {
    render(input.value);
    list.hidden = false;
  });

  list.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (li && li.dataset.code) setValue(li.dataset.code);
  });

  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !list.contains(e.target)) {
      const code = input.dataset.code;
      if (code) setValue(code);
      list.hidden = true;
    }
  });

  return { setValue, getCode: () => input.dataset.code };
}

export async function loadTicker() {
  const ticker = $("ticker");
  try {
    const [usdRates, crypto] = await Promise.all([
      fetchRates("USD"),
      fetchCryptoPrices(),
    ]);

    const items = [
      `🪙 BTC/USD $${(crypto.BTC?.usd || 0).toLocaleString()}`,
      `🔷 ETH/USD $${(crypto.ETH?.usd || 0).toLocaleString()}`,
      `🟣 SOL/USD $${(crypto.SOL?.usd || 0).toLocaleString()}`,
      `🇮🇩 USD/IDR ${(usdRates.IDR || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
      `🇪🇺 EUR/USD ${(1 / (usdRates.EUR || 1)).toFixed(4)}`,
      `🇯🇵 USD/JPY ${(usdRates.JPY || 0).toFixed(2)}`,
      `🇸🇬 USD/SGD ${(usdRates.SGD || 0).toFixed(4)}`,
      `🇬🇧 GBP/USD ${(1 / (usdRates.GBP || 1)).toFixed(4)}`,
    ];

    const text = items.join("     ·     ");
    ticker.textContent = text + "     ·     " + text;
  } catch {
    ticker.textContent = "FEED NILAI TUKAR BERJALAN OFFLINE";
  }
}

export function animateCount(el, target, suffix, decimals, direction) {
  const duration = 600;
  const start = performance.now();

  if (direction) {
    el.dataset.dir = direction;
    setTimeout(() => {
      delete el.dataset.dir;
    }, 1200);
  }

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const currentVal = target * ease;
    el.textContent =
      currentVal.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }) +
      " " +
      suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

export function setStatus(isOnline) {
  $("statusDot").className = "dot " + (isOnline ? "dot--green" : "dot--red");
  $("statusText").textContent = isOnline ? "LIVE NETWORK" : "OFFLINE MODE";
}

export async function renderMulti(baseCurrency, amount, searchQuery = "") {
  const el = $("multiBody");
  el.innerHTML =
    '<tr><td colspan="3" class="empty">MEMUAT PERBANDINGAN MULTI-PASAR...</td></tr>';
  try {
    const r = await fetchRates(baseCurrency);
    const q = searchQuery.toLowerCase().trim();
    const filtered = CURRENCIES.filter((c) => c.code !== baseCurrency).filter(
      (c) =>
        !q ||
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q),
    );

    if (!filtered.length) {
      el.innerHTML =
        '<tr><td colspan="3" class="empty">TIDAK ADA MATA UANG COCOK</td></tr>';
      return;
    }

    el.innerHTML = filtered
      .map((c) => {
        const result =
          (isNaN(amount) || amount <= 0 ? 1 : amount) * (r[c.code] || 0);
        const dec = result >= 100 ? 2 : result >= 1 ? 4 : 8;
        return `
        <tr>
          <td class="multi-flag">${c.flag}</td>
          <td class="multi-code">
            ${c.code}
            ${c.type === "crypto" ? '<span class="crypto-badge">CRYPTO</span>' : ""}
          </td>
          <td class="multi-val">${result.toLocaleString("en-US", { maximumFractionDigits: dec })}</td>
        </tr>`;
      })
      .join("");
  } catch {
    el.innerHTML =
      '<tr><td colspan="3" class="empty">GAGAL MEMUAT DATA PASAR</td></tr>';
  }
}
