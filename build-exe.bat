@echo off
title WhatsApp Native Rust (.exe) Builder
echo ============================================================================
echo   WhatsApp Native Rust — Windows Standalone .exe ^& Setup Installer Compiler
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

echo [1/4] Memeriksa toolchain x86_64-pc-windows-msvc...
rustup target add x86_64-pc-windows-msvc

echo [2/4] Mengompilasi binary utama whatsapp-rust.exe (Release Mode)...
cargo build --release --bin whatsapp-rust --target x86_64-pc-windows-msvc
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Kompilasi whatsapp-rust.exe gagal.
    pause
    exit /b 1
)

echo [3/4] Mengompilasi GUI Installer WhatsApp-Rust-Setup.exe (Release Mode)...
cargo build --release --bin WhatsApp-Rust-Setup --target x86_64-pc-windows-msvc
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Kompilasi WhatsApp-Rust-Setup.exe gagal.
    pause
    exit /b 1
)

echo.
echo [4/4] Selesai! File aplikasi .exe ^& Setup Installer Anda siap digunakan:
echo   - Installer GUI : target\x86_64-pc-windows-msvc\release\WhatsApp-Rust-Setup.exe
echo   - Portable .exe : target\x86_64-pc-windows-msvc\release\whatsapp-rust.exe
echo.
pause
