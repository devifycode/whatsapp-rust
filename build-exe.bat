@echo off
title WhatsApp Native Rust (.exe) Builder
echo ============================================================================
echo   WhatsApp Native Rust — Windows Standalone .exe Compiler
echo   Target: x86_64-pc-windows-msvc (LTO + opt-level="z" + strip=true)
echo ============================================================================
echo.

where cargo >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Rust / Cargo belum terinstal di sistem Windows ini.
    echo Silakan unduh rustup-init.exe dari https://rustup.rs terlebih dahulu.
    pause
    exit /b 1
)

echo [1/3] Memeriksa toolchain x86_64-pc-windows-msvc...
rustup target add x86_64-pc-windows-msvc

echo [2/3] Mengompilasi binary native whatsapp-rust.exe (Release Mode)...
cargo build --release --target x86_64-pc-windows-msvc

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Kompilasi gagal. Periksa log error di atas.
    pause
    exit /b 1
)

echo.
echo [3/3] Selesai! File aplikasi .exe Anda siap digunakan:
echo   - Lokasi: target\x86_64-pc-windows-msvc\release\whatsapp-rust.exe
echo.
pause
