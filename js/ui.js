import { CURRENCIES, getCurrencyInfo } from './currencies.js';
import { fetchRates } from './api.js';

export const $ = id => document.getElementById(id);

export function buildSearchDropdown(inputId, listId, onSelect) {
  const input = $(inputId);
  const list = $(listId);

  function render(query = '') {
    const q = query.toLowerCase().trim();
    const filtered = CURRENCIES.filter(c =>
      c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
    list.innerHTML = filtered.map(c =>
      `<li data-code="${c.code}">${c.flag} <strong>${c.code}</strong> — ${c.name}</li>`
    ).join('');
  }

  function setValue(code) {
    const c = getCurrencyInfo(code);
    input.value = `${c.flag} ${c.code} — ${c.name}`;
    input.dataset.code = code;
    list.hidden = true;
    if (onSelect) onSelect(code);
  }

  input.addEventListener('focus', () => {
    input.value = '';
    render('');
    list.hidden = false;
  });

  input.addEventListener('input', () => {
    render(input.value);
    list.hidden = false;
  });

  list.addEventListener('click', e => {
    const li = e.target.closest('li');
    if (li) setValue(li.dataset.code);
  });

  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !list.contains(e.target)) {
      const code = input.dataset.code;
      if (code) setValue(code);
      list.hidden = true;
    }
  });

  return { setValue, getCode: () => input.dataset.code };
}

export async function loadTicker() {
  const ticker = $('ticker');
  try {
    const usdRates = await fetchRates('USD');
    const pairs = ['IDR', 'EUR', 'SGD', 'JPY', 'GBP', 'MYR', 'AUD', 'KRW', 'THB', 'CNY', 'INR', 'BRL'];
    const text = pairs.map(c => {
      const info = getCurrencyInfo(c);
      const rateStr = usdRates[c] ? usdRates[c].toLocaleString('en-US', { maximumFractionDigits: 4 }) : '-';
      return `${info.flag} USD/${c} ${rateStr}`;
    }).join('     ');
    ticker.textContent = text + '     ' + text;
  } catch {
    ticker.textContent = 'DATA NILAI TUKAR TIDAK TERSEDIA';
  }
}

export function animateCount(el, target, suffix, decimals, direction) {
  const duration = 700;
  const start = performance.now();

  if (direction) {
    el.dataset.dir = direction;
    setTimeout(() => { delete el.dataset.dir; }, 1200);
  }

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = (target * ease).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + ' ' + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

export function setStatus(isOnline) {
  $('statusDot').className = 'dot ' + (isOnline ? 'dot--green' : 'dot--red');
  $('statusText').textContent = isOnline ? 'LIVE' : 'OFFLINE';
}

export async function renderMulti(baseCurrency, amount) {
  const el = $('multiBody');
  el.innerHTML = '<tr><td colspan="3" class="empty">MEMUAT...</td></tr>';
  try {
    const r = await fetchRates(baseCurrency);
    el.innerHTML = CURRENCIES
      .filter(c => c.code !== baseCurrency)
      .map(c => {
        const result = (amount || 1) * (r[c.code] || 0);
        const dec = result >= 1 ? 2 : 6;
        return `
          <tr>
            <td class="multi-flag">${c.flag}</td>
            <td class="multi-code">${c.code}</td>
            <td class="multi-val">${result.toLocaleString('en-US', { maximumFractionDigits: dec })}</td>
          </tr>`;
      }).join('');
  } catch {
    el.innerHTML = '<tr><td colspan="3" class="empty">GAGAL MEMUAT NILAI TUKAR</td></tr>';
  }
}
