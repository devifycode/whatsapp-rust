# WhatsApp Web Rust Wrapper (`whatsapp-rust.exe`)

Aplikasi desktop Windows (`.exe`) ekstra ringan berbasis **Rust (`tao` + `wry` WebView2)** yang membungkus langsung **`https://web.whatsapp.com`**.

## Mengapa Membungkus WhatsApp Web dengan Rust (`wry` + `tao`)?

- **100% Tampilan & Fitur WhatsApp Web Asli**: Membuka langsung `https://web.whatsapp.com/` menggunakan User-Agent Chromium Desktop terbaru, sehingga seluruh antarmuka, QR login, pesan suara, lampiran, dan enkripsi adalah WhatsApp Web resmi.
- **Sesi Login Tersimpan Otomatis**: Menyimpan profil di `%LOCALAPPDATA%\WhatsAppRust\webview2-profile` sehingga Anda cukup memindai QR Code satu kali saja (tidak perlu login ulang setiap kali aplikasi `.exe` ditutup).
- **Full-Window Tanpa Margin Kosong**: Script `src-rust/inject.js` otomatis menghapus bingkai/margin luar WhatsApp Web sehingga memenuhi 100% jendela aplikasi desktop `.exe`.
- **Ukuran Binary `.exe` Sangat Kecil (`~1.8 MB`)**: Memanfaatkan komponen WebView2 bawaan Windows 10/11 tanpa membundel ratusan MB Chromium seperti Electron.

## Struktur Proyek Rust (`.exe`)

- `Cargo.toml` — Konfigurasi crate Rust dengan dependensi `tao = "0.30"` dan `wry = "0.47"`.
- `build.rs` — Kompilator manifest DPI Per-Monitor V2 Windows (`winres`).
- `src-rust/main.rs` — Kode utama Rust yang membuat jendela native Windows, mengatur folder sesi permanen, dan memuat `https://web.whatsapp.com/`.
- `src-rust/inject.js` — Script CSS/JS yang disuntikkan ke `web.whatsapp.com` agar tampil 100% full-bleed di dalam jendela `.exe` serta mendukung shortcut `Ctrl+R`.
- `.github/workflows/release-exe.yml` — Workflow GitHub Actions yang otomatis mengompilasi dan mempublikasikan `whatsapp-rust.exe` ke halaman **GitHub Releases**.