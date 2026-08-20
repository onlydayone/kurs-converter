const API_BASE = 'https://api.exchangerate-api.com/v4/latest/';
let rateCache = {};
let lastBase = '';

export async function fetchRates(base, bypassCache = false) {
  if (!bypassCache && lastBase === base && Object.keys(rateCache).length) {
    return rateCache;
  }
  const res = await fetch(API_BASE + base);
  if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
  const data = await res.json();
  lastBase = base;
  rateCache = data.rates;
  return rateCache;
}

export function clearCache() {
  rateCache = {};
  lastBase = '';
}
