# WhatsApp Web Rust Wrapper (`whatsapp-rust.exe` & `WhatsApp-Rust-Setup.exe`)

Aplikasi desktop Windows (`.exe`) ekstra ringan berbasis **Rust (`tao` + `wry` WebView2)** yang membungkus langsung **`https://web.whatsapp.com`** lengkap dengan ikon WhatsApp resmi, **Windows Setup Installer (pemilih lokasi penyimpanan)**, dan fitur **Auto Zoom In / Out (`Ctrl + Scroll`)** seperti browser modern.

## Fitur Utama

- **100% Tampilan & Fitur WhatsApp Web Asli**: Membuka langsung `https://web.whatsapp.com/` menggunakan User-Agent Chromium Desktop terbaru, sehingga seluruh antarmuka, QR login, pesan suara, lampiran, dan enkripsi adalah WhatsApp Web resmi.
- **Auto Zoom In / Out seperti Browser (`Ctrl + Scroll` & Shortcut)**:
  - **`Ctrl + Scroll Mouse` (Atas / Bawah)**: Otomatis memperbesar (*Zoom In*) atau memperkecil (*Zoom Out*) skala tampilan WhatsApp Web dengan mulus (`50%` hingga `200%`).
  - **`Ctrl + Plus (+)` / `Ctrl + Minus (-)`**: Memperbesar atau memperkecil tampilan per `10%`.
  - **`Ctrl + 0`**: Mengembalikan ukuran zoom ke `100%` (default).
  -Dilengkapi **HUD Indikator Zoom** di pojok kanan atas dan penyimpanan otomatis level zoom di `localStorage` sehingga ukuran zoom tetap tersimpan saat aplikasi dibuka kembali.
- **Installer Windows (`WhatsApp-Rust-Setup.exe`) dengan Pemilih Lokasi Penyimpanan**:
  - Memungkinkan pengguna memilih folder/drive instalasi (misal `D:\WhatsAppRust` atau `C:\Users\...\AppData\Local\WhatsAppRust`).
  - Menulis konfigurasi `storage-location.txt` sehingga seluruh cache WebView2, IndexedDB, dan sesi login WhatsApp tersimpan di drive/folder pilihan pengguna.
- **Ikon Aplikasi `.exe` & Titlebar Resmi**: Menyematkan logo WhatsApp ke dalam file binary `.exe` (`assets/icon.ico` via `winres`) serta ikon jendela/taskbar native (`assets/icon_rgba_64.bin`).
- **Ukuran Binary `.exe` Sangat Kecil (`~1.8 MB`)**: Memanfaatkan komponen WebView2 bawaan Windows 10/11 tanpa membundel ratusan MB Chromium seperti Electron.

## Struktur Proyek Rust (`.exe`)

- `Cargo.toml` — Konfigurasi crate Rust dengan dependensi `tao = "0.30"` dan `wry = "0.47"`.
- `build.rs` — Kompilator manifest DPI Per-Monitor V2 Windows & ikon `.exe` (`winres`).
- `src-rust/main.rs` — Kode utama Rust yang membuat jendela native Windows, mengatur lokasi penyimpanan sesi (`storage-location.txt`), mengaktifkan `.with_hotkeys_zoom(true)`, serta menangani IPC `webview.zoom(factor)`.
- `src-rust/inject.js` — Script CSS/JS yang disuntikkan ke `web.whatsapp.com` agar tampil 100% full-bleed tanpa margin serta menangani `Ctrl + Scroll` (Mouse Wheel), `Ctrl + +/-`, `Ctrl + 0`, dan HUD Zoom interaktif.
- `installer.nsi` — Script NSIS Installer untuk membangun `WhatsApp-Rust-Setup.exe` dengan halaman pemilih direktori instalasi & penyimpanan data.
- `.github/workflows/release-exe.yml` — Workflow GitHub Actions yang otomatis mengompilasi dan mempublikasikan `WhatsApp-Rust-Setup.exe` dan `whatsapp-rust.exe` ke halaman **GitHub Releases**.