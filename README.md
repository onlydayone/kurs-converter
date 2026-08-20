# 💱 KURS // CONVERTER

Aplikasi konversi nilai tukar mata uang real-time dengan tampilan dan *vibe* Crypto CEX (Binance / OKX dark style).

🌐 **Live Demo:** [https://onlydayone.github.io/kurs-converter](https://onlydayone.github.io/kurs-converter)

---

## ✨ Fitur Utama

- 🌍 **30 Mata Uang Dunia** lengkap dengan bendera emoji & nama resmi negara.
- 🔍 **Pencarian Cepat (Instant Filter)** di dropdown mata uang.
- 🔄 **Konversi 2 Arah Otomatis** (misal: IDR → USD & USD → IDR sekaligus).
- 📈 **Indikator Fluktuasi Kurs** (badge hijau ▲ NAIK / merah ▼ TURUN).
- ⚡ **Preset Nominal Cepat** (10K, 100K, 1M, 10M, 100M).
- ◈ **Mode Semua Kurs (Multi-Rates View)** — bandingkan 1 nominal ke 29 mata uang lainnya sekaligus.
- ↺ **Riwayat Konversi Lokal** & tombol pakai ulang tanpa login (`localStorage`).
- ★ **Pasangan Mata Uang Favorit** yang otomatis termuat saat membuka app.
- 📱 **Mobile Friendly & Responsif Penuh** (hingga layar 360px).
- ⌨️ **Pintasan Keyboard:**
  - <kbd>Enter</kbd> : Jalankan konversi
  - <kbd>S</kbd> : Tukar posisi mata uang (Swap)
  - <kbd>C</kbd> : Salin hasil ke clipboard

---

## 📁 Struktur Proyek (Modular ES Modules)

```text
kurs-converter/
├── index.html          # Markup utama antarmuka pengguna
├── README.md           # Dokumentasi proyek
├── css/
│   ├── base.css        # Variabel warna, reset, typography & status bar
│   └── components.css  # Styling kartu, form, search dropdown, & hasil
└── js/
    ├── currencies.js   # Daftar 30 mata uang & helper info
    ├── api.js          # Fetch API nilai tukar + cache handling
    ├── storage.js      # Manajemen riwayat & pasangan favorit di localStorage
    ├── ui.js           # Render UI, count-up animation, ticker & multi-rates
    └── app.js          # Entry point utama & controller event listener
```

---

## 🔌 Sumber Data API

Menggunakan endpoint gratis publik dari [exchangerate-api.com](https://exchangerate-api.com) tanpa kebutuhan API key.

---

## 🚀 Cara Menjalankan Lokal

Karena proyek ini menggunakan ES Modules bawaan browser (`type="module"`), jalankan menggunakan local static server:

```bash
# Menggunakan Node / npx
npx serve .

# Atau menggunakan Python 3
python3 -m http.server 8000
```
