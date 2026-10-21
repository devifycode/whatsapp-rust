// Hide Windows command prompt window in release .exe builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use std::fs;
use std::path::PathBuf;
use tao::{
    dpi::LogicalSize,
    event::{Event, StartCause, WindowEvent},
    event_loop::{ControlFlow, EventLoopBuilder},
    window::{Icon, WindowBuilder},
};
use wry::{WebContext, WebViewBuilder};

/// Official WhatsApp Web URL
const WHATSAPP_WEB_URL: &str = "https://web.whatsapp.com/";

/// Modern Desktop Chromium User-Agent required by WhatsApp Web
const CHROME_USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0";

/// Embedded 64x64 RGBA WhatsApp Icon for native window titlebar & taskbar
const ICON_RGBA_64: &[u8] = include_bytes!("../assets/icon_rgba_64.bin");

#[derive(Debug, Clone)]
enum UserEvent {
    SetZoom(f64),
}

/// Resolves the storage directory for WhatsApp Web session, IndexedDB, and media cache.
/// Priority:
/// 1. `storage-location.txt` in the same folder as `whatsapp-rust.exe` (written by WhatsApp-Rust-Setup.exe installer)
/// 2. `<exe_dir>\webview2-profile` if the installation folder is writable
/// 3. `%LOCALAPPDATA%\WhatsAppRust\webview2-profile` fallback
fn get_persistent_profile_dir() -> PathBuf {
    if let Ok(exe_path) = env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            // 1. Check custom path configured by Installer in storage-location.txt
            let cfg_file = exe_dir.join("storage-location.txt");
            if let Ok(custom_path_raw) = fs::read_to_string(&cfg_file) {
                let trimmed = custom_path_raw.trim();
                if !trimmed.is_empty() {
                    let custom_dir = PathBuf::from(trimmed);
                    if fs::create_dir_all(&custom_dir).is_ok() {
                        return custom_dir;
                    }
                }
            }

            // 2. Try portable profile folder right inside the chosen installation directory
            let local_profile = exe_dir.join("webview2-profile");
            if fs::create_dir_all(&local_profile).is_ok() {
                let test_file = local_profile.join(".write_test");
                if fs::write(&test_file, b"ok").is_ok() {
                    let _ = fs::remove_file(test_file);
                    return local_profile;
                }
            }
        }
    }

    // 3. Fallback to %LOCALAPPDATA%\WhatsAppRust\webview2-profile
    let base = env::var("LOCALAPPDATA")
        .or_else(|_| env::var("APPDATA"))
        .map(PathBuf::from)
        .unwrap_or_else(|_| env::temp_dir());

    let profile_dir = base.join("WhatsAppRust").join("webview2-profile");
    let _ = fs::create_dir_all(&profile_dir);
    profile_dir
}

fn load_window_icon() -> Option<Icon> {
    Icon::from_rgba(ICON_RGBA_64.to_vec(), 64, 64).ok()
}

fn main() -> wry::Result<()> {
    // Reduce WebView2 background memory footprint via Chromium flags
    env::set_var(
        "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
        "--disable-features=msSmartScreenProtection --enable-SmoothScrolling --js-flags=--max-old-space-size=256",
    );

    let event_loop = EventLoopBuilder::<UserEvent>::with_user_event().build();
    let proxy = event_loop.create_proxy();

    let window = WindowBuilder::new()
        .with_title("WhatsApp")
        .with_window_icon(load_window_icon())
        .with_inner_size(LogicalSize::new(1240.0, 820.0))
        .with_min_inner_size(LogicalSize::new(640.0, 480.0))
        .with_decorations(true)
        .build(&event_loop)
        .expect("Failed to create native Windows viewport");

    // Persistent WebContext keeps IndexedDB, LocalStorage & WhatsApp QR session saved
    // inside the user's chosen installation/storage directory
    let profile_dir = get_persistent_profile_dir();
    let mut web_context = WebContext::new(Some(profile_dir));

    let init_script = include_str!("inject.js");

    let webview = WebViewBuilder::with_web_context(&mut web_context)
        .with_url(WHATSAPP_WEB_URL)
        .with_user_agent(CHROME_USER_AGENT)
        .with_initialization_script(init_script)
        .with_hotkeys_zoom(true)
        .with_ipc_handler(move |req| {
            let body = req.body();
            if let Some(zoom_str) = body.strip_prefix("zoom:") {
                if let Ok(factor) = zoom_str.trim().parse::<f64>() {
                    let clamped = factor.clamp(0.5, 2.5);
                    let _ = proxy.send_event(UserEvent::SetZoom(clamped));
                }
            }
        })
        .with_devtools(cfg!(debug_assertions))
        .with_clipboard(true)
        .with_autoplay(true)
        .build(&window)?;

    event_loop.run(move |event, _, control_flow| {
        *control_flow = ControlFlow::Wait;

        match event {
            Event::NewEvents(StartCause::Init) => {}
            Event::UserEvent(UserEvent::SetZoom(factor)) => {
                let _ = webview.zoom(factor);
            }
            Event::WindowEvent {
                event: WindowEvent::CloseRequested,
                ..
            } => {
                *control_flow = ControlFlow::Exit;
            }
            _ => {}
        }
    });
}
