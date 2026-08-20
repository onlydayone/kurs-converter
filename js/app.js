import { getCurrencyInfo } from './currencies.js';
import { fetchRates } from './api.js';
import { getHistory, saveHistory, clearHistory, getFavorite, saveFavorite } from './storage.js';
import {
  $,
  buildSearchDropdown,
  loadTicker,
  animateCount,
  setStatus,
  renderMulti
} from './ui.js';

let fromDropdown, toDropdown;
let lastRate = null;

function getFrom() { return fromDropdown ? fromDropdown.getCode() : 'IDR'; }
function getTo()   { return toDropdown ? toDropdown.getCode() : 'USD'; }

// ─── RIWAYAT ───
function renderHistoryUI() {
  const history = getHistory();
  const el = $('historyList');
  const clearBtn = $('clearHistBtn');

  if (!history.length) {
    el.innerHTML = '<li class="empty">BELUM ADA RIWAYAT</li>';
    clearBtn.hidden = true;
    return;
  }

  clearBtn.hidden = false;
  el.innerHTML = history.map((e, i) => {
    const fi = getCurrencyInfo(e.from);
    const ti = getCurrencyInfo(e.to);
    return `
      <li class="hist-item">
        <span class="hist-pair">${fi.flag} ${e.from} → ${ti.flag} ${e.to}</span>
        <span class="hist-val">${Number(e.amount).toLocaleString()} = ${Number(e.result).toLocaleString('en-US', { maximumFractionDigits: 4 })}</span>
        <button class="hist-reuse" data-i="${i}" title="Gunakan lagi">↺</button>
      </li>`;
  }).join('');

  el.querySelectorAll('.hist-reuse').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = getHistory()[+btn.dataset.i];
      if (!item) return;
      $('amount').value = item.amount;
      fromDropdown.setValue(item.from);
      toDropdown.setValue(item.to);
      formatAmountDisplay();
      convert();
    });
  });
}

// ─── FAVORIT ───
function updateFavBtnUI() {
  const fav = getFavorite();
  const isSaved = fav && fav.from === getFrom() && fav.to === getTo();
  $('favBtn').textContent = isSaved ? '★ TERSIMPAN' : '☆ FAVORIT';
}

function onFavClick() {
  saveFavorite({ from: getFrom(), to: getTo() });
  updateFavBtnUI();
  const btn = $('favBtn');
  btn.classList.add('fav-pop');
  setTimeout(() => btn.classList.remove('fav-pop'), 300);
}

// ─── FORMAT DISPLAY ───
function formatAmountDisplay() {
  const num = parseFloat($('amount').value);
  $('amountDisplay').textContent = (!isNaN(num) && num > 0) ? num.toLocaleString('en-US') : '';
}

function setPreset(val) {
  $('amount').value = val;
  formatAmountDisplay();
  convert();
}

// ─── SWAP ───
function swapCurrencies() {
  const swapBtn = $('swapBtn');
  swapBtn.classList.add('spinning');
  setTimeout(() => swapBtn.classList.remove('spinning'), 300);

  const currentFrom = getFrom();
  const currentTo = getTo();
  fromDropdown.setValue(currentTo);
  toDropdown.setValue(currentFrom);
  lastRate = null;
  updateFavBtnUI();
  if ($('amount').value) convert();
}

// ─── KONVERSI ───
async function convert() {
  const amount = parseFloat($('amount').value);
  const from = getFrom();
  const to = getTo();

  if (!amount || amount <= 0 || !from || !to) {
    $('amount').focus();
    return;
  }

  const btn = $('convertBtn');
  btn.disabled = true;
  btn.textContent = 'MENGAMBIL DATA...';
  $('result').hidden = false;
  $('resultValue').textContent = '—';
  $('resultValue').classList.add('loading');

  try {
    const rates = await fetchRates(from);
    const rate = rates[to];
    if (rate === undefined) throw new Error('Kurs tidak ditemukan');

    const result = amount * rate;
    const decimals = result >= 1 ? 2 : 6;
    const fromInfo = getCurrencyInfo(from);
    const toInfo = getCurrencyInfo(to);

    let direction = null;
    if (lastRate !== null) {
      direction = rate > lastRate ? 'up' : rate < lastRate ? 'down' : null;
    }
    lastRate = rate;

    const resultEl = $('result');
    resultEl.style.animation = 'none';
    resultEl.offsetHeight;
    resultEl.style.animation = '';

    $('resultValue').classList.remove('loading');
    animateCount($('resultValue'), result, toInfo.code, decimals, direction);

    $('resultFrom').textContent = `${fromInfo.flag} ${amount.toLocaleString('en-US')} ${from}`;
    $('resultRate').textContent = `1 ${from} = ${rate.toLocaleString('en-US', { maximumFractionDigits: 6 })} ${to}`;

    const reverseRate = rate ? 1 / rate : 0;
    const revDec = reverseRate >= 1 ? 2 : 6;
    $('resultReverse').textContent = `1 ${to} = ${reverseRate.toLocaleString('en-US', { maximumFractionDigits: revDec })} ${from}`;

    const badge = $('rateBadge');
    if (direction) {
      badge.textContent = direction === 'up' ? '▲ NAIK' : '▼ TURUN';
      badge.dataset.dir = direction;
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }

    const now = new Date();
    $('resultTime').textContent = now.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

    saveHistory({ from, to, amount, result: result.toFixed(6) });
    renderHistoryUI();
    setStatus(true);

    if (!$('multiView').hidden) {
      renderMulti(from, amount);
    }
  } catch (err) {
    setStatus(false);
    $('resultValue').classList.remove('loading');
    $('resultValue').textContent = 'ERROR';
  } finally {
    btn.disabled = false;
    btn.textContent = 'KONVERSI';
  }
}

// ─── SALIN & BAGIKAN ───
async function copyResult() {
  const val = $('resultValue').textContent;
  const rate = $('resultRate').textContent;
  if (!val || val === '—') return;
  try {
    await navigator.clipboard.writeText(`${val} (${rate})`);
    $('copyBtn').textContent = '✓ TERSALIN';
    setTimeout(() => { $('copyBtn').textContent = '⧉ SALIN'; }, 1500);
  } catch {}
}

async function shareResult() {
  const val = $('resultValue').textContent;
  const rate = $('resultRate').textContent;
  const from = $('resultFrom').textContent;
  if (!navigator.share) {
    copyResult();
    return;
  }
  try {
    await navigator.share({
      title: 'KURS // CONVERTER',
      text: `${from} = ${val}\n${rate}`,
      url: window.location.href,
    });
  } catch {}
}

// ─── MULTI VIEW TOGGLE ───
function toggleMultiView() {
  const el = $('multiView');
  const btn = $('multiBtn');
  el.hidden = !el.hidden;
  btn.textContent = el.hidden ? '◈ SEMUA KURS' : '✕ TUTUP';
  if (!el.hidden) {
    const amount = parseFloat($('amount').value) || 1;
    renderMulti(getFrom(), amount);
  }
}

// ─── INIT ───
function init() {
  fromDropdown = buildSearchDropdown('fromInput', 'fromList', () => {
    updateFavBtnUI();
    if ($('amount').value) convert();
  });

  toDropdown = buildSearchDropdown('toInput', 'toList', () => {
    updateFavBtnUI();
    if ($('amount').value) convert();
  });

  const fav = getFavorite();
  if (fav && fav.from && fav.to) {
    fromDropdown.setValue(fav.from);
    toDropdown.setValue(fav.to);
  } else {
    fromDropdown.setValue('IDR');
    toDropdown.setValue('USD');
  }

  updateFavBtnUI();
  formatAmountDisplay();
  renderHistoryUI();
  loadTicker();

  // Event listeners
  $('swapBtn').addEventListener('click', swapCurrencies);
  $('amount').addEventListener('input', formatAmountDisplay);
  $('amount').addEventListener('keydown', e => { if (e.key === 'Enter') convert(); });
  $('convertBtn').addEventListener('click', convert);
  $('copyBtn').addEventListener('click', copyResult);
  $('shareBtn').addEventListener('click', shareResult);
  $('favBtn').addEventListener('click', onFavClick);
  $('clearHistBtn').addEventListener('click', () => {
    clearHistory();
    renderHistoryUI();
  });
  $('multiBtn').addEventListener('click', toggleMultiView);

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => setPreset(+btn.dataset.val));
  });

  document.addEventListener('keydown', e => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (e.key === 's' || e.key === 'S') swapCurrencies();
    if (e.key === 'c' || e.key === 'C') copyResult();
    if (e.key === 'Enter') convert();
  });
}

init();
