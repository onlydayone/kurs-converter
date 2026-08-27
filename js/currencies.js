export const CURRENCIES = [
  // Top Cryptocurrencies (Web3)
  {
    code: "BTC",
    flag: "🪙",
    name: "Bitcoin",
    type: "crypto",
    coingeckoId: "bitcoin",
    binanceSymbol: "BTCUSDT",
  },
  {
    code: "ETH",
    flag: "🔷",
    name: "Ethereum",
    type: "crypto",
    coingeckoId: "ethereum",
    binanceSymbol: "ETHUSDT",
  },
  {
    code: "SOL",
    flag: "🟣",
    name: "Solana",
    type: "crypto",
    coingeckoId: "solana",
    binanceSymbol: "SOLUSDT",
  },
  {
    code: "BNB",
    flag: "🟡",
    name: "BNB Chain",
    type: "crypto",
    coingeckoId: "binancecoin",
    binanceSymbol: "BNBUSDT",
  },
  {
    code: "USDT",
    flag: "💵",
    name: "Tether USD",
    type: "crypto",
    coingeckoId: "tether",
    binanceSymbol: "USDTUSDT",
  },
  {
    code: "XRP",
    flag: "✕",
    name: "XRP Ledger",
    type: "crypto",
    coingeckoId: "ripple",
    binanceSymbol: "XRPUSDT",
  },

  // World Fiat Currencies
  { code: "IDR", flag: "🇮🇩", name: "Indonesian Rupiah", type: "fiat" },
  { code: "USD", flag: "🇺🇸", name: "US Dollar", type: "fiat" },
  { code: "EUR", flag: "🇪🇺", name: "Euro", type: "fiat" },
  { code: "GBP", flag: "🇬🇧", name: "British Pound", type: "fiat" },
  { code: "JPY", flag: "🇯🇵", name: "Japanese Yen", type: "fiat" },
  { code: "SGD", flag: "🇸🇬", name: "Singapore Dollar", type: "fiat" },
  { code: "MYR", flag: "🇲🇾", name: "Malaysian Ringgit", type: "fiat" },
  { code: "AUD", flag: "🇦🇺", name: "Australian Dollar", type: "fiat" },
  { code: "CAD", flag: "🇨🇦", name: "Canadian Dollar", type: "fiat" },
  { code: "CHF", flag: "🇨🇭", name: "Swiss Franc", type: "fiat" },
  { code: "CNY", flag: "🇨🇳", name: "Chinese Yuan", type: "fiat" },
  { code: "HKD", flag: "🇭🇰", name: "Hong Kong Dollar", type: "fiat" },
  { code: "KRW", flag: "🇰🇷", name: "South Korean Won", type: "fiat" },
  { code: "THB", flag: "🇹🇭", name: "Thai Baht", type: "fiat" },
  { code: "INR", flag: "🇮🇳", name: "Indian Rupee", type: "fiat" },
  { code: "SAR", flag: "🇸🇦", name: "Saudi Riyal", type: "fiat" },
  { code: "AED", flag: "🇦🇪", name: "UAE Dirham", type: "fiat" },
  { code: "BRL", flag: "🇧🇷", name: "Brazilian Real", type: "fiat" },
  { code: "MXN", flag: "🇲🇽", name: "Mexican Peso", type: "fiat" },
  { code: "NZD", flag: "🇳🇿", name: "New Zealand Dollar", type: "fiat" },
  { code: "PHP", flag: "🇵🇭", name: "Philippine Peso", type: "fiat" },
  { code: "TWD", flag: "🇹🇼", name: "Taiwan Dollar", type: "fiat" },
  { code: "SEK", flag: "🇸🇪", name: "Swedish Krona", type: "fiat" },
  { code: "NOK", flag: "🇳🇴", name: "Norwegian Krone", type: "fiat" },
  { code: "DKK", flag: "🇩🇰", name: "Danish Krone", type: "fiat" },
  { code: "PLN", flag: "🇵🇱", name: "Polish Zloty", type: "fiat" },
  { code: "TRY", flag: "🇹🇷", name: "Turkish Lira", type: "fiat" },
  { code: "ZAR", flag: "🇿🇦", name: "South African Rand", type: "fiat" },
  { code: "RUB", flag: "🇷🇺", name: "Russian Ruble", type: "fiat" },
  { code: "VND", flag: "🇻🇳", name: "Vietnamese Dong", type: "fiat" },
];

export function getCurrencyInfo(code) {
  return (
    CURRENCIES.find((c) => c.code === code) || {
      code,
      flag: "🌐",
      name: code,
      type: "fiat",
    }
  );
}
