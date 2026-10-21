// Hide Windows command prompt window in release .exe builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use std::fs;
use std::path::PathBuf;
use tao::{
    dpi::LogicalSize,
    event::{Event, StartCause, WindowEvent},
    event_loop::{ControlFlow, EventLoop},
    window::WindowBuilder,
};
use wry::{WebContext, WebViewBuilder};

/// Official WhatsApp Web URL
const WHATSAPP_WEB_URL: &str = "https://web.whatsapp.com/";

/// Modern Desktop Chromium User-Agent required by WhatsApp Web
const CHROME_USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0";

/// Returns persistent profile folder (%LOCALAPPDATA%\WhatsAppRust\webview2-profile)
/// so WhatsApp Web QR login session stays logged in across restarts.
fn get_persistent_profile_dir() -> PathBuf {
    let base = env::var("LOCALAPPDATA")
        .or_else(|_| env::var("APPDATA"))
        .map(PathBuf::from)
        .unwrap_or_else(|_| env::temp_dir());

    let profile_dir = base.join("WhatsAppRust").join("webview2-profile");
    let _ = fs::create_dir_all(&profile_dir);
    profile_dir
}

fn main() -> wry::Result<()> {
    // Reduce WebView2 background memory footprint via Chromium flags
    env::set_var(
        "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
        "--disable-features=msSmartScreenProtection --enable-SmoothScrolling --js-flags=--max-old-space-size=256",
    );

    let event_loop = EventLoop::new();

    let window = WindowBuilder::new()
        .with_title("WhatsApp")
        .with_inner_size(LogicalSize::new(1240.0, 820.0))
        .with_min_inner_size(LogicalSize::new(780.0, 520.0))
        .with_decorations(true)
        .build(&event_loop)
        .expect("Failed to create native Windows viewport");

    // Persistent WebContext keeps IndexedDB, LocalStorage & WhatsApp QR session saved
    let profile_dir = get_persistent_profile_dir();
    let mut web_context = WebContext::new(Some(profile_dir));

    let init_script = include_str!("inject.js");

    let _webview = WebViewBuilder::with_web_context(&mut web_context)
        .with_url(WHATSAPP_WEB_URL)
        .with_user_agent(CHROME_USER_AGENT)
        .with_initialization_script(init_script)
        .with_devtools(cfg!(debug_assertions))
        .with_clipboard(true)
        .with_autoplay(true)
        .build(&window)?;

    event_loop.run(move |event, _, control_flow| {
        *control_flow = ControlFlow::Wait;

        match event {
            Event::NewEvents(StartCause::Init) => {}
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
