export interface ChatMessage {
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

export interface ConversationThread {
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

export interface LinkedDeviceSession {
  id: string;
  deviceName: string;
  platform: string;
  arch: string;
  linkedAt: string;
  ipAddress: string;
  ramUsageMb: number;
  active: boolean;
}

export interface RustExeConfig {
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

export interface RustRepoFile {
  path: string;
  label: string;
  description: string;
  content: string;
  sizeBytes: number;
}
