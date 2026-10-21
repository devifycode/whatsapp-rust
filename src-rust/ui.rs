// src-rust/ui.rs
// Authentic WhatsApp Desktop Native UI/UX in Rust (egui/eframe)
// Mirrors WhatsApp Desktop Dark Mode: Left Navigation Rail (#202C33),
// Chat List (#111B21), Filter Chips, Chat Viewport (#0B141A), Outgoing (#005C4B)
// & Incoming (#202C33) bubbles with double-check read receipts (#53BDEB).

use eframe::egui::{self, Color32, RichText, Rounding, Stroke, Vec2};
use std::sync::Arc;
use tokio::sync::Mutex;

use crate::protocol::WhatsAppNoiseClient;
use crate::tray::SystemTrayController;
use crate::NativeConfig;

pub struct WhatsAppNativeApp {
    config: NativeConfig,
    protocol: Arc<Mutex<WhatsAppNoiseClient>>,
    _tray: SystemTrayController,
    selected_thread_id: String,
    composer_input: String,
    search_query: String,
    active_filter: String,
    show_contact_info: bool,
}

impl WhatsAppNativeApp {
    pub fn new(
        _cc: &eframe::CreationContext<'_>,
        config: NativeConfig,
        protocol: Arc<Mutex<WhatsAppNoiseClient>>,
        tray: SystemTrayController,
    ) -> Self {
        Self {
            config,
            protocol,
            _tray: tray,
            selected_thread_id: String::from("rust-core-team"),
            composer_input: String::new(),
            search_query: String::new(),
            active_filter: String::from("all"),
            show_contact_info: false,
        }
    }
}

impl eframe::App for WhatsAppNativeApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        let mut style = (*ctx.style()).clone();
        style.visuals = egui::Visuals::dark();
        style.visuals.panel_fill = Color32::from_rgb(17, 27, 33); // #111B21
        style.visuals.window_fill = Color32::from_rgb(11, 20, 26); // #0B141A
        ctx.set_style(style);

        let Ok(mut client) = self.protocol.try_lock() else {
            return;
        };

        // 1. Leftmost Vertical Navigation Rail (#202C33)
        egui::SidePanel::left("wa_nav_rail")
            .exact_width(58.0)
            .frame(egui::Frame::none().fill(Color32::from_rgb(32, 44, 51)))
            .show(ctx, |ui| {
                ui.vertical_centered(|ui| {
                    ui.add_space(14.0);
                    let _ = ui.button(RichText::new("💬").size(18.0));
                    ui.add_space(10.0);
                    let _ = ui.button(RichText::new("📞").size(18.0));
                    ui.add_space(10.0);
                    let _ = ui.button(RichText::new("⭕").size(18.0));
                    ui.add_space(10.0);
                    let _ = ui.button(RichText::new("👥").size(18.0));
                });
            });

        // 2. Chat List Column (#111B21)
        egui::SidePanel::left("wa_chat_list")
            .exact_width(340.0)
            .frame(egui::Frame::none().fill(Color32::from_rgb(17, 27, 33)))
            .show(ctx, |ui| {
                ui.add_space(12.0);
                ui.horizontal(|ui| {
                    ui.add_space(14.0);
                    ui.label(
                        RichText::new("Chat")
                            .strong()
                            .size(21.0)
                            .color(Color32::from_rgb(233, 237, 239)),
                    );
                });
                ui.add_space(8.0);
                ui.horizontal(|ui| {
                    ui.add_space(12.0);
                    ui.add(
                        egui::TextEdit::singleline(&mut self.search_query)
                            .hint_text("Cari atau mulai chat baru")
                            .desired_width(310.0),
                    );
                });
                ui.add_space(8.0);
                ui.separator();

                egui::ScrollArea::vertical().show(ui, |ui| {
                    for thread in &client.threads {
                        if !self.search_query.is_empty()
                            && !thread
                                .name
                                .to_lowercase()
                                .contains(&self.search_query.to_lowercase())
                        {
                            continue;
                        }
                        let is_selected = self.selected_thread_id == thread.id;
                        let bg = if is_selected {
                            Color32::from_rgb(42, 57, 66) // #2A3942
                        } else {
                            Color32::TRANSPARENT
                        };

                        egui::Frame::none()
                            .fill(bg)
                            .inner_margin(egui::Margin::symmetric(14.0, 12.0))
                            .show(ui, |ui| {
                                if ui
                                    .add(
                                        egui::Label::new(
                                            RichText::new(&thread.name)
                                                .strong()
                                                .size(15.0)
                                                .color(Color32::from_rgb(233, 237, 239)),
                                        )
                                        .sense(egui::Sense::click()),
                                    )
                                    .clicked()
                                {
                                    self.selected_thread_id = thread.id.clone();
                                }
                            });
                    }
                });
            });

        // 3. Main WhatsApp Chat Viewport (#0B141A)
        egui::CentralPanel::default()
            .frame(egui::Frame::none().fill(Color32::from_rgb(11, 20, 26)))
            .show(ctx, |ui| {
                let active_id = self.selected_thread_id.clone();
                if let Some(thread) = client.threads.iter().find(|t| t.id == active_id) {
                    // Chat Header (#202C33)
                    egui::Frame::none()
                        .fill(Color32::from_rgb(32, 44, 51))
                        .inner_margin(egui::Margin::symmetric(16.0, 12.0))
                        .show(ui, |ui| {
                            ui.horizontal(|ui| {
                                ui.label(
                                    RichText::new(&thread.name)
                                        .strong()
                                        .size(16.0)
                                        .color(Color32::from_rgb(233, 237, 239)),
                                );
                                ui.label(
                                    RichText::new(if thread.online {
                                        "online"
                                    } else {
                                        "terakhir dilihat baru saja"
                                    })
                                    .size(12.0)
                                    .color(Color32::from_rgb(134, 150, 160)),
                                );
                                ui.with_layout(
                                    egui::Layout::right_to_left(egui::Align::Center),
                                    |ui| {
                                        if ui.button("Info Kontak").clicked() {
                                            self.show_contact_info = !self.show_contact_info;
                                        }
                                        ui.label(
                                            RichText::new(format!(
                                                "{:.1} MB / {} MB RAM",
                                                client.working_set_kb as f32 / 1024.0,
                                                self.config.ram_limit_mb
                                            ))
                                            .monospace()
                                            .size(11.0)
                                            .color(Color32::from_rgb(0, 168, 132)),
                                        );
                                    },
                                );
                            });
                        });

                    // Messages Area
                    egui::ScrollArea::vertical()
                        .auto_shrink([false, false])
                        .max_height(ui.available_height() - 62.0)
                        .show(ui, |ui| {
                            ui.add_space(12.0);
                            for msg in &thread.messages {
                                let bubble_color = if msg.from_me {
                                    Color32::from_rgb(0, 92, 75) // #005C4B Outgoing
                                } else {
                                    Color32::from_rgb(32, 44, 51) // #202C33 Incoming
                                };
                                egui::Frame::none()
                                    .fill(bubble_color)
                                    .rounding(Rounding::same(8.0))
                                    .inner_margin(egui::Margin::symmetric(12.0, 8.0))
                                    .stroke(Stroke::new(0.5, Color32::from_rgb(42, 57, 66)))
                                    .show(ui, |ui| {
                                        ui.label(
                                            RichText::new(&msg.text)
                                                .size(14.2)
                                                .color(Color32::from_rgb(233, 237, 239)),
                                        );
                                        ui.horizontal(|ui| {
                                            ui.label(
                                                RichText::new(&msg.timestamp)
                                                    .size(11.0)
                                                    .color(Color32::from_rgb(134, 150, 160)),
                                            );
                                            if msg.from_me {
                                                ui.label(
                                                    RichText::new("✓✓")
                                                        .size(11.0)
                                                        .color(Color32::from_rgb(83, 189, 235)),
                                                );
                                            }
                                        });
                                    });
                                ui.add_space(6.0);
                            }
                        });
                }

                // Bottom Composer Bar (#202C33)
                ui.with_layout(egui::Layout::bottom_up(egui::Align::Min), |ui| {
                    egui::Frame::none()
                        .fill(Color32::from_rgb(32, 44, 51))
                        .inner_margin(egui::Margin::symmetric(16.0, 10.0))
                        .show(ui, |ui| {
                            ui.horizontal(|ui| {
                                let response = ui.add(
                                    egui::TextEdit::singleline(&mut self.composer_input)
                                        .hint_text("Ketik pesan")
                                        .desired_width(ui.available_width() - 84.0),
                                );
                                let send_clicked = ui
                                    .add_sized(
                                        Vec2::new(72.0, 36.0),
                                        egui::Button::new(
                                            RichText::new("Kirim").color(Color32::WHITE).strong(),
                                        )
                                        .fill(Color32::from_rgb(0, 168, 132)),
                                    )
                                    .clicked();

                                if (send_clicked
                                    || (response.lost_focus()
                                        && ui.input(|i| i.key_pressed(egui::Key::Enter))))
                                    && !self.composer_input.trim().is_empty()
                                {
                                    let msg = self.composer_input.clone();
                                    client.send_encrypted_message(&active_id, &msg);
                                    self.composer_input.clear();
                                }
                            });
                        });
                });
            });
    }
}
