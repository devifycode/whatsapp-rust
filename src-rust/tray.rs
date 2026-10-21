// src-rust/tray.rs
// Windows Native System Tray & Toast Notification Dispatcher

use notify_rust::Notification;

#[allow(dead_code)]
pub struct SystemTrayController {
    pub app_name: String,
    pub muted: bool,
}

#[allow(dead_code)]
impl SystemTrayController {
    pub fn initialize(app_name: &str) -> Self {
        Self {
            app_name: app_name.to_string(),
            muted: false,
        }
    }

    pub fn send_native_toast(&self, sender: &str, preview: &str) {
        if self.muted {
            return;
        }
        let _ = Notification::new()
            .summary(&format!("{} — {}", self.app_name, sender))
            .body(preview)
            .appname(&self.app_name)
            .show();
    }
}
