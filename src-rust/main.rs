// Hide Windows command prompt window in release .exe builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod protocol;
mod tray;
mod ui;

use std::sync::Arc;
use tokio::sync::Mutex;

use crate::protocol::WhatsAppNoiseClient;
use crate::tray::SystemTrayController;
use crate::ui::WhatsAppNativeApp;

/// Runtime configuration for WhatsApp Native Rust (.exe)
#[allow(dead_code)]
#[derive(Clone, Debug)]
pub struct NativeConfig {
    pub app_title: String,
    pub ram_limit_mb: usize,
    pub minimize_to_tray: bool,
    pub always_on_top: bool,
    pub auto_start_windows: bool,
    pub hardware_acceleration: bool,
}

impl Default for NativeConfig {
    fn default() -> Self {
        Self {
            app_title: String::from("WhatsApp Native Rust (x86_64-pc-windows-msvc)"),
            ram_limit_mb: 32, // Recommended optimal working-set cap (32 MB)
            minimize_to_tray: true,
            always_on_top: false,
            auto_start_windows: false,
            hardware_acceleration: true,
        }
    }
}

fn main() -> eframe::Result<()> {
    let config = NativeConfig::default();
    let app_title = config.app_title.clone();

    // Initialize multi-threaded async Tokio runtime with minimal worker footprint (2 threads)
    let rt = tokio::runtime::Builder::new_multi_thread()
        .worker_threads(2)
        .thread_name("wa-rust-net")
        .enable_all()
        .build()
        .expect("Failed to initialize Tokio runtime");

    let _guard = rt.enter();

    // Initialize WhatsApp Multi-Device Noise_XX_25519_AESGCM_SHA256 client state
    let protocol_client = Arc::new(Mutex::new(WhatsAppNoiseClient::new()));

    // Spawn background WebSocket keepalive & frame dispatcher
    let protocol_clone = Arc::clone(&protocol_client);
    rt.spawn(async move {
        WhatsAppNoiseClient::run_keepalive_loop(protocol_clone).await;
    });

    // Initialize Windows System Tray Controller
    let tray_controller = SystemTrayController::initialize(&app_title);

    // Configure ultra-lightweight native Windows viewport (eframe / glow OpenGL/DirectX backend)
    let mut viewport = egui::ViewportBuilder::default()
        .with_title(&app_title)
        .with_inner_size([1180.0_f32, 760.0_f32])
        .with_min_inner_size([840.0_f32, 540.0_f32])
        .with_decorations(true);

    if config.always_on_top {
        viewport = viewport.with_always_on_top();
    }

    let native_options = eframe::NativeOptions {
        viewport,
        vsync: true,
        multisampling: 2,
        renderer: eframe::Renderer::Glow,
        ..Default::default()
    };

    eframe::run_native(
        &app_title,
        native_options,
        Box::new(move |cc| {
            Ok(Box::new(WhatsAppNativeApp::new(
                cc,
                config,
                protocol_client,
                tray_controller,
            )))
        }),
    )
}
