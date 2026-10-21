import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ChatMessage {
  id: string;
  sender: string;
  senderPhone: string;
  fromMe: boolean;
  text: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  byteSize: number;
  frameHex: string;
  attachmentType?: 'document' | 'voice' | 'binary';
  attachmentName?: string;
}

interface ConversationThread {
  id: string;
  name: string;
  phone: string;
  roleOrGroup: string;
  isGroup: boolean;
  online: boolean;
  unreadCount: number;
  avatarInitials: string;
  avatarAccent: string;
  signalFingerprint: string;
  lastActivity: string;
  messages: ChatMessage[];
}

interface LinkedDeviceSession {
  id: string;
  deviceName: string;
  platform: string;
  arch: string;
  linkedAt: string;
  ipAddress: string;
  ramUsageMb: number;
  active: boolean;
}

interface RustExeConfig {
  appName: string;
  binaryName: string;
  targetTriple: 'x86_64-pc-windows-msvc' | 'x86_64-pc-windows-gnu' | 'aarch64-pc-windows-msvc';
  guiBackend: 'eframe-glow' | 'wry-webview2';
  optLevel: 'z' | 's' | '3';
  lto: boolean;
  stripSymbols: boolean;
  hideConsoleWindow: boolean;
  systemTray: boolean;
  autoStartWindows: boolean;
  alwaysOnTop: boolean;
  ramLimitMb: number;
  workerThreads: number;
}

const PORT = Number(process.env.PORT) || 3000;

function generateHexFrame(text: string, counter: number): string {
  const prefix = `57410603`; // WA.. Noise_XX protocol header
  const seq = counter.toString(16).padStart(4, '0').toUpperCase();
  const hexPayload = Buffer.from(text.slice(0, 18), 'utf8').toString('hex').toUpperCase();
  return `${prefix} ${seq} 9F02 ${hexPayload}`;
}

function generateQrPairingRef(): string {
  const randomHex = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return `2@${randomHex},WA-RUST-NATIVE,WIN64-EXE,${Date.now()}`;
}

function generateEightCharPairingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${part1}-${part2}`;
}

// Server-authoritative state
let frameCounter = 184;
let qrPairingRef = generateQrPairingRef();
let pairingShortCode = generateEightCharPairingCode();

const RECOMMENDED_TARGET_TRIPLE: RustExeConfig['targetTriple'] =
  (process.env.RUST_TARGET_TRIPLE as RustExeConfig['targetTriple']) ||
  'x86_64-pc-windows-msvc';
const RECOMMENDED_RAM_LIMIT_MB = Number(process.env.RUST_RAM_LIMIT_MB) || 32;

let rustConfig: RustExeConfig = {
  appName: 'WhatsApp Native Rust',
  binaryName: 'whatsapp-rust.exe',
  targetTriple: RECOMMENDED_TARGET_TRIPLE,
  guiBackend: 'eframe-glow',
  optLevel: 'z',
  lto: true,
  stripSymbols: true,
  hideConsoleWindow: true,
  systemTray: true,
  autoStartWindows: false,
  alwaysOnTop: false,
  ramLimitMb: RECOMMENDED_RAM_LIMIT_MB,
  workerThreads: 2,
};

let linkedSessions: LinkedDeviceSession[] = [
  {
    id: 'sess-win11-native',
    deviceName: 'Windows 11 Desktop (whatsapp-rust.exe)',
    platform: 'Windows 11 Pro 24H2 (Native glow/eframe)',
    arch: 'x86_64-pc-windows-msvc',
    linkedAt: 'Aktif sekarang',
    ipAddress: '192.168.1.42',
    ramUsageMb: 24.2,
    active: true,
  },
  {
    id: 'sess-win10-workstation',
    deviceName: 'ThinkPad Dev Workstation (.exe Portable)',
    platform: 'Windows 10 LTSC (WebView2 Hybrid)',
    arch: 'x86_64-pc-windows-msvc',
    linkedAt: 'Terhubung 2 jam lalu',
    ipAddress: '10.24.0.18',
    ramUsageMb: 31.8,
    active: true,
  },
];

let conversations: ConversationThread[] = [
  {
    id: 'rust-core-team',
    name: 'Rust Native Core Team',
    phone: '+62 812-9040-1120',
    roleOrGroup: 'Grup Engineering · 6 Anggota',
    isGroup: true,
    online: true,
    unreadCount: 0,
    avatarInitials: 'RC',
    avatarAccent: '#00A884',
    signalFingerprint: '84910 22941 77402 11904 55821',
    lastActivity: '21:38',
    messages: [
      {
        id: '3EB0A101',
        sender: 'Arrazy',
        senderPhone: '+62 812-9040-1120',
        fromMe: false,
        text: 'Release binary whatsapp-rust.exe sudah siap! Pakai eframe/egui + Tokio, pemakaian RAM waktu idle cuma 24.2 MB dibanding WhatsApp Desktop standar yang tembus 650 MB.',
        timestamp: '21:34',
        status: 'read',
        byteSize: 218,
        frameHex: generateHexFrame('Release binary whatsapp-rust.exe', 180),
      },
      {
        id: '3EB0A102',
        sender: 'Raka (Systems)',
        senderPhone: '+62 811-8200-3319',
        fromMe: false,
        text: 'Flag #![windows_subsystem = "windows"] dan winres manifest sudah masuk di build.rs, jadi waktu klik dua kali file .exe tidak ada jendela CMD hitam yang muncul.',
        timestamp: '21:36',
        status: 'read',
        byteSize: 204,
        frameHex: generateHexFrame('Flag windows_subsystem', 181),
      },
      {
        id: '3EB0A103',
        sender: 'Anda',
        senderPhone: '+62 813-7788-9900',
        fromMe: true,
        text: 'Mantap! Dev server port 3000 juga sudah jalan untuk live testing & kustomisasi flag kompilasi .exe sebelum di-download.',
        timestamp: '21:38',
        status: 'read',
        byteSize: 168,
        frameHex: generateHexFrame('Mantap! Dev server port 3000', 182),
      },
    ],
  },
  {
    id: 'nadia-devops',
    name: 'Nadia Putri (Release CI)',
    phone: '+62 815-4402-8812',
    roleOrGroup: 'Windows Build & Packaging',
    isGroup: false,
    online: true,
    unreadCount: 2,
    avatarInitials: 'NP',
    avatarAccent: '#0284C7',
    signalFingerprint: '66301 90812 44120 88732 10294',
    lastActivity: '21:37',
    messages: [
      {
        id: '3EB0B201',
        sender: 'Nadia Putri',
        senderPhone: '+62 815-4402-8812',
        fromMe: false,
        text: 'Workflow GitHub Actions (.github/workflows/release-exe.yml) sudah dikonfigurasi untuk target x86_64-pc-windows-msvc.',
        timestamp: '21:35',
        status: 'read',
        byteSize: 156,
        frameHex: generateHexFrame('Workflow GitHub Actions', 183),
      },
      {
        id: '3EB0B202',
        sender: 'Nadia Putri',
        senderPhone: '+62 815-4402-8812',
        fromMe: false,
        text: 'Kamu juga bisa langsung unduh bundel installer script .ps1 / .bat dari tab Rust .exe Studio untuk build lokal dalam 1 klik.',
        timestamp: '21:37',
        status: 'delivered',
        byteSize: 162,
        frameHex: generateHexFrame('Kamu juga bisa langsung unduh', 184),
        attachmentType: 'binary',
        attachmentName: 'whatsapp-rust-win64-release-config.toml',
      },
    ],
  },
  {
    id: 'dimas-security',
    name: 'Dimas Pratama (Cryptography)',
    phone: '+62 818-2219-4001',
    roleOrGroup: 'Noise_XX & Signal Protocol',
    isGroup: false,
    online: false,
    unreadCount: 0,
    avatarInitials: 'DP',
    avatarAccent: '#7C3AED',
    signalFingerprint: '19283 49102 88371 22910 44812',
    lastActivity: 'Kemarin',
    messages: [
      {
        id: '3EB0C301',
        sender: 'Dimas Pratama',
        senderPhone: '+62 818-2219-4001',
        fromMe: false,
        text: 'Handshake x25519-dalek + aes-gcm di src-rust/protocol.rs sudah zero-copy. Konsumsi CPU saat dekripsi ribuan pesan hampir 0%.',
        timestamp: 'Kemarin',
        status: 'read',
        byteSize: 172,
        frameHex: generateHexFrame('Handshake x25519-dalek', 175),
      },
    ],
  },
  {
    id: 'budi-qa',
    name: 'Budi Santoso (QA Windows)',
    phone: '+62 852-1190-7732',
    roleOrGroup: 'Pengujian Windows 10 & 11',
    isGroup: false,
    online: true,
    unreadCount: 0,
    avatarInitials: 'BS',
    avatarAccent: '#D97706',
    signalFingerprint: '55192 83710 99281 77461 30192',
    lastActivity: '20:15',
    messages: [
      {
        id: '3EB0D401',
        sender: 'Budi Santoso',
        senderPhone: '+62 852-1190-7732',
        fromMe: false,
        text: 'Sudah dites di laptop lama RAM 4 GB (Windows 10 64-bit). Cold start whatsapp-rust.exe cuma 0.18 detik!',
        timestamp: '20:15',
        status: 'read',
        byteSize: 148,
        frameHex: generateHexFrame('Sudah dites di laptop lama', 171),
      },
    ],
  },
];

const RUST_REPO_FILES = [
  { path: 'Cargo.toml', label: 'Cargo.toml', description: 'Manifes crate Rust (tao + wry WebView2 wrapper untuk https://web.whatsapp.com)' },
  { path: 'build.rs', label: 'build.rs', description: 'Kompilator resource Windows (winres) & DPI manifest' },
  { path: 'src-rust/main.rs', label: 'src-rust/main.rs', description: 'Entry point .exe yang membungkus https://web.whatsapp.com di WebView2' },
  { path: 'src-rust/inject.js', label: 'src-rust/inject.js', description: 'Script injeksi agar WhatsApp Web full-window 100% tanpa margin' },
  { path: '.github/workflows/release-exe.yml', label: '.github/workflows/release-exe.yml', description: 'GitHub Actions: Otomatis build & publish whatsapp-rust.exe ke GitHub Releases' },
  { path: 'build-exe.bat', label: 'build-exe.bat', description: 'Script 1-klik kompilasi .exe di Windows' },
];

function syncCargoTomlToDisk(cfg: RustExeConfig) {
  const cargoContent = `[package]
name = "${cfg.binaryName.replace(/\\.exe$/i, '')}"
version = "1.0.0"
edition = "2021"
authors = ["WhatsApp Rust Contributors"]
description = "Ultra-lightweight Rust Native Wrapper (.exe) for WhatsApp Web (https://web.whatsapp.com) using OS WebView2"
license = "MIT"
build = "build.rs"

[[bin]]
name = "${cfg.binaryName.replace(/\\.exe$/i, '')}"
path = "src-rust/main.rs"

[dependencies]
tao = "0.30"
wry = "0.47"

[target.'cfg(windows)'.build-dependencies]
winres = "0.1"

[profile.release]
opt-level = "${cfg.optLevel}"
lto = ${cfg.lto}
codegen-units = 1
panic = "abort"
strip = ${cfg.stripSymbols}
`;
  try {
    fs.writeFileSync(path.join(__dirname, 'Cargo.toml'), cargoContent, 'utf8');
  } catch (err) {
    console.error('Failed to update Cargo.toml:', err);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer });

  function broadcast(event: string, payload: unknown) {
    const message = JSON.stringify({ event, payload });
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  // REST API: Get Rust Source Files from Disk
  app.get('/api/rust-files', (_req, res) => {
    const files = RUST_REPO_FILES.map((item) => {
      const fullPath = path.join(__dirname, item.path);
      let content = '';
      try {
        content = fs.readFileSync(fullPath, 'utf8');
      } catch {
        content = `// File ${item.path} tidak ditemukan`;
      }
      return {
        ...item,
        content,
        sizeBytes: Buffer.byteLength(content, 'utf8'),
      };
    });
    res.json({ files, config: rustConfig });
  });

  // REST API: Update Rust .exe Compiler Configuration & Sync Cargo.toml
  app.post('/api/rust-config', (req, res) => {
    const incoming = req.body as Partial<RustExeConfig>;
    rustConfig = {
      ...rustConfig,
      ...incoming,
    };
    syncCargoTomlToDisk(rustConfig);
    broadcast('config:updated', rustConfig);
    res.json({ ok: true, config: rustConfig });
  });

  // REST API: Download Self-Contained Windows PowerShell Builder Bundle (.ps1)
  app.get('/api/download-exe-bundle', (_req, res) => {
    const filesPayload: Record<string, string> = {};
    for (const item of RUST_REPO_FILES) {
      try {
        filesPayload[item.path] = fs.readFileSync(path.join(__dirname, item.path), 'utf8');
      } catch {
        filesPayload[item.path] = '';
      }
    }

    const base64Json = Buffer.from(JSON.stringify(filesPayload), 'utf8').toString('base64');
    const psScript = `# ============================================================================
# WhatsApp Native Rust (.exe) — Self-Extracting Windows Builder Script
# Target: ${rustConfig.targetTriple} | Binary: ${rustConfig.binaryName}
# Memory Limit: ${rustConfig.ramLimitMb} MB | Backend: ${rustConfig.guiBackend}
# ============================================================================
$ErrorActionPreference = "Stop"
Write-Host "=== WhatsApp Native Rust (.exe) Extractor & Builder ===" -ForegroundColor Green

$BundleBase64 = "${base64Json}"
$JsonBytes = [System.Convert]::FromBase64String($BundleBase64)
$JsonString = [System.Text.Encoding]::UTF8.GetString($JsonBytes)
$Files = $JsonString | ConvertFrom-Json

foreach ($Prop in $Files.PSObject.Properties) {
    $RelPath = $Prop.Name
    $FullPath = Join-Path (Get-Location) $RelPath
    $Dir = Split-Path $FullPath -Parent
    if (!(Test-Path $Dir)) {
        New-Item -ItemType Directory -Force -Path $Dir | Out-Null
    }
    [System.IO.File]::WriteAllText($FullPath, $Prop.Value, [System.Text.Encoding]::UTF8)
    Write-Host "  [+] Extracted: $RelPath" -ForegroundColor Cyan
}

Write-Host ""
if (Get-Command "cargo" -ErrorAction SilentlyContinue) {
    Write-Host "Mengompilasi ${rustConfig.binaryName} (Release Mode, LTO=${rustConfig.lto}, opt-level=${rustConfig.optLevel})..." -ForegroundColor Yellow
    cargo build --release --target ${rustConfig.targetTriple}
    Write-Host ""
    Write-Host "SUKSES! Aplikasi native .exe Anda siap di:" -ForegroundColor Green
    Write-Host "  target\\${rustConfig.targetTriple}\\release\\${rustConfig.binaryName}" -ForegroundColor White
} else {
    Write-Host "Seluruh kode sumber Rust berhasil diekstrak!" -ForegroundColor Green
    Write-Host "Instal Rust dari https://rustup.rs lalu jalankan .\\build-exe.bat untuk membuat file .exe." -ForegroundColor Yellow
}
`;

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="build-${rustConfig.binaryName.replace(/\\.exe$/i, '')}-win64.ps1"`
    );
    res.send(psScript);
  });

  // WebSocket Real-Time Multi-Device & Chat Engine
  wss.on('connection', (ws) => {
    // Send initial authoritative state
    ws.send(
      JSON.stringify({
        event: 'init',
        payload: {
          conversations,
          linkedSessions,
          rustConfig,
          qrPairingRef,
          pairingShortCode,
          frameCounter,
        },
      })
    );

    ws.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        const { type, payload } = data;

        if (type === 'message:create') {
          const { threadId, text, attachmentType, attachmentName } = payload;
          const thread = conversations.find((t) => t.id === threadId);
          if (!thread || (!text?.trim() && !attachmentName)) return;

          // Guard against duplicate message IDs
          const msgId = payload.id || `3EB0${Date.now().toString(16).toUpperCase()}`;
          if (thread.messages.some((m) => m.id === msgId)) return;

          frameCounter += 1;
          const cleanText = (text || '').trim();
          const newMessage: ChatMessage = {
            id: msgId,
            sender: 'Anda',
            senderPhone: '+62 813-7788-9900',
            fromMe: true,
            text: cleanText || `Mengirim lampiran terenkripsi: ${attachmentName}`,
            timestamp: new Date().toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            status: 'sent',
            byteSize: Buffer.byteLength(cleanText, 'utf8') + 48,
            frameHex: generateHexFrame(cleanText || attachmentName || 'ATTACHMENT', frameCounter),
            attachmentType,
            attachmentName,
          };

          thread.messages.push(newMessage);
          thread.lastActivity = newMessage.timestamp;
          broadcast('message:created', { threadId, message: newMessage, frameCounter });

          // Update delivery status to 'read'
          setTimeout(() => {
            newMessage.status = 'read';
            broadcast('message:status', {
              threadId,
              messageId: newMessage.id,
              status: 'read',
            });
          }, 350);
        } else if (type === 'conversation:read') {
          const { threadId } = payload;
          const thread = conversations.find((t) => t.id === threadId);
          if (thread && thread.unreadCount > 0) {
            thread.unreadCount = 0;
            thread.messages.forEach((m) => {
              if (!m.fromMe) m.status = 'read';
            });
            broadcast('conversation:updated', { threadId, unreadCount: 0 });
          }
        } else if (type === 'thread:create') {
          const { name, phone, initialMessage } = payload;
          if (!name?.trim() || !phone?.trim()) return;
          const newId = `chat-${Date.now()}`;
          const initials = name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((w: string) => w[0]?.toUpperCase() || 'W')
            .join('');
          frameCounter += 1;
          const nowTime = new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          });
          const newThread: ConversationThread = {
            id: newId,
            name: name.trim(),
            phone: phone.trim(),
            roleOrGroup: 'Kontak Direct E2EE',
            isGroup: false,
            online: true,
            unreadCount: 0,
            avatarInitials: initials || 'WA',
            avatarAccent: '#00A884',
            signalFingerprint: Array.from({ length: 5 }, () =>
              Math.floor(10000 + Math.random() * 89999)
            ).join(' '),
            lastActivity: nowTime,
            messages: initialMessage?.trim()
              ? [
                  {
                    id: `3EB0${Date.now().toString(16).toUpperCase()}`,
                    sender: 'Anda',
                    senderPhone: '+62 813-7788-9900',
                    fromMe: true,
                    text: initialMessage.trim(),
                    timestamp: nowTime,
                    status: 'read',
                    byteSize: Buffer.byteLength(initialMessage.trim(), 'utf8') + 48,
                    frameHex: generateHexFrame(initialMessage.trim(), frameCounter),
                  },
                ]
              : [],
          };
          conversations.unshift(newThread);
          broadcast('thread:created', { thread: newThread, frameCounter });
        } else if (type === 'qr:refresh') {
          qrPairingRef = generateQrPairingRef();
          pairingShortCode = generateEightCharPairingCode();
          broadcast('qr:updated', { qrPairingRef, pairingShortCode });
        } else if (type === 'session:pair') {
          const { deviceName, arch } = payload;
          const newSession: LinkedDeviceSession = {
            id: `sess-${Date.now()}`,
            deviceName: deviceName || 'Windows 11 Native Client (whatsapp-rust.exe)',
            platform: 'Windows Native (Rust eframe/glow)',
            arch: arch || rustConfig.targetTriple,
            linkedAt: 'Baru saja ditautkan',
            ipAddress: '192.168.1.88',
            ramUsageMb: 23.6,
            active: true,
          };
          linkedSessions.unshift(newSession);
          qrPairingRef = generateQrPairingRef();
          pairingShortCode = generateEightCharPairingCode();
          broadcast('session:paired', {
            sessions: linkedSessions,
            qrPairingRef,
            pairingShortCode,
          });
        } else if (type === 'session:revoke') {
          const { sessionId } = payload;
          linkedSessions = linkedSessions.filter((s) => s.id !== sessionId);
          broadcast('session:revoked', { sessions: linkedSessions });
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`WhatsApp Native Rust Studio running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
