# WhatsApp Native Rust — Lightweight Desktop Client (`.exe`) & Interactive Studio

Build a lightweight native WhatsApp desktop application powered by Rust to replace heavy Electron/Chromium wrappers, paired with a live interactive web runtime and `.exe` build configurator so the development server runs seamlessly in the preview environment.

## User Review & Critical Decisions

> [!IMPORTANT]
> Because the live preview environment runs a web server on port 3000 while Windows `.exe` binaries execute natively on Windows OS, this plan delivers **both** the complete native Rust desktop codebase (ready to compile into a standalone `<15 MB` Windows `.exe` via Cargo or GitHub Actions) **and** a live interactive WhatsApp Native Rust client + `.exe` bundler running on the dev server.

- **Confirmed Decision 1 (Rust Native `.exe` Architecture)**: Uses a dual-mode Rust native architecture (`eframe`/`egui` native GPU-accelerated GUI + optional `wry` WebView2 lightweight shell) with `tokio` async networking and Windows subsystem flags (`#![windows_subsystem = "windows"]`) so no console window flashes when launching the `.exe`.
- **Confirmed Decision 2 (Dev Server Fix & Live Interactive Client)**: Fixes the missing dev server by running an Express + WebSocket real-time server on port 3000 that hosts the live WhatsApp Native Client simulation, real-time messaging, QR multi-device linking, and a one-click Rust `.exe` project & CI/CD bundle exporter.
- **Confirmed Decision 3 (Memory & Performance Optimization)**: Targets `< 35 MB` idle RAM usage with lazy chat history pagination, zero-copy binary frame parsing, and native Windows system tray integration.

---

## 1. Overview & Core Concept

- **What It Does**: Provides a complete, ultra-lightweight WhatsApp desktop client written in Rust alongside an interactive live workspace where users can test real-time messaging, link multi-device sessions via QR code, customize `.exe` compile flags, inspect the Rust source modules, and export the buildable Windows `.exe` repository package.
- **Target Audience / Persona**: Users and developers seeking a fast, low-memory native Windows `.exe` WhatsApp client without the 600+ MB RAM overhead of traditional desktop wrappers.
- **Key Value**: Combines instant live preview and real-time chat testing in the browser with production-ready Rust source code and automated Windows `.exe` compilation workflows.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Native WhatsApp Messaging Workspace**: Users open the live client, filter conversations (All, Unread, Groups), exchange real-time messages over WebSockets, send attachments or quick replies, and toggle native desktop behaviors (Always on Top, Minimize to Tray, Compact Mode).
  2. **Multi-Device QR Pairing & Session Manager**: Users generate a multi-device pairing QR code or 8-character linking code, inspect active linked device sessions, and verify Noise/Signal encryption keys.
  3. **Rust `.exe` Builder & Source Studio**: Users customize Windows `.exe` binary settings (App Icon, Frameless Window, System Tray Support, Startup Launch, Target Architecture `x86_64-pc-windows-msvc`), inspect the generated Rust modules, and download the complete Rust project archive or trigger a GitHub Actions `.exe` release build.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Crisp, utilitarian native desktop dark mode inspired by high-performance systems tools and WhatsApp Desktop dark surfaces.
  - *Color Palette & Mood*:
    - Dominant Canvas (60%): Deep Obsidian Slate (`#0B141A`) and Conversation Panel (`#111B21`).
    - Structural Surfaces (30%): Elevated Surface (`#202C33`), Hairline Borders (`#2A3942`), Primary Text (`#E9EDEF`), Muted Metadata (`#8696A0`).
    - Accent Budget (10%): WhatsApp Native Emerald (`#00A884`) for primary actions, unread indicators, and outgoing message states, paired with Rust Amber (`#F97316`) strictly in the Rust `.exe` compiler studio tab.
  - *Typography & Hierarchy*: `Plus Jakarta Sans` for crisp UI headings and navigation, `DM Sans` for comfortable chat body legibility, and `JetBrains Mono` (`tabular-nums`) for memory footprint metrics, timestamps, encryption fingerprints, and Rust code inspection.
  - *Component Styling & Layout*: Full-viewport desktop layout (1440px baseline) featuring a native Windows titlebar preview (with working minimize/maximize/tray toggles), a 280px conversation sidebar, a primary chat & protocol viewport, and a slide-over Rust `.exe` build studio.
- **Interactive Feedback & Motion**: Fast `<150ms` transitions, optimistic real-time WebSocket message delivery with read-receipt state progression (Sent → Delivered → Read), and instant configuration updates in the Rust `.exe` manifest generator.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Native Rust GUI (`eframe`/`egui` + `wry`) vs. Electron**
  - *Chosen Approach*: Pure Rust codebase utilizing `eframe`/`egui` for native immediate-mode GPU rendering alongside an optional `wry` OS-native WebView2 mode.
  - *Why*: Reduces binary size to `< 10 MB` and idle RAM consumption to `< 35 MB`, eliminating bundled Chromium overhead.
  - *Alternatives Considered*: Electron or Tauri v1 with heavy frontend bundles — passed over to keep the `.exe` binary self-contained and fast to cold-start.
- **Decision 2: Real-Time Server-Authoritative WebSocket State on Port 3000**
  - *Chosen Approach*: Full-stack Node/Express + WebSocket (`ws`) server on port 3000 that serves both the interactive native client UI and real-time multi-user chat state, while directly reading and serving the actual Rust codebase files from disk.
  - *Why*: Fixes the dev server startup failure immediately while ensuring the Rust source code in the repository and the interactive `.exe` studio stay 100% synchronized.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   Native Windows Desktop Window Shell                   │
│  [Titlebar: WhatsApp Native Rust (.exe)]  [Mode: Messenger | .exe Build]│
└───────────────────┬─────────────────────────────────────┬───────────────┘
                    │                                     │
                    ▼                                     ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────┐
│     Live Messenger Workspace View     │ │   Rust .exe Builder Studio    │
│ ┌───────────────┐ ┌─────────────────┐ │ │ ┌───────────────────────────┐ │
│ │ Conversation  │ │ Active Thread   │ │ │ │ Binary Flags Configurator │ │
│ │ List & Search │ │ & Media Composer│ │ │ │ (Tray, Startup, Target)   │ │
│ └───────┬───────┘ └────────┬────────┘ │ │ └─────────────┬─────────────┘ │
│         │                  │          │ │               │               │
│ ┌───────┴──────────────────┴────────┐ │ │ ┌─────────────┴─────────────┐ │
│ │ Multi-Device QR & Session Modal   │ │ │ │ Rust Source & CI/CD Viewer│ │
│ └─────────────────┬─────────────────┘ │ │ └─────────────┬─────────────┘ │
└───────────────────┼───────────────────┘ └───────────────┼───────────────┘
                    │ WebSockets (ws://)                  │ REST (/api/*)
                    ▼                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│               Port 3000 Express + WebSocket Server                      │
│  • Authoritative Chat Rooms, Contacts, Presence & Read Receipts         │
│  • Serves Real Rust Source Code & Generates Downloadable .exe Bundle    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│             Native Rust Desktop Repository Codebase (Rust)              │
│  • Cargo Crate & Windows Resource Manifest (winres / subsystem=windows) │
│  • Async Tokio WhatsApp Multi-Device Client & Noise Frame Handler       │
│  • Native eframe/egui Desktop UI + System Tray & Notification Engine    │
│  • GitHub Actions Automated Windows .exe Release Pipeline               │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - **Conversations & Messages**: Stored authoritatively on the server (`id`, `contactName`, `phone`, `unreadCount`, `onlineStatus`, `encryptionFingerprint`, `messages[]` with `id`, `sender`, `text`, `timestamp`, `status`, `byteSize`).
  - **Rust Build Configuration**: Stateful configuration object (`appName`, `targetTriple`, `optLevel`, `lto`, `stripSymbols`, `systemTray`, `autoStart`, `ramLimitMb`, `windowDecorations`) that dynamically updates the Rust `Cargo.toml` and `main.rs` code preview and downloadable archive.
- **Interactive Component & State Mapping**:
  - *Conversation Sidebar*: Search input filters contacts in real time; segmented filter buttons (`All`, `Unread`, `Groups`) filter threads; clicking a thread marks messages as read via WebSocket event.
  - *Message Composer*: Supports text input, quick template insertion, simulated encrypted voice/file packet attachment, and Enter-to-send over WebSocket (`message:create`).
  - *Multi-Device Pairing Modal*: Generates a live scannable QR code and 8-digit pairing token, allowing one-click simulated device linking or session revocation.
  - *Rust `.exe` Studio*: Toggling optimization flags (`opt-level = "z"`, `lto = true`, `strip = true`, `windows_subsystem = "windows"`) recalculates estimated `.exe` binary size and idle RAM footprint in real time, updates the Rust source code viewer, and exports a complete buildable archive.
