import { getCurrencyInfo } from "./currencies.js";

const FIAT_API_BASE = "https://api.exchangerate-api.com/v4/latest/";
const FRANKFURTER_BASE = "https://api.frankfurter.dev/v1/";
const BINANCE_KLINES = "https://api.binance.com/api/v3/klines";
const COINGECKO_SIMPLE = "https://api.coingecko.com/api/v3/simple/price";

// In-memory cache
let rateCache = {};
let lastBase = "";
let cryptoUsdCache = { data: {}, timestamp: 0 };
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache for fast trading feel

/**
 * Fetch USD prices for all supported cryptocurrencies
 */
export async function fetchCryptoPrices() {
  const now = Date.now();
  if (
    cryptoUsdCache.timestamp &&
    now - cryptoUsdCache.timestamp < CACHE_TTL_MS
  ) {
    return cryptoUsdCache.data;
  }

  try {
    const res = await fetch(
      `${COINGECKO_SIMPLE}?ids=bitcoin,ethereum,solana,binancecoin,tether,ripple&vs_currencies=usd&include_24hr_change=true`,
    );
    if (res.ok) {
      const data = await res.json();
      cryptoUsdCache = {
        timestamp: now,
        data: {
          BTC: {
            usd: data.bitcoin?.usd || 90000,
            change24h: data.bitcoin?.usd_24h_change || 0,
          },
          ETH: {
            usd: data.ethereum?.usd || 3000,
            change24h: data.ethereum?.usd_24h_change || 0,
          },
          SOL: {
            usd: data.solana?.usd || 180,
            change24h: data.solana?.usd_24h_change || 0,
          },
          BNB: {
            usd: data.binancecoin?.usd || 600,
            change24h: data.binancecoin?.usd_24h_change || 0,
          },
          USDT: {
            usd: data.tether?.usd || 1,
            change24h: data.tether?.usd_24h_change || 0,
          },
          XRP: {
            usd: data.ripple?.usd || 2.2,
            change24h: data.ripple?.usd_24h_change || 0,
          },
        },
      };
      return cryptoUsdCache.data;
    }
  } catch (err) {
    console.warn(
      "CoinGecko fetch failed, falling back to offline estimates",
      err,
    );
  }

  // Fallback defaults if offline / rate limited
  return {
    BTC: { usd: 92000, change24h: 1.25 },
    ETH: { usd: 3400, change24h: -0.85 },
    SOL: { usd: 195, change24h: 3.4 },
    BNB: { usd: 650, change24h: 0.5 },
    USDT: { usd: 1.0, change24h: 0.01 },
    XRP: { usd: 2.3, change24h: 2.1 },
  };
}

/**
 * Fetch unified exchange rates for a given base asset (Fiat or Crypto)
 */
export async function fetchRates(base, bypassCache = false) {
  if (!bypassCache && lastBase === base && Object.keys(rateCache).length) {
    return rateCache;
  }

  const baseInfo = getCurrencyInfo(base);
  const cryptoPrices = await fetchCryptoPrices();

  // 1. Fetch USD-based Fiat rates first
  let usdRates = {};
  try {
    const res = await fetch(FIAT_API_BASE + "USD");
    if (res.ok) {
      const json = await res.json();
      usdRates = json.rates;
    }
  } catch (e) {
    console.warn("Fiat API USD fetch failed", e);
  }

  // Ensure USD base has USD=1
  usdRates["USD"] = 1;

  // Build Unified Matrix relative to USD
  const allInUsd = { ...usdRates };
  for (const [code, val] of Object.entries(cryptoPrices)) {
    allInUsd[code] = 1 / val.usd; // How much Crypto you get for 1 USD
  }

  // Convert to requested base
  const rates = {};
  if (baseInfo.type === "crypto") {
    const baseUsdPrice = cryptoPrices[base]?.usd || 1;
    // 1 Unit of Crypto = baseUsdPrice USD
    for (const [code, rateAgainstUsd] of Object.entries(allInUsd)) {
      if (code === base) {
        rates[code] = 1;
      } else {
        rates[code] = rateAgainstUsd * baseUsdPrice;
      }
    }
  } else {
    // Base is Fiat
    const baseUsdRate = usdRates[base] || 1; // 1 USD = baseUsdRate Units
    for (const [code, rateAgainstUsd] of Object.entries(allInUsd)) {
      rates[code] = rateAgainstUsd / baseUsdRate;
    }
  }

  lastBase = base;
  rateCache = rates;
  return rates;
}

/**
 * Fetch Historical Time-series for TradingView Chart
 * @param {string} from - Base currency
 * @param {string} to - Target currency
 * @param {string} timeframe - '24H' | '7D' | '30D' | '1Y'
 */
export async function fetchHistoricalData(from, to, timeframe = "30D") {
  const fromInfo = getCurrencyInfo(from);
  const toInfo = getCurrencyInfo(to);
  const isCryptoPair = fromInfo.type === "crypto" || toInfo.type === "crypto";

  // 1. If Crypto pair -> Fetch Binance Kline data
  if (isCryptoPair) {
    return fetchCryptoHistorical(from, to, timeframe);
  }

  // 2. Fiat pair -> Fetch Frankfurter API or synthetic fallback
  return fetchFiatHistorical(from, to, timeframe);
}

async function fetchCryptoHistorical(from, to, timeframe) {
  const fromInfo = getCurrencyInfo(from);
  const toInfo = getCurrencyInfo(to);
  const cryptoCode = fromInfo.type === "crypto" ? from : to;
  const isInverse = toInfo.type === "crypto" && fromInfo.type !== "crypto";

  let interval = "1d";
  let limit = 30;
  if (timeframe === "24H") {
    interval = "1h";
    limit = 24;
  } else if (timeframe === "7D") {
    interval = "1d";
    limit = 7;
  } else if (timeframe === "30D") {
    interval = "1d";
    limit = 30;
  } else if (timeframe === "1Y") {
    interval = "1w";
    limit = 52;
  }

  const symbol = (fromInfo.binanceSymbol || `${cryptoCode}USDT`).replace(
    "USDTUSDT",
    "USDCUSDT",
  );

  try {
    const res = await fetch(
      `${BINANCE_KLINES}?symbol=${symbol}&interval=${interval}&limit=${limit}`,
    );
    if (res.ok) {
      const data = await res.json();
      // Target fiat rate against USD
      const fiatRates = await fetchRates("USD");
      const fiatMultiplier =
        fromInfo.type === "crypto"
          ? fiatRates[to] || 1
          : 1 / (fiatRates[from] || 1);

      return data.map((item) => {
        const timeSec = Math.floor(item[0] / 1000);
        let val = parseFloat(item[4]); // close price in USDT
        if (fromInfo.type === "crypto") {
          val = val * (to === "USD" || to === "USDT" ? 1 : fiatRates[to] || 1);
        } else {
          // Fiat to crypto
          val =
            1 /
            (val *
              (from === "USD" || from === "USDT"
                ? 1
                : 1 / (fiatRates[from] || 1)));
        }
        return {
          time: timeSec,
          value: val,
        };
      });
    }
  } catch (err) {
    console.warn("Binance historical fetch error", err);
  }

  // Generate synthetic points if API fails
  return generateSyntheticSeries(from, to, timeframe);
}

// Frankfurter only supports ECB currencies; IDR, SAR, AED, VND, TWD etc. are not supported
const FRANKFURTER_SUPPORTED = new Set([
  "EUR",
  "USD",
  "GBP",
  "JPY",
  "CHF",
  "AUD",
  "CAD",
  "SEK",
  "NOK",
  "DKK",
  "NZD",
  "SGD",
  "HKD",
  "KRW",
  "CNY",
  "INR",
  "BRL",
  "MXN",
  "PLN",
  "TRY",
  "ZAR",
  "PHP",
  "TWD",
  "THB",
  "MYR",
]);

async function fetchFiatHistorical(from, to, timeframe) {
  let days = 30;
  if (timeframe === "24H") days = 1;
  if (timeframe === "7D") days = 7;
  if (timeframe === "30D") days = 30;
  if (timeframe === "1Y") days = 365;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const formatDate = (d) => d.toISOString().split("T")[0];

  // Skip Frankfurter for unsupported currencies to avoid 422 errors
  if (!FRANKFURTER_SUPPORTED.has(from) || !FRANKFURTER_SUPPORTED.has(to)) {
    return generateSyntheticSeries(from, to, timeframe);
  }

  try {
    // Frankfurter supports EUR base or cross pairs for major currencies
    const res = await fetch(
      `${FRANKFURTER_BASE}${formatDate(startDate)}..${formatDate(endDate)}?from=${from}&to=${to}`,
    );
    if (res.ok) {
      const json = await res.json();
      const points = [];
      for (const [dateStr, rates] of Object.entries(json.rates)) {
        if (rates[to]) {
          points.push({
            time: Math.floor(new Date(dateStr).getTime() / 1000),
            value: rates[to],
          });
        }
      }
      if (points.length > 2) return points;
    }
  } catch (err) {
    console.warn("Frankfurter historical fetch failed", err);
  }

  return generateSyntheticSeries(from, to, timeframe);
}

function generateSyntheticSeries(from, to, timeframe) {
  const points = [];
  const count =
    timeframe === "24H"
      ? 24
      : timeframe === "7D"
        ? 7
        : timeframe === "30D"
          ? 30
          : 52;
  const stepSec =
    timeframe === "24H" ? 3600 : timeframe === "1Y" ? 86400 * 7 : 86400;
  const nowSec = Math.floor(Date.now() / 1000);
  // rateCache is keyed by lastBase; try direct lookup then cross-rate fallback
  const currentRate =
    rateCache[to] || (rateCache[from] ? 1 / rateCache[from] : 1) || 1;

  let current = currentRate * (1 - (Math.random() * 0.04 - 0.02));
  for (let i = count - 1; i >= 0; i--) {
    const noise = (Math.random() - 0.49) * 0.02 * current;
    current += noise;
    points.push({
      time: nowSec - i * stepSec,
      value: Math.max(0.000001, current),
    });
  }
  // Ensure the last point matches current rate
  if (points.length) {
    points[points.length - 1].value = currentRate;
  }
  return points;
}

export function clearCache() {
  rateCache = {};
  lastBase = "";
  cryptoUsdCache = { data: {}, timestamp: 0 };
}
