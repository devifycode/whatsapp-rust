// src-rust/installer.rs
// Standalone Native Windows GUI Setup Installer (WhatsApp-Rust-Setup.exe)
// Allows the user to choose the installation & WebView2 data storage directory,
// extracts whatsapp-rust.exe + icon.ico, writes storage-location.txt,
// creates Desktop & Start Menu shortcuts, and launches WhatsApp.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use std::fs;
use std::os::windows::process::CommandExt;
use std::path::PathBuf;
use std::process::Command;
use tao::{
    dpi::LogicalSize,
    event::{Event, StartCause, WindowEvent},
    event_loop::{ControlFlow, EventLoopBuilder},
    window::{Icon, WindowBuilder},
};
use wry::WebViewBuilder;

const CREATE_NO_WINDOW: u32 = 0x08000000;

/// Embedded compiled standalone WhatsApp binary
const APP_EXE_BYTES: &[u8] =
    include_bytes!("../target/x86_64-pc-windows-msvc/release/whatsapp-rust.exe");

/// Embedded official WhatsApp .ico file for shortcuts
const ICON_ICO_BYTES: &[u8] = include_bytes!("../assets/icon.ico");

/// Embedded 64x64 RGBA icon for installer window titlebar
const ICON_RGBA_64: &[u8] = include_bytes!("../assets/icon_rgba_64.bin");

#[derive(Debug, Clone)]
enum InstallerEvent {
    BrowseFolder,
    RunInstall {
        target_dir: String,
        create_shortcut: bool,
        launch_after: bool,
    },
    CloseInstaller,
}

fn load_window_icon() -> Option<Icon> {
    Icon::from_rgba(ICON_RGBA_64.to_vec(), 64, 64).ok()
}

fn get_default_install_dir() -> String {
    let base = env::var("LOCALAPPDATA")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("C:\\WhatsAppRust"));
    base.join("Programs")
        .join("WhatsAppRust")
        .to_string_lossy()
        .to_string()
}

fn pick_folder_dialog(initial_dir: &str) -> Option<String> {
    let ps_script = format!(
        "Add-Type -AssemblyName System.Windows.Forms; \
         $f = New-Object System.Windows.Forms.FolderBrowserDialog; \
         $f.Description = 'Pilih folder lokasi penyimpanan WhatsApp & Data Sesi'; \
         $f.SelectedPath = '{}'; \
         if ($f.ShowDialog() -eq 'OK') {{ Write-Output $f.SelectedPath }}",
        initial_dir.replace('\'', "''")
    );

    let output = Command::new("powershell")
        .args(["-NoProfile", "-Sta", "-Command", &ps_script])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .ok()?;

    let selected = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if selected.is_empty() {
        None
    } else {
        let final_path = PathBuf::from(&selected);
        if final_path
            .file_name()
            .map(|n| n.to_string_lossy().to_lowercase().contains("whatsapp"))
            .unwrap_or(false)
        {
            Some(selected)
        } else {
            Some(final_path.join("WhatsAppRust").to_string_lossy().to_string())
        }
    }
}

fn create_windows_shortcuts(exe_path: &str, icon_path: &str) {
    let ps_script = format!(
        "$ws = New-Object -ComObject WScript.Shell; \
         $desk = [Environment]::GetFolderPath('Desktop'); \
         $s1 = $ws.CreateShortcut((Join-Path $desk 'WhatsApp.lnk')); \
         $s1.TargetPath = '{0}'; \
         $s1.IconLocation = '{1}'; \
         $s1.WorkingDirectory = (Split-Path '{0}'); \
         $s1.Save(); \
         $sm = Join-Path ([Environment]::GetFolderPath('Programs')) 'WhatsApp.lnk'; \
         $s2 = $ws.CreateShortcut($sm); \
         $s2.TargetPath = '{0}'; \
         $s2.IconLocation = '{1}'; \
         $s2.WorkingDirectory = (Split-Path '{0}'); \
         $s2.Save();",
        exe_path.replace('\'', "''"),
        icon_path.replace('\'', "''")
    );

    let _ = Command::new("powershell")
        .args(["-NoProfile", "-Command", &ps_script])
        .creation_flags(CREATE_NO_WINDOW)
        .status();
}

fn build_installer_html(default_dir: &str) -> String {
    let escaped_dir = default_dir.replace('\\', "\\\\");
    format!(
        r#"<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<style>
  * {{ box-sizing: border-box; user-select: none; margin: 0; padding: 0; }}
  body {{
    font-family: "Segoe UI", system-ui, sans-serif;
    background: #111B21;
    color: #E9EDEF;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 24px 28px;
    overflow: hidden;
  }}
  .header {{
    display: flex;
    align-items: center;
    gap: 14px;
    border-bottom: 1px solid #2A3942;
    padding-bottom: 16px;
  }}
  .logo {{
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: #00A884;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #111B21;
    font-weight: 800;
    font-size: 22px;
    flex-shrink: 0;
  }}
  .title h1 {{
    font-size: 18px;
    font-weight: 700;
    color: #E9EDEF;
  }}
  .title p {{
    font-size: 12px;
    color: #8696A0;
    margin-top: 2px;
  }}
  .section {{
    margin-top: 16px;
  }}
  .label {{
    font-size: 12px;
    font-weight: 600;
    color: #00A884;
    margin-bottom: 6px;
    display: block;
  }}
  .path-row {{
    display: flex;
    gap: 8px;
  }}
  input[type="text"] {{
    flex: 1;
    background: #202C33;
    border: 1px solid #2A3942;
    color: #E9EDEF;
    padding: 9px 12px;
    border-radius: 6px;
    font-size: 12.5px;
    font-family: Consolas, monospace;
    outline: none;
  }}
  input[type="text"]:focus {{
    border-color: #00A884;
  }}
  .btn-secondary {{
    background: #202C33;
    color: #E9EDEF;
    border: 1px solid #2A3942;
    padding: 0 14px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }}
  .btn-secondary:hover {{
    background: #2A3942;
  }}
  .presets {{
    display: flex;
    gap: 6px;
    margin-top: 8px;
  }}
  .preset-btn {{
    background: #182229;
    color: #8696A0;
    border: 1px solid #2A3942;
    padding: 4px 9px;
    border-radius: 4px;
    font-size: 11px;
    cursor: pointer;
  }}
  .preset-btn:hover {{
    color: #E9EDEF;
    border-color: #00A884;
  }}
  .options {{
    margin-top: 16px;
    background: #182229;
    border: 1px solid #2A3942;
    border-radius: 8px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 9px;
  }}
  .chk-row {{
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: 12.5px;
    color: #D1D7DB;
    cursor: pointer;
  }}
  .chk-row input {{
    accent-color: #00A884;
    width: 15px;
    height: 15px;
  }}
  .footer {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid #2A3942;
    padding-top: 14px;
  }}
  .status {{
    font-size: 12px;
    color: #8696A0;
  }}
  .btn-primary {{
    background: #00A884;
    color: #111B21;
    border: none;
    padding: 10px 22px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }}
  .btn-primary:hover {{
    background: #06cf9c;
  }}
</style>
</head>
<body>
  <div>
    <div class="header">
      <div class="logo">W</div>
      <div class="title">
        <h1>Instalasi WhatsApp Desktop (Rust .exe)</h1>
        <p>Ringan, cepat, mendukung Auto Zoom (Ctrl+Scroll) & penyimpanan kustom</p>
      </div>
    </div>

    <div class="section">
      <span class="label">Lokasi Penyimpanan Aplikasi & Data Sesi WhatsApp Web:</span>
      <div class="path-row">
        <input id="targetDir" type="text" value="{escaped_dir}" />
        <button class="btn-secondary" onclick="window.ipc.postMessage('browse')">Browse...</button>
      </div>
      <div class="presets">
        <button class="preset-btn" onclick="setDir('{escaped_dir}')">Default (AppData)</button>
        <button class="preset-btn" onclick="setDir('C:\\\\WhatsAppRust')">C:\WhatsAppRust</button>
        <button class="preset-btn" onclick="setDir('D:\\\\WhatsAppRust')">D:\WhatsAppRust</button>
      </div>
    </div>

    <div class="options">
      <label class="chk-row">
        <input id="chkShortcut" type="checkbox" checked />
        <span>Buat shortcut <b>WhatsApp</b> di Desktop & Start Menu (dengan ikon resmi)</span>
      </label>
      <label class="chk-row">
        <input id="chkLaunch" type="checkbox" checked />
        <span>Langsung jalankan <b>WhatsApp</b> setelah instalasi selesai</span>
      </label>
    </div>
  </div>

  <div class="footer">
    <span id="statusText" class="status">Siap menginstal ke folder pilihan Anda.</span>
    <div style="display:flex; gap:8px;">
      <button class="btn-secondary" style="padding:9px 14px;" onclick="window.ipc.postMessage('close')">Batal</button>
      <button id="installBtn" class="btn-primary" onclick="startInstall()">Install Sekarang</button>
    </div>
  </div>

  <script>
    function setDir(p) {{
      document.getElementById('targetDir').value = p;
    }}
    function startInstall() {{
      const dir = document.getElementById('targetDir').value.trim();
      const sc = document.getElementById('chkShortcut').checked ? '1' : '0';
      const ln = document.getElementById('chkLaunch').checked ? '1' : '0';
      document.getElementById('statusText').textContent = 'Menginstal WhatsApp & menyiapkan folder penyimpanan...';
      document.getElementById('statusText').style.color = '#00A884';
      document.getElementById('installBtn').disabled = true;
      window.ipc.postMessage('install|' + sc + '|' + ln + '|' + dir);
    }}
  </script>
</body>
</html>"#
    )
}

fn main() -> wry::Result<()> {
    let event_loop = EventLoopBuilder::<InstallerEvent>::with_user_event().build();
    let proxy = event_loop.create_proxy();

    let window = WindowBuilder::new()
        .with_title("WhatsApp Setup — Pilih Lokasi Penyimpanan")
        .with_window_icon(load_window_icon())
        .with_inner_size(LogicalSize::new(580.0, 390.0))
        .with_resizable(false)
        .with_decorations(true)
        .build(&event_loop)
        .expect("Failed to create installer window");

    let default_dir = get_default_install_dir();
    let html = build_installer_html(&default_dir);

    let webview = WebViewBuilder::new()
        .with_html(html)
        .with_ipc_handler(move |req| {
            let body = req.body();
            if body == "browse" {
                let _ = proxy.send_event(InstallerEvent::BrowseFolder);
            } else if body == "close" {
                let _ = proxy.send_event(InstallerEvent::CloseInstaller);
            } else if let Some(rest) = body.strip_prefix("install|") {
                let parts: Vec<&str> = rest.splitn(3, '|').collect();
                if parts.len() == 3 {
                    let create_shortcut = parts[0] == "1";
                    let launch_after = parts[1] == "1";
                    let target_dir = parts[2].trim().to_string();
                    let _ = proxy.send_event(InstallerEvent::RunInstall {
                        target_dir,
                        create_shortcut,
                        launch_after,
                    });
                }
            }
        })
        .build(&window)?;

    let current_dir_state = default_dir;

    event_loop.run(move |event, _, control_flow| {
        *control_flow = ControlFlow::Wait;

        match event {
            Event::NewEvents(StartCause::Init) => {}
            Event::UserEvent(InstallerEvent::BrowseFolder) => {
                if let Some(chosen) = pick_folder_dialog(&current_dir_state) {
                    let js = format!(
                        "document.getElementById('targetDir').value = '{}';",
                        chosen.replace('\\', "\\\\").replace('\'', "\\'")
                    );
                    let _ = webview.evaluate_script(&js);
                }
            }
            Event::UserEvent(InstallerEvent::RunInstall {
                target_dir,
                create_shortcut,
                launch_after,
            }) => {
                let install_path = PathBuf::from(&target_dir);
                let profile_path = install_path.join("webview2-profile");

                let _ = fs::create_dir_all(&install_path);
                let _ = fs::create_dir_all(&profile_path);

                let exe_file = install_path.join("whatsapp-rust.exe");
                let icon_file = install_path.join("icon.ico");
                let cfg_file = install_path.join("storage-location.txt");

                let _ = fs::write(&exe_file, APP_EXE_BYTES);
                let _ = fs::write(&icon_file, ICON_ICO_BYTES);
                let _ = fs::write(
                    &cfg_file,
                    profile_path.to_string_lossy().as_bytes(),
                );

                if create_shortcut {
                    create_windows_shortcuts(
                        &exe_file.to_string_lossy(),
                        &icon_file.to_string_lossy(),
                    );
                }

                if launch_after {
                    let _ = Command::new(&exe_file)
                        .current_dir(&install_path)
                        .spawn();
                }

                *control_flow = ControlFlow::Exit;
            }
            Event::UserEvent(InstallerEvent::CloseInstaller)
            | Event::WindowEvent {
                event: WindowEvent::CloseRequested,
                ..
            } => {
                *control_flow = ControlFlow::Exit;
            }
            _ => {}
        }
    });
}
