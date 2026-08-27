# ⚡ KURS // WEB3 TRADING TERMINAL & CONVERTER

Aplikasi konversi mata uang global (Fiat + Crypto) dengan antarmuka **Web3 CEX Terminal (Binance / OKX / Bybit dark neon aesthetic)** dilengkapi grafik interaktif TradingView.

🌐 **Live Demo:** [https://onlydayone.github.io/kurs-converter](https://onlydayone.github.io/kurs-converter)

---

## ✨ Fitur Unggulan

- 📈 **TradingView Interactive Lightweight Chart** — Grafik interaktif realtime area chart dengan timeframe `24H`, `7D`, `1M`, `1Y` dan statistik ribbon 24h (High, Low, Change).
- 🪙 **Dukungan Crypto & Fiat Terpadu** — Konversi langsung antara aset kripto (BTC, ETH, SOL, BNB, USDT, XRP) dan 30+ mata uang fiat dunia.
- ⚡ **Realtime Live Conversion** — Konversi otomatis saat mengetik dengan debouncing responsif.
- 🔗 **Deep Linking & Sharing** — Bagikan link konversi spesifik melalui URL parameters (contoh: `?from=BTC&to=USD&amount=1`) serta dukungan Web Share API & Clipboard.
- 📱 **PWA Ready (Progressive Web App)** — Dilengkapi `manifest.json` agar dapat diinstal langsung di layar utama smartphone atau desktop.
- 🌐 **Multi-Source Aggregation (No API Key Required)**:
  - **ExchangeRate-API** untuk data nilai tukar fiat global.
  - **CoinGecko Simple Price API** untuk harga crypto realtime & persentase 24h.
  - **Binance Public Spot API** untuk data candlestick/klines historis crypto.
  - **Frankfurter API** untuk data historis time-series fiat.
- ◈ **Multi-Rates Matrix dengan Quick Search** — Bandingkan 1 aset ke seluruh mata uang dan crypto sekaligus dengan fitur live search filter.
- 🔍 **Smart Search Dropdown** — Filter cepat mata uang berdasarkan kode, nama negara, atau tag kategori `CRYPTO` / `FIAT`.
- ↺ **Riwayat Transaksi & Pasangan Favorit** — Tersimpan otomatis di `localStorage` peramban.
- ⌨️ **Pintasan Keyboard:**
  - <kbd>Enter</kbd> : Jalankan konversi
  - <kbd>S</kbd> : Tukar posisi aset (Swap)
  - <kbd>C</kbd> : Salin hasil ke clipboard

---

## 📁 Struktur Proyek (Modular ES Modules)

```text
kurs-converter/
├── index.html          # Markup terminal Web3 & Open Graph metadata
├── manifest.json       # Konfigurasi Progressive Web App (PWA)
├── README.md           # Dokumentasi proyek
├── css/
│   ├── base.css        # Variabel warna neon CEX, reset, typography & status bar
│   └── components.css  # Styling kartu terminal, chart canvas, timeframe pills, toasts
└── js/
    ├── currencies.js   # Database mata uang fiat + crypto top cap
    ├── api.js          # Agregator data multi-API (ExchangeRate, CoinGecko, Binance, Frankfurter)
    ├── chart.js        # Integrasi TradingView Lightweight Charts & 24h stats
    ├── storage.js      # Manajemen riwayat & pasangan favorit di localStorage
    ├── ui.js           # Render UI, animasi angka neon, search filter, ticker & toast
    └── app.js          # Main controller & event listeners
```

---

## 🚀 Cara Menjalankan Secara Lokal

Cukup jalankan static HTTP server pada folder proyek:

```bash
# Menggunakan Python 3
python3 -m http.server 8080

# Atau menggunakan Node / npx serve
npx serve .
```

Buka peramban di `http://localhost:8080`.

## 🚀 Cara Menjalankan Lokal

Karena proyek ini menggunakan ES Modules bawaan browser (`type="module"`), jalankan menggunakan local static server:

```bash
# Menggunakan Node / npx
npx serve .

# Atau menggunakan Python 3
python3 -m http.server 8000
```
