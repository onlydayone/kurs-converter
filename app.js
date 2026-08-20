const API = 'https://api.exchangerate-api.com/v4/latest/';
const HISTORY_KEY = 'kurs_history';
const FAV_KEY     = 'kurs_fav';

const CURRENCIES = [
  { code: 'IDR', flag: '🇮🇩', name: 'Indonesian Rupiah' },
  { code: 'USD', flag: '🇺🇸', name: 'US Dollar' },
  { code: 'EUR', flag: '🇪🇺', name: 'Euro' },
  { code: 'GBP', flag: '🇬🇧', name: 'British Pound' },
  { code: 'JPY', flag: '🇯🇵', name: 'Japanese Yen' },
  { code: 'SGD', flag: '🇸🇬', name: 'Singapore Dollar' },
  { code: 'MYR', flag: '🇲🇾', name: 'Malaysian Ringgit' },
  { code: 'AUD', flag: '🇦🇺', name: 'Australian Dollar' },
  { code: 'CAD', flag: '🇨🇦', name: 'Canadian Dollar' },
  { code: 'CHF', flag: '🇨🇭', name: 'Swiss Franc' },
  { code: 'CNY', flag: '🇨🇳', name: 'Chinese Yuan' },
  { code: 'HKD', flag: '🇭🇰', name: 'Hong Kong Dollar' },
  { code: 'KRW', flag: '🇰🇷', name: 'South Korean Won' },
  { code: 'THB', flag: '🇹🇭', name: 'Thai Baht' },
  { code: 'INR', flag: '🇮🇳', name: 'Indian Rupee' },
  { code: 'SAR', flag: '🇸🇦', name: 'Saudi Riyal' },
  { code: 'AED', flag: '🇦🇪', name: 'UAE Dirham' },
  { code: 'BRL', flag: '🇧🇷', name: 'Brazilian Real' },
  { code: 'MXN', flag: '🇲🇽', name: 'Mexican Peso' },
  { code: 'NZD', flag: '🇳🇿', name: 'New Zealand Dollar' },
  { code: 'PHP', flag: '🇵🇭', name: 'Philippine Peso' },
  { code: 'TWD', flag: '🇹🇼', name: 'Taiwan Dollar' },
  { code: 'SEK', flag: '🇸🇪', name: 'Swedish Krona' },
  { code: 'NOK', flag: '🇳🇴', name: 'Norwegian Krone' },
  { code: 'DKK', flag: '🇩🇰', name: 'Danish Krone' },
  { code: 'PLN', flag: '🇵🇱', name: 'Polish Zloty' },
  { code: 'TRY', flag: '🇹🇷', name: 'Turkish Lira' },
  { code: 'ZAR', flag: '🇿🇦', name: 'South African Rand' },
  { code: 'RUB', flag: '🇷🇺', name: 'Russian Ruble' },
  { code: 'VND', flag: '🇻🇳', name: 'Vietnamese Dong' },
];

const $ = id => document.getElementById(id);
let rates = {};
let lastBase = '';
let lastRate = null;

// ─── CURRENCY SEARCH DROPDOWN ───
function buildSearchDropdown(inputId, selectId) {
  const input = $(inputId);
  const list  = $(selectId);

  function render(query) {
    const q = query.toLowerCase();
    const filtered = CURRENCIES.filter(c =>
      c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
    list.innerHTML = filtered.map(c =>
      `<li data-code="${c.code}">${c.flag} <strong>${c.code}</strong> — ${c.name}</li>`
    ).join('');
  }

  function setValue(code) {
    const c = CURRENCIES.find(x => x.code === code);
    if (!c) return;
    input.value = `${c.flag} ${c.code} — ${c.name}`;
    input.dataset.code = code;
    list.hidden = true;
    renderFavBtn();
    if ($('amount').value) convert();
  }

  input.addEventListener('focus', () => {
    input.value = '';
    input.dataset.code = input.dataset.code || '';
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
      // restore label if user clicks away without selecting
      const code = input.dataset.code;
      if (code) setValue(code);
      list.hidden = true;
    }
  });

  // expose setter
  input._setValue = setValue;
  return { setValue };
}

let fromDrop, toDrop;

function initDropdowns() {
  fromDrop = buildSearchDropdown('fromInput', 'fromList');
  toDrop   = buildSearchDropdown('toInput',   'toList');
  fromDrop.setValue('IDR');
  toDrop.setValue('USD');
}

function getFrom() { return $('fromInput').dataset.code; }
function getTo()   { return $('toInput').dataset.code; }

function getCurrencyInfo(code) {
  return CURRENCIES.find(c => c.code === code) || { code, flag: '🏳️', name: code };
}

// ─── FETCH ───
async function fetchRates(base) {
  if (lastBase === base && Object.keys(rates).length) return rates;
  const res = await fetch(API + base);
  if (!res.ok) throw new Error('API error');
  const data = await res.json();
  lastBase = base;
  rates = data.rates;
  return rates;
}

// ─── TICKER ───
async function loadTicker() {
  try {
    const usdRates = await fetchRates('USD');
    lastBase = ''; rates = {};
    const pairs = ['IDR','EUR','SGD','JPY','GBP','MYR','AUD','KRW','THB','CNY','INR','BRL'];
    const text = pairs.map(c => {
      const info = getCurrencyInfo(c);
      return `${info.flag} USD/${c} ${usdRates[c].toLocaleString('en-US', { maximumFractionDigits: 4 })}`;
    }).join('     ');
    $('ticker').textContent = text + '     ' + text;
  } catch {
    $('ticker').textContent = 'RATE DATA UNAVAILABLE';
  }
}

// ─── AMOUNT DISPLAY ───
function formatAmountDisplay() {
  const num = parseFloat($('amount').value);
  $('amountDisplay').textContent = (!isNaN(num) && num > 0) ? num.toLocaleString('en-US') : '';
}

function setPreset(val) {
  $('amount').value = val;
  formatAmountDisplay();
  convert();
}

// ─── ANIMATE COUNT ───
function animateCount(el, target, suffix, decimals, direction) {
  const duration = 700;
  const start = performance.now();
  // direction: 'up' | 'down' | null
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

// ─── CONVERT ───
async function convert() {
  const amount = parseFloat($('amount').value);
  const from   = getFrom();
  const to     = getTo();
  if (!amount || amount <= 0 || !from || !to) { $('amount').focus(); return; }

  const btn = $('convertBtn');
  btn.disabled = true;
  btn.textContent = 'MENGAMBIL DATA...';
  $('result').hidden = false;
  $('resultValue').textContent = '—';
  $('resultValue').classList.add('loading');

  try {
    const r      = await fetchRates(from);
    const rate   = r[to];
    const result = amount * rate;
    const decimals = result >= 1 ? 2 : 6;
    const fromInfo = getCurrencyInfo(from);
    const toInfo   = getCurrencyInfo(to);

    // direction highlight
    let direction = null;
    if (lastRate !== null) direction = rate > lastRate ? 'up' : rate < lastRate ? 'down' : null;
    lastRate = rate;

    const resultEl = $('result');
    resultEl.style.animation = 'none';
    resultEl.offsetHeight;
    resultEl.style.animation = '';

    $('resultValue').classList.remove('loading');
    animateCount($('resultValue'), result, toInfo.code, decimals, direction);

    $('resultFrom').textContent = `${fromInfo.flag} ${amount.toLocaleString('en-US')} ${from}`;
    $('resultRate').textContent = `1 ${from} = ${rate.toLocaleString('en-US', { maximumFractionDigits: 6 })} ${to}`;

    // konversi balik
    const reverseRate   = r[to] ? 1 / rate : 0;
    const reverseResult = 1 * (1 / rate);
    const revDec = reverseResult >= 1 ? 2 : 6;
    $('resultReverse').textContent =
      `1 ${to} = ${(1/rate).toLocaleString('en-US', { maximumFractionDigits: revDec })} ${from}`;

    // direction badge
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
    setStatus(true);
    if (!$('multiView').hidden) renderMulti();
  } catch {
    setStatus(false);
    $('resultValue').classList.remove('loading');
    $('resultValue').textContent = 'ERROR';
  } finally {
    btn.disabled = false;
    btn.textContent = 'KONVERSI';
  }
}

function setStatus(ok) {
  $('statusDot').className = 'dot ' + (ok ? 'dot--green' : 'dot--red');
  $('statusText').textContent = ok ? 'LIVE' : 'OFFLINE';
}

// ─── SWAP ───
function swapCurrencies() {
  $('swapBtn').classList.add('spinning');
  setTimeout(() => $('swapBtn').classList.remove('spinning'), 300);
  const tmp = getFrom();
  fromDrop.setValue(getTo());
  toDrop.setValue(tmp);
  lastRate = null;
  if ($('amount').value) convert();
}

// ─── COPY ───
async function copyResult() {
  const val  = $('resultValue').textContent;
  const rate = $('resultRate').textContent;
  if (!val || val === '—') return;
  try {
    await navigator.clipboard.writeText(`${val} (${rate})`);
    $('copyBtn').textContent = '✓ TERSALIN';
    setTimeout(() => { $('copyBtn').textContent = '⧉ SALIN'; }, 1500);
  } catch {}
}

// ─── SHARE ───
async function shareResult() {
  const val  = $('resultValue').textContent;
  const rate = $('resultRate').textContent;
  const from = $('resultFrom').textContent;
  if (!navigator.share) { copyResult(); return; }
  try {
    await navigator.share({
      title: 'KURS // CONVERTER',
      text: `${from} = ${val}\n${rate}`,
      url: 'https://onlydayone.github.io/kurs-converter',
    });
  } catch {}
}

// ─── HISTORY ───
function getHistory() { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }

function saveHistory(entry) {
  const h = getHistory();
  h.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 8)));
  renderHistory();
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
}

function renderHistory() {
  const h = getHistory();
  const el = $('historyList');
  const clearBtn = $('clearHistBtn');
  if (!h.length) {
    el.innerHTML = '<li class="empty">BELUM ADA RIWAYAT</li>';
    clearBtn.hidden = true;
    return;
  }
  clearBtn.hidden = false;
  el.innerHTML = h.map((e, i) => {
    const fi = getCurrencyInfo(e.from);
    const ti = getCurrencyInfo(e.to);
    return `<li class="hist-item"><span class="hist-pair">${fi.flag} ${e.from} → ${ti.flag} ${e.to}</span><span class="hist-val">${Number(e.amount).toLocaleString()} = ${Number(e.result).toLocaleString('en-US', { maximumFractionDigits: 4 })}</span><button class="hist-reuse" data-i="${i}" title="Gunakan lagi">↺</button></li>`;
  }).join('');
  el.querySelectorAll('.hist-reuse').forEach(btn => {
    btn.addEventListener('click', () => {
      const e = getHistory()[+btn.dataset.i];
      $('amount').value = e.amount;
      fromDrop.setValue(e.from);
      toDrop.setValue(e.to);
      formatAmountDisplay();
      convert();
    });
  });
}

// ─── FAVORIT ───
function getFav() { return JSON.parse(localStorage.getItem(FAV_KEY) || 'null'); }

function saveFav() {
  localStorage.setItem(FAV_KEY, JSON.stringify({ from: getFrom(), to: getTo() }));
  renderFavBtn();
  $('favBtn').classList.add('fav-pop');
  setTimeout(() => $('favBtn').classList.remove('fav-pop'), 300);
}

function renderFavBtn() {
  const fav = getFav();
  const isSaved = fav && fav.from === getFrom() && fav.to === getTo();
  $('favBtn').textContent = isSaved ? '★ TERSIMPAN' : '☆ FAVORIT';
}

function loadFav() {
  const fav = getFav();
  if (!fav) return;
  fromDrop.setValue(fav.from);
  toDrop.setValue(fav.to);
}

// ─── MULTI VIEW ───
function toggleMulti() {
  const el  = $('multiView');
  const btn = $('multiBtn');
  el.hidden = !el.hidden;
  btn.textContent = el.hidden ? '◈ SEMUA KURS' : '✕ TUTUP';
  if (!el.hidden) renderMulti();
}

async function renderMulti() {
  const amount = parseFloat($('amount').value) || 1;
  const from   = getFrom();
  const el     = $('multiBody');
  el.innerHTML = '<tr><td colspan="3" class="empty">MEMUAT...</td></tr>';
  try {
    const r = await fetchRates(from);
    el.innerHTML = CURRENCIES
      .filter(c => c.code !== from)
      .map(c => {
        const result = amount * r[c.code];
        const dec = result >= 1 ? 2 : 6;
        return `<tr><td class="multi-flag">${c.flag}</td><td class="multi-code">${c.code}</td><td class="multi-val">${result.toLocaleString('en-US', { maximumFractionDigits: dec })}</td></tr>`;
      }).join('');
  } catch {
    el.innerHTML = '<tr><td colspan="3" class="empty">GAGAL MEMUAT</td></tr>';
  }
}

// ─── KEYBOARD SHORTCUTS ───
document.addEventListener('keydown', e => {
  if (['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)) return;
  if (e.key === 's' || e.key === 'S') swapCurrencies();
  if (e.key === 'c' || e.key === 'C') copyResult();
  if (e.key === 'Enter') convert();
});

// ─── EVENT LISTENERS ───
$('swapBtn').addEventListener('click', swapCurrencies);
$('amount').addEventListener('input', formatAmountDisplay);
$('amount').addEventListener('keydown', e => { if (e.key === 'Enter') convert(); });
$('convertBtn').addEventListener('click', convert);
$('copyBtn').addEventListener('click', copyResult);
$('shareBtn').addEventListener('click', shareResult);
$('favBtn').addEventListener('click', saveFav);
$('clearHistBtn').addEventListener('click', clearHistory);
$('multiBtn').addEventListener('click', toggleMulti);

document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => setPreset(+btn.dataset.val));
});

// ─── INIT ───
initDropdowns();
loadFav();
renderFavBtn();
formatAmountDisplay();
renderHistory();
loadTicker();
