# WhatsApp Native Rust (`whatsapp-rust.exe`)

Aplikasi desktop **WhatsApp Native** super ringan berbasis **Rust** untuk Windows (`.exe`), dirancang untuk menggantikan wrapper berbasis Electron/Chromium yang memakan ratusan MB RAM. Dilengkapi juga dengan **Interactive Studio & Live WebSocket Preview** pada port `3000`.

## Keunggulan Arsitektur Rust Native

- **Pemakaian RAM Ekstra Ringan (`~24 MB – 35 MB`)**: Menggunakan immediate-mode GPU GUI (`eframe` / `egui` dengan backend OpenGL/Glow) atau mode hybrid OS WebView2 (`wry`) tanpa membundel Chromium.
- **Ukuran Binary `.exe` Kecil (`~6.4 MB`)**: Dikompilasi dengan `opt-level = "z"`, Link-Time Optimization (`lto = true`), `panic = "abort"`, dan `strip = true`.
- **Protokol Multi-Device & Tokio Async**: Mesin framing `Noise_XX_25519_AESGCM_SHA256` menggunakan runtime multi-thread `tokio` hemat CPU (2 worker threads).
- **Tanpa Jendela CMD/Console (`windows_subsystem = "windows"`)**: Langsung membuka jendela aplikasi native Windows dengan dukungan System Tray, notifikasi Windows Toast, dan DPI Per-Monitor V2.

## Struktur Kode Rust (`.exe`)

- `Cargo.toml` — Konfigurasi crate Rust, dependensi `eframe`/`egui`/`tokio`/`wry`, dan profil optimasi rilis `.exe`.
- `build.rs` — Script kompilator resource Windows (`winres`) untuk menyematkan manifest DPI dan metadata `.exe`.
- `src-rust/main.rs` — Entry point aplikasi desktop native Windows dan inisialisasi runtime async Tokio.
- `src-rust/protocol.rs` — Implementasi sesi WhatsApp Multi-Device Noise/Signal dan pengelolaan frame pesan.
- `src-rust/ui.rs` — Antarmuka grafis desktop native berbasis `egui` (Sidebar percakapan, ruang chat E2EE, dan QR pairing).
- `src-rust/tray.rs` — Integrasi ikon System Tray Windows dan notifikasi desktop.
- `build-exe.bat` — Script sekali klik di Windows untuk menghasilkan `target\x86_64-pc-windows-msvc\release\whatsapp-rust.exe`.
- `.github/workflows/release-exe.yml` — Pipeline otomatis GitHub Actions untuk mengompilasi artefak `whatsapp-rust.exe` di cloud.

## Cara Build File `.exe` di Windows

1. Pastikan [Rust Toolchain](https://rustup.rs) sudah terpasang di Windows.
2. Jalankan klik ganda pada **`build-exe.bat`**, atau jalankan perintah berikut di terminal:
   ```bash
   cargo build --release --target x86_64-pc-windows-msvc
   ```
3. File hasil kompilasi siap dijalankan di:
   ```text
   target\x86_64-pc-windows-msvc\release\whatsapp-rust.exe
   ```