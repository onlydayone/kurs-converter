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

function populateSelects() {
  ['from','to'].forEach(id => {
    const sel = $(id);
    CURRENCIES.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.code;
      opt.textContent = `${c.flag} ${c.code} — ${c.name}`;
      sel.appendChild(opt);
    });
  });
  $('from').value = 'IDR';
  $('to').value = 'USD';
}

function getCurrencyInfo(code) {
  return CURRENCIES.find(c => c.code === code) || { code, flag: '🏳️', name: code };
}

async function fetchRates(base) {
  if (lastBase === base && Object.keys(rates).length) return rates;
  const res = await fetch(API + base);
  if (!res.ok) throw new Error('API error');
  const data = await res.json();
  lastBase = base;
  rates = data.rates;
  return rates;
}

async function loadTicker() {
  try {
    const usdRates = await fetchRates('USD');
    lastBase = ''; rates = {};
    const pairs = ['IDR','EUR','SGD','JPY','GBP','MYR','AUD','KRW','THB','CNY','INR','BRL'];
    const text = pairs
      .map(c => {
        const info = getCurrencyInfo(c);
        return `${info.flag} USD/${c} ${usdRates[c].toLocaleString('en-US', { maximumFractionDigits: 4 })}`;
      })
      .join('     ');
    $('ticker').textContent = text + '     ' + text;
  } catch {
    $('ticker').textContent = 'RATE DATA UNAVAILABLE';
  }
}

function formatAmountDisplay() {
  const num = parseFloat($('amount').value);
  $('amountDisplay').textContent = (!isNaN(num) && num > 0) ? num.toLocaleString('en-US') : '';
}

function setPreset(val) {
  $('amount').value = val;
  formatAmountDisplay();
  convert();
}

function animateCount(el, target, suffix, decimals) {
  const duration = 700;
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const val = target * ease;
    el.textContent = val.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + ' ' + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

async function convert() {
  const amount = parseFloat($('amount').value);
  const from = $('from').value;
  const to = $('to').value;
  if (!amount || amount <= 0) { $('amount').focus(); return; }

  const btn = $('convertBtn');
  btn.disabled = true;
  btn.textContent = 'FETCHING...';
  $('result').hidden = false;
  $('resultValue').textContent = '—';
  $('resultValue').classList.add('loading');

  try {
    const r = await fetchRates(from);
    const rate = r[to];
    const result = amount * rate;
    const decimals = result >= 1 ? 2 : 6;
    const fromInfo = getCurrencyInfo(from);
    const toInfo = getCurrencyInfo(to);

    const resultEl = $('result');
    resultEl.style.animation = 'none';
    resultEl.offsetHeight;
    resultEl.style.animation = '';

    $('resultValue').classList.remove('loading');
    animateCount($('resultValue'), result, toInfo.code, decimals);

    $('resultFrom').textContent = `${fromInfo.flag} ${amount.toLocaleString('en-US')} ${from}`;
    $('resultRate').textContent = `1 ${from} = ${rate.toLocaleString('en-US', { maximumFractionDigits: 6 })} ${to}`;

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
    btn.textContent = 'CONVERT';
  }
}

function setStatus(ok) {
  $('statusDot').className = 'dot ' + (ok ? 'dot--green' : 'dot--red');
  $('statusText').textContent = ok ? 'LIVE' : 'OFFLINE';
}

function swapCurrencies() {
  $('swapBtn').classList.add('spinning');
  setTimeout(() => $('swapBtn').classList.remove('spinning'), 300);
  const tmp = $('from').value;
  $('from').value = $('to').value;
  $('to').value = tmp;
  renderFavBtn();
  if ($('amount').value) convert();
}

async function copyResult() {
  const val = $('resultValue').textContent;
  const rate = $('resultRate').textContent;
  if (!val || val === '—') return;
  try {
    await navigator.clipboard.writeText(`${val} (${rate})`);
    $('copyBtn').textContent = '✓ COPIED';
    setTimeout(() => { $('copyBtn').textContent = '⧉ COPY'; }, 1500);
  } catch {}
}

async function shareResult() {
  const val = $('resultValue').textContent;
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
    el.innerHTML = '<li class="empty">NO HISTORY YET</li>';
    clearBtn.hidden = true;
    return;
  }
  clearBtn.hidden = false;
  el.innerHTML = h.map((e, i) => {
    const fi = getCurrencyInfo(e.from);
    const ti = getCurrencyInfo(e.to);
    return `<li class="hist-item"><span class="hist-pair">${fi.flag} ${e.from} → ${ti.flag} ${e.to}</span><span class="hist-val">${Number(e.amount).toLocaleString()} = ${Number(e.result).toLocaleString('en-US', { maximumFractionDigits: 4 })}</span><button class="hist-reuse" data-i="${i}" title="Reuse">↺</button></li>`;
  }).join('');
  el.querySelectorAll('.hist-reuse').forEach(btn => {
    btn.addEventListener('click', () => {
      const e = getHistory()[+btn.dataset.i];
      $('amount').value = e.amount;
      $('from').value = e.from;
      $('to').value = e.to;
      formatAmountDisplay();
      convert();
    });
  });
}

function getFav() { return JSON.parse(localStorage.getItem(FAV_KEY) || 'null'); }

function saveFav() {
  localStorage.setItem(FAV_KEY, JSON.stringify({ from: $('from').value, to: $('to').value }));
  renderFavBtn();
  $('favBtn').classList.add('fav-pop');
  setTimeout(() => $('favBtn').classList.remove('fav-pop'), 300);
}

function renderFavBtn() {
  const fav = getFav();
  const cur = { from: $('from').value, to: $('to').value };
  $('favBtn').textContent = (fav && fav.from === cur.from && fav.to === cur.to) ? '★ SAVED' : '☆ FAV';
}

function loadFav() {
  const fav = getFav();
  if (!fav) return;
  $('from').value = fav.from;
  $('to').value = fav.to;
}

function toggleMulti() {
  const el = $('multiView');
  const btn = $('multiBtn');
  el.hidden = !el.hidden;
  btn.textContent = el.hidden ? '◈ MULTI' : '✕ CLOSE';
  if (!el.hidden) renderMulti();
}

async function renderMulti() {
  const amount = parseFloat($('amount').value) || 1;
  const from = $('from').value;
  const el = $('multiBody');
  el.innerHTML = '<tr><td colspan="3" class="empty">LOADING...</td></tr>';
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
    el.innerHTML = '<tr><td colspan="3" class="empty">ERROR LOADING</td></tr>';
  }
}

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

['from','to'].forEach(id => {
  $(id).addEventListener('change', () => {
    renderFavBtn();
    if ($('amount').value) convert();
  });
});

populateSelects();
loadFav();
renderFavBtn();
formatAmountDisplay();
renderHistory();
loadTicker();
