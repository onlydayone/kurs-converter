https://onlydayone.github.io/kurs-converterconst API = 'https://api.exchangerate-api.com/v4/latest/';
const HISTORY_KEY = 'kurs_history';
const FAV_KEY     = 'kurs_fav';

const CURRENCIES = [
  'IDR','USD','EUR','GBP','JPY','SGD','MYR','AUD','CAD','CHF',
  'CNY','HKD','KRW','THB','INR','SAR','AED','BRL','MXN','NZD'
];

const $ = id => document.getElementById(id);

let rates = {};

// Populate selects
function populateSelects() {
  ['from','to'].forEach(id => {
    const sel = $(id);
    CURRENCIES.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      sel.appendChild(opt);
    });
  });
  $('from').value = 'IDR';
  $('to').value = 'USD';
}

// Fetch rates from base currency
async function fetchRates(base) {
  const res = await fetch(API + base);
  if (!res.ok) throw new Error('API error');
  const data = await res.json();
  return data.rates;
}

// Ticker: show a few popular rates vs USD
async function loadTicker() {
  try {
    const usdRates = await fetchRates('USD');
    const pairs = ['IDR','EUR','SGD','JPY','GBP','MYR','AUD','KRW','THB'];
    const text = pairs
      .map(c => `USD/${c}: ${usdRates[c].toLocaleString('en-US', { maximumFractionDigits: 4 })}`)
      .join('   ·   ');
    $('ticker').textContent = text + '   ·   ' + text; // double for seamless loop
  } catch {
    $('ticker').textContent = 'RATE DATA UNAVAILABLE';
  }
}

// Count-up animation
function animateCount(el, target, decimals) {
  const duration = 600;
  const start = performance.now();
  const from = 0;

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const val = from + (target - from) * ease;
    el.textContent = val.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// Convert
async function convert() {
  const amount = parseFloat($('amount').value);
  const from   = $('from').value;
  const to     = $('to').value;

  if (!amount || amount <= 0) {
    $('amount').focus();
    return;
  }

  const btn = $('convertBtn');
  btn.disabled = true;
  btn.textContent = 'FETCHING...';

  try {
    rates = await fetchRates(from);
    const rate   = rates[to];
    const result = amount * rate;

    // Decide decimal places: if result >= 1, 2 decimals; else 6
    const decimals = result >= 1 ? 2 : 6;

    const resultEl = $('result');
    resultEl.hidden = false;

    // Remove and re-add to re-trigger animation
    resultEl.style.animation = 'none';
    resultEl.offsetHeight; // reflow
    resultEl.style.animation = '';

    animateCount($('resultValue'), result, decimals);

    $('resultRate').textContent =
      `1 ${from} = ${rate.toLocaleString('en-US', { maximumFractionDigits: 6 })} ${to}`;

    const now = new Date();
    $('resultTime').textContent =
      `UPDATED: ${now.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}`;

    saveHistory({ from, to, amount, result: result.toFixed(6) });
    setStatus(true);
  } catch {
    setStatus(false);
    $('resultValue').textContent = 'ERROR';
    $('result').hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = 'CONVERT';
  }
}

function setStatus(ok) {
  const dot  = $('statusDot');
  const text = $('statusText');
  dot.className  = 'dot ' + (ok ? 'dot--green' : 'dot--red');
  text.textContent = ok ? 'LIVE' : 'OFFLINE';
}

// Swap
$('swapBtn').addEventListener('click', () => {
  const tmp = $('from').value;
  $('from').value = $('to').value;
  $('to').value   = tmp;
});

// Convert on Enter
$('amount').addEventListener('keydown', e => { if (e.key === 'Enter') convert(); });
$('convertBtn').addEventListener('click', convert);

// Copy result to clipboard
async function copyResult() {
  const val = $('resultValue').textContent;
  const rate = $('resultRate').textContent;
  if (!val || val === '—') return;
  await navigator.clipboard.writeText(`${val} (${rate})`);
  const btn = $('copyBtn');
  btn.textContent = 'COPIED!';
  setTimeout(() => { btn.textContent = '⧉ COPY'; }, 1500);
}

// History
function getHistory() {
  return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
}

function saveHistory(entry) {
  const h = getHistory();
  h.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 5)));
  renderHistory();
}

function renderHistory() {
  const h = getHistory();
  const el = $('historyList');
  if (!h.length) { el.innerHTML = '<li class="empty">NO HISTORY YET</li>'; return; }
  el.innerHTML = h.map((e, i) => `
    <li class="hist-item" data-i="${i}">
      <span class="hist-pair">${e.from} → ${e.to}</span>
      <span class="hist-val">${Number(e.amount).toLocaleString()} = ${Number(e.result).toLocaleString('en-US', { maximumFractionDigits: 4 })}</span>
      <button class="hist-reuse" data-i="${i}">↺</button>
    </li>
  `).join('');
  el.querySelectorAll('.hist-reuse').forEach(btn => {
    btn.addEventListener('click', () => {
      const e = getHistory()[+btn.dataset.i];
      $('amount').value = e.amount;
      $('from').value   = e.from;
      $('to').value     = e.to;
      convert();
    });
  });
}

// Favorites
function getFav() {
  return JSON.parse(localStorage.getItem(FAV_KEY) || 'null');
}

function saveFav() {
  const fav = { from: $('from').value, to: $('to').value };
  localStorage.setItem(FAV_KEY, JSON.stringify(fav));
  renderFavBtn();
}

function renderFavBtn() {
  const fav = getFav();
  const cur = { from: $('from').value, to: $('to').value };
  $('favBtn').textContent = (fav && fav.from === cur.from && fav.to === cur.to) ? '★ SAVED' : '☆ FAVORITE';
}

function loadFav() {
  const fav = getFav();
  if (!fav) return;
  $('from').value = fav.from;
  $('to').value   = fav.to;
}

// Auto-convert on currency change
['from','to'].forEach(id => {
  $(id).addEventListener('change', () => {
    renderFavBtn();
    if ($('amount').value) convert();
  });
});

$('copyBtn').addEventListener('click', copyResult);
$('favBtn').addEventListener('click', saveFav);

// Init
populateSelects();
loadFav();
renderFavBtn();
renderHistory();
loadTicker();