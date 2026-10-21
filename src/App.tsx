import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Send,
  Paperclip,
  Lock,
  QrCode,
  Cpu,
  Download,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  FileCode,
  Trash2,
  Plus,
  Minimize2,
  Maximize2,
  ShieldCheck,
  X,
  MessageSquareText,
  Phone,
  Video,
  CircleDot,
  Users,
  Archive,
  Star,
  Settings,
  MoreVertical,
  Smile,
  Mic,
  ArrowLeft,
  Pin,
  CornerUpLeft,
  CheckCheck,
  FileText,
  Image as ImageIcon,
  Camera,
  UserCheck,
  Play,
  Volume2,
  PhoneOff,
  Edit2,
} from 'lucide-react';
import {
  ConversationThread,
  LinkedDeviceSession,
  RustExeConfig,
  RustRepoFile,
  ChatMessage,
} from './types';
import { QrCanvas } from './components/QrCanvas';

type NavRailMode =
  | 'chats'
  | 'calls'
  | 'status'
  | 'communities'
  | 'archived'
  | 'starred'
  | 'pairing'
  | 'exe-studio'
  | 'source-code'
  | 'profile';

type ThreadFilter = 'all' | 'unread' | 'favorites' | 'groups';

interface LocalReactionMap {
  [messageId: string]: string;
}

interface ReplyContext {
  messageId: string;
  sender: string;
  text: string;
}

interface ReplyMap {
  [messageId: string]: ReplyContext;
}

const QUICK_EMOJIS = [
  '😀', '😂', '🥹', '😍', '🤩', '😎', '🥳', '🤔',
  '👍', '🙏', '🔥', '❤️', '💯', '✅', '🚀', '⚡',
  '🦀', '💻', '📦', '🔒', '🎉', '🙌', '🤝', '✨',
];

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

/** Authentic WhatsApp Double Check SVG */
const WhatsAppDoubleTick: React.FC<{ read?: boolean }> = ({ read = true }) => (
  <svg
    viewBox="0 0 16 11"
    width="16"
    height="11"
    className={`inline-block shrink-0 ${read ? 'text-[#53BDEB]' : 'text-[#8696A0]'}`}
    fill="currentColor"
  >
    <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.405-2.272a.463.463 0 0 0-.336-.146.47.47 0 0 0-.343.146l-.311.31a.445.445 0 0 0-.14.337c0 .136.047.25.14.343l2.996 2.996a.724.724 0 0 0 .501.203.67.67 0 0 0 .52-.246l6.672-8.419a.497.497 0 0 0 .108-.399.459.459 0 0 0-.184-.344l-.343-.221zm3.694 0a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-1.003-.946-.647.786 1.522 1.522a.724.724 0 0 0 .501.203.67.67 0 0 0 .52-.246l6.672-8.419a.497.497 0 0 0 .108-.399.459.459 0 0 0-.184-.344l-.314-.221z" />
  </svg>
);

export default function App() {
  const [railMode, setRailMode] = useState<NavRailMode>('chats');
  const [conversations, setConversations] = useState<ConversationThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string>('rust-core-team');
  const [threadFilter, setThreadFilter] = useState<ThreadFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  const [inChatSearchOpen, setInChatSearchOpen] = useState<boolean>(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState<string>('');
  const [contactInfoOpen, setContactInfoOpen] = useState<boolean>(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState<boolean>(false);
  const [chatMenuOpen, setChatMenuOpen] = useState<boolean>(false);

  // Composer & Message features
  const [messageInput, setMessageInput] = useState<string>('');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState<boolean>(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState<boolean>(false);
  const [replyingTo, setReplyingTo] = useState<ReplyContext | null>(null);
  const [replyMap, setReplyMap] = useState<ReplyMap>({});
  const [reactions, setReactions] = useState<LocalReactionMap>({
    '3EB0A101': '🔥',
    '3EB0A103': '👍',
  });
  const [starredIds, setStarredIds] = useState<string[]>(['3EB0A101']);
  const [pinnedThreadIds, setPinnedThreadIds] = useState<string[]>(['rust-core-team']);
  const [archivedThreadIds, setArchivedThreadIds] = useState<string[]>([]);
  const [favoriteThreadIds, setFavoriteThreadIds] = useState<string[]>([
    'rust-core-team',
    'nadia-devops',
  ]);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [inspectFrames, setInspectFrames] = useState<boolean>(false);
  const [minimizedToTray, setMinimizedToTray] = useState<boolean>(false);

  // User Profile State (WhatsApp Profile Drawer)
  const [myProfileName, setMyProfileName] = useState<string>('Arrazy (Rust Developer)');
  const [myProfileAbout, setMyProfileAbout] = useState<string>(
    'Sibuk · Menggunakan WhatsApp Native Rust (.exe)'
  );
  const [editingProfileName, setEditingProfileName] = useState<boolean>(false);
  const [editingProfileAbout, setEditingProfileAbout] = useState<boolean>(false);

  // Active Voice/Video Call Modal State
  const [activeCall, setActiveCall] = useState<{
    name: string;
    phone: string;
    initials: string;
    accent: string;
    isVideo: boolean;
  } | null>(null);

  // Multi-device & QR state
  const [linkedSessions, setLinkedSessions] = useState<LinkedDeviceSession[]>([]);
  const [qrPairingRef, setQrPairingRef] = useState<string>(
    '2@8f91a2c4e1b09d128f91a2c4e1b09d12,WA-RUST-NATIVE,WIN64-EXE'
  );
  const [pairingShortCode, setPairingShortCode] = useState<string>('WRST-94A2');
  const [newDeviceName, setNewDeviceName] = useState<string>(
    'Windows 11 Pro Workstation (whatsapp-rust.exe)'
  );
  const [frameCounter, setFrameCounter] = useState<number>(184);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  // Rust .exe Studio & Repository Source Files (Recommended Preset)
  const [rustConfig, setRustConfig] = useState<RustExeConfig>({
    appName: 'WhatsApp Native Rust',
    binaryName: 'whatsapp-rust.exe',
    targetTriple: 'x86_64-pc-windows-msvc',
    guiBackend: 'eframe-glow',
    optLevel: 'z',
    lto: true,
    stripSymbols: true,
    hideConsoleWindow: true,
    systemTray: true,
    autoStartWindows: false,
    alwaysOnTop: false,
    ramLimitMb: 32,
    workerThreads: 2,
  });
  const [rustFiles, setRustFiles] = useState<RustRepoFile[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string>('Cargo.toml');
  const [savingConfig, setSavingConfig] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Chat Modal
  const [showNewChatModal, setShowNewChatModal] = useState<boolean>(false);
  const [newContactName, setNewContactName] = useState<string>('');
  const [newContactPhone, setNewContactPhone] = useState<string>('+62 812-');
  const [newContactFirstMsg, setNewContactFirstMsg] = useState<string>('');

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const fetchRustSourceFiles = async () => {
    try {
      const res = await fetch('/api/rust-files');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.files)) {
        setRustFiles(data.files);
      }
      if (data.config) {
        setRustConfig(data.config);
      }
    } catch (err) {
      console.error('Failed to fetch Rust files:', err);
    }
  };

  useEffect(() => {
    fetchRustSourceFiles();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    let socket: WebSocket | null = null;
    let reconnectTimer: number | undefined;

    const connect = () => {
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setWsConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const { event: evtName, payload } = JSON.parse(event.data);

          if (evtName === 'init') {
            setConversations(payload.conversations || []);
            setLinkedSessions(payload.linkedSessions || []);
            if (payload.rustConfig) setRustConfig(payload.rustConfig);
            if (payload.qrPairingRef) setQrPairingRef(payload.qrPairingRef);
            if (payload.pairingShortCode) setPairingShortCode(payload.pairingShortCode);
            if (payload.frameCounter) setFrameCounter(payload.frameCounter);
          } else if (evtName === 'message:created') {
            const { threadId, message, frameCounter: nextCounter } = payload;
            if (nextCounter) setFrameCounter(nextCounter);
            setConversations((prev) =>
              prev.map((t) => {
                if (t.id !== threadId) return t;
                if (t.messages.some((m) => m.id === message.id)) return t;
                return {
                  ...t,
                  lastActivity: message.timestamp,
                  messages: [...t.messages, message],
                };
              })
            );
          } else if (evtName === 'message:status') {
            const { threadId, messageId, status } = payload;
            setConversations((prev) =>
              prev.map((t) => {
                if (t.id !== threadId) return t;
                return {
                  ...t,
                  messages: t.messages.map((m) =>
                    m.id === messageId ? { ...m, status } : m
                  ),
                };
              })
            );
          } else if (evtName === 'conversation:updated') {
            const { threadId, unreadCount } = payload;
            setConversations((prev) =>
              prev.map((t) => (t.id === threadId ? { ...t, unreadCount } : t))
            );
          } else if (evtName === 'thread:created') {
            const { thread, frameCounter: nextCounter } = payload;
            if (nextCounter) setFrameCounter(nextCounter);
            setConversations((prev) => {
              if (prev.some((t) => t.id === thread.id)) return prev;
              return [thread, ...prev];
            });
            setSelectedThreadId(thread.id);
          } else if (evtName === 'qr:updated') {
            setQrPairingRef(payload.qrPairingRef);
            setPairingShortCode(payload.pairingShortCode);
          } else if (evtName === 'session:paired') {
            setLinkedSessions(payload.sessions);
            setQrPairingRef(payload.qrPairingRef);
            setPairingShortCode(payload.pairingShortCode);
          } else if (evtName === 'session:revoked') {
            setLinkedSessions(payload.sessions);
          } else if (evtName === 'config:updated') {
            setRustConfig(payload);
            fetchRustSourceFiles();
          }
        } catch (err) {
          console.error('WS parse error:', err);
        }
      };

      socket.onclose = () => {
        setWsConnected(false);
        reconnectTimer = window.setTimeout(connect, 2000);
      };
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);

  const activeThread = useMemo(
    () =>
      conversations.find((c) => c.id === selectedThreadId) ||
      conversations[0] ||
      null,
    [conversations, selectedThreadId]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages.length, selectedThreadId]);

  const totalUnreadChats = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unreadCount > 0 ? 1 : 0), 0),
    [conversations]
  );

  const filteredConversations = useMemo(() => {
    const list = conversations.filter((c) => {
      const isArchived = archivedThreadIds.includes(c.id);
      if (railMode === 'archived') {
        return isArchived;
      }
      if (isArchived) return false;

      if (threadFilter === 'unread' && c.unreadCount === 0) return false;
      if (threadFilter === 'favorites' && !favoriteThreadIds.includes(c.id)) return false;
      if (threadFilter === 'groups' && !c.isGroup) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchPhone = c.phone.toLowerCase().includes(q);
        const matchMsg = c.messages.some((m) => m.text.toLowerCase().includes(q));
        return matchName || matchPhone || matchMsg;
      }
      return true;
    });

    // Sort pinned threads to top just like WhatsApp
    return [...list].sort((a, b) => {
      const aPinned = pinnedThreadIds.includes(a.id) ? 1 : 0;
      const bPinned = pinnedThreadIds.includes(b.id) ? 1 : 0;
      return bPinned - aPinned;
    });
  }, [
    conversations,
    threadFilter,
    searchQuery,
    archivedThreadIds,
    railMode,
    favoriteThreadIds,
    pinnedThreadIds,
  ]);

  const displayedMessages = useMemo(() => {
    if (!activeThread) return [];
    if (!inChatSearchOpen || !inChatSearchQuery.trim()) {
      return activeThread.messages;
    }
    const q = inChatSearchQuery.toLowerCase();
    return activeThread.messages.filter((m) => m.text.toLowerCase().includes(q));
  }, [activeThread, inChatSearchOpen, inChatSearchQuery]);

  const allStarredMessages = useMemo(() => {
    const items: Array<{ threadName: string; threadId: string; msg: ChatMessage }> = [];
    conversations.forEach((t) => {
      t.messages.forEach((m) => {
        if (starredIds.includes(m.id)) {
          items.push({ threadName: t.name, threadId: t.id, msg: m });
        }
      });
    });
    return items;
  }, [conversations, starredIds]);

  const buildMetrics = useMemo(() => {
    let binaryMb = rustConfig.guiBackend === 'eframe-glow' ? 7.8 : 4.6;
    if (rustConfig.optLevel === 'z') binaryMb -= 1.4;
    if (rustConfig.optLevel === 's') binaryMb -= 0.9;
    if (rustConfig.lto) binaryMb -= 0.8;
    if (rustConfig.stripSymbols) binaryMb -= 0.9;

    const idleRamMb =
      (rustConfig.guiBackend === 'eframe-glow' ? 22.4 : 29.5) +
      rustConfig.workerThreads * 0.9;

    const electronRamMb = 648.0;
    const ramSavingsPct = (((electronRamMb - idleRamMb) / electronRamMb) * 100).toFixed(1);

    return {
      binaryMb: Math.max(2.8, binaryMb).toFixed(2),
      idleRamMb: idleRamMb.toFixed(1),
      electronRamMb: electronRamMb.toFixed(0),
      ramSavingsPct,
    };
  }, [rustConfig]);

  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    if (
      railMode === 'pairing' ||
      railMode === 'exe-studio' ||
      railMode === 'source-code'
    ) {
      setRailMode('chats');
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'conversation:read',
          payload: { threadId },
        })
      );
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeThread || !messageInput.trim()) return;

    const msgId = `3EB0${Date.now().toString(16).toUpperCase()}`;
    const text = messageInput.trim();
    setMessageInput('');
    setEmojiPickerOpen(false);

    if (replyingTo) {
      setReplyMap((prev) => ({
        ...prev,
        [msgId]: replyingTo,
      }));
      setReplyingTo(null);
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'message:create',
          payload: {
            id: msgId,
            threadId: activeThread.id,
            text,
          },
        })
      );
    }
  };

  const handleSendVoiceNote = () => {
    if (!activeThread) return;
    const msgId = `3EB0${Date.now().toString(16).toUpperCase()}`;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'message:create',
          payload: {
            id: msgId,
            threadId: activeThread.id,
            text: 'Pesan Suara (0:09) · Opus 32kbps E2EE',
            attachmentType: 'voice',
            attachmentName: 'PTT-20261020-WA0042.opus',
          },
        })
      );
      triggerToast('Pesan suara terenkripsi dikirim');
    }
  };

  const handleSendAttachmentPreset = (
    attachmentType: 'document' | 'voice' | 'binary',
    attachmentName: string,
    caption: string
  ) => {
    if (!activeThread) return;
    setAttachMenuOpen(false);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'message:create',
          payload: {
            id: `3EB0${Date.now().toString(16).toUpperCase()}`,
            threadId: activeThread.id,
            text: caption,
            attachmentType,
            attachmentName,
          },
        })
      );
    }
  };

  const handleCreateNewThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'thread:create',
          payload: {
            name: newContactName.trim(),
            phone: newContactPhone.trim(),
            initialMessage: newContactFirstMsg.trim(),
          },
        })
      );
    }
    setNewContactName('');
    setNewContactPhone('+62 812-');
    setNewContactFirstMsg('');
    setShowNewChatModal(false);
    setRailMode('chats');
    triggerToast('Chat baru berhasil dibuat');
  };

  const handleToggleStarMessage = (msgId: string) => {
    setStarredIds((prev) =>
      prev.includes(msgId) ? prev.filter((id) => id !== msgId) : [...prev, msgId]
    );
  };

  const handleTogglePinThread = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedThreadIds((prev) =>
      prev.includes(threadId)
        ? prev.filter((id) => id !== threadId)
        : [threadId, ...prev]
    );
  };

  const handleToggleArchiveThread = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setArchivedThreadIds((prev) =>
      prev.includes(threadId)
        ? prev.filter((id) => id !== threadId)
        : [...prev, threadId]
    );
    triggerToast(
      archivedThreadIds.includes(threadId)
        ? 'Chat dikeluarkan dari arsip'
        : 'Chat diarsipkan'
    );
  };

  const handleRefreshQr = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'qr:refresh', payload: {} }));
      triggerToast('Kode QR Multi-Device diperbarui');
    }
  };

  const handlePairSimulatedDevice = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'session:pair',
          payload: {
            deviceName: newDeviceName.trim() || 'Windows Native (.exe)',
            arch: rustConfig.targetTriple,
          },
        })
      );
      triggerToast('Perangkat Windows (.exe) berhasil ditautkan');
    }
  };

  const handleRevokeSession = (sessionId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'session:revoke',
          payload: { sessionId },
        })
      );
      triggerToast('Perangkat berhasil dikeluarkan');
    }
  };

  const handleSaveRustConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await fetch('/api/rust-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rustConfig),
      });
      if (res.ok) {
        await fetchRustSourceFiles();
        triggerToast('Setelan berhasil disimpan ke Cargo.toml');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleDownloadExeBundle = () => {
    window.location.href = '/api/download-exe-bundle';
    triggerToast('Mengunduh installer builder Windows (.ps1 + kode Rust)');
  };

  const handleCopyText = (id: string, text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    triggerToast(`${label} disalin`);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  const selectedRustFile = useMemo(
    () =>
      rustFiles.find((f) => f.path === selectedFilePath) ||
      rustFiles[0] ||
      null,
    [rustFiles, selectedFilePath]
  );

  const isMainWorkspaceView =
    railMode === 'pairing' || railMode === 'exe-studio' || railMode === 'source-code';

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0B141A] text-[#E9EDEF] overflow-hidden select-none">
      {/* Native Windows WhatsApp .exe Titlebar */}
      <header className="h-8 bg-[#202C33] border-b border-[#2A3942] flex items-center justify-between px-3 shrink-0">
        {/* Zone 1: WhatsApp Native Title */}
        <div className="flex items-center gap-2 shrink-0">
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            className="text-[#00A884] fill-current"
          >
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.625.846 5.059 2.284 7.033l-1.492 5.448 5.601-1.47c1.909 1.044 4.095 1.639 6.425 1.639 6.627 0 12-5.373 12-12s-5.373-12-12-12z" />
          </svg>
          <span className="text-xs font-medium text-[#E9EDEF] whitespace-nowrap">
            WhatsApp
          </span>
        </div>

        {/* Zone 2: Subtle Native Rust Runtime Status Links */}
        <nav className="hidden md:flex items-center gap-5 text-[11px] text-[#8696A0] font-mono tabular-nums">
          <button
            onClick={() => setRailMode('chats')}
            className={`hover:text-[#E9EDEF] transition-colors whitespace-nowrap cursor-pointer ${
              !isMainWorkspaceView ? 'text-[#00A884] font-semibold' : ''
            }`}
          >
            WhatsApp Desktop
          </button>
          <button
            onClick={() => setRailMode('pairing')}
            className={`hover:text-[#E9EDEF] transition-colors whitespace-nowrap cursor-pointer ${
              railMode === 'pairing' ? 'text-[#00A884] font-semibold' : ''
            }`}
          >
            Perangkat Tertaut
          </button>
          <button
            onClick={() => setRailMode('exe-studio')}
            className={`hover:text-[#E9EDEF] transition-colors whitespace-nowrap cursor-pointer ${
              railMode === 'exe-studio' ? 'text-[#00A884] font-semibold' : ''
            }`}
          >
            Rust .exe ({buildMetrics.idleRamMb} MB / {rustConfig.ramLimitMb} MB RAM)
          </button>
          <button
            onClick={() => setRailMode('source-code')}
            className={`hover:text-[#E9EDEF] transition-colors whitespace-nowrap cursor-pointer ${
              railMode === 'source-code' ? 'text-[#00A884] font-semibold' : ''
            }`}
          >
            Kode Rust
          </button>
        </nav>

        {/* Zone 3: Windows Native Caption Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleDownloadExeBundle}
            className="px-2.5 py-0.5 mr-2 text-[11px] font-medium bg-[#00A884] text-[#111B21] rounded hover:bg-[#06cf9c] transition-colors whitespace-nowrap cursor-pointer"
          >
            Unduh .exe
          </button>
          <button
            onClick={() => {
              setMinimizedToTray((v) => !v);
              triggerToast(
                !minimizedToTray
                  ? 'Diminimalkan ke System Tray Windows (RAM: 14.8 MB)'
                  : 'Jendela WhatsApp dipulihkan'
              );
            }}
            title="Minimize to System Tray"
            className="w-7 h-6 flex items-center justify-center text-[#8696A0] hover:bg-[#2A3942] hover:text-[#E9EDEF] rounded transition-colors cursor-pointer"
          >
            <Minimize2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => setContactInfoOpen((v) => !v)}
            title="Toggle Info Panel"
            className="w-7 h-6 flex items-center justify-center text-[#8696A0] hover:bg-[#2A3942] hover:text-[#E9EDEF] rounded transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </header>

      {/* Optional System Tray Banner */}
      {minimizedToTray && (
        <div className="px-4 py-1.5 bg-[#182229] border-b border-[#2A3942] flex items-center justify-between text-xs text-[#8696A0]">
          <span>
            Mode System Tray Windows aktif — <code className="text-[#00A884]">{rustConfig.binaryName}</code> berjalan di latar belakang dengan konsumsi 14.8 MB RAM.
          </span>
          <button
            onClick={() => setMinimizedToTray(false)}
            className="text-[#00A884] font-medium hover:underline cursor-pointer"
          >
            Tampilkan Penuh
          </button>
        </div>
      )}

      {/* Authentic WhatsApp 3-Column Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* 1. LEFTMOST VERTICAL NAVIGATION RAIL (60px, #202C33) */}
        <aside className="w-[60px] bg-[#202C33] border-r border-[#2A3942] flex flex-col items-center justify-between py-3 shrink-0 z-20">
          {/* Top Navigation Icons */}
          <div className="flex flex-col items-center gap-2">
            {/* Chats */}
            <button
              onClick={() => setRailMode('chats')}
              title="Chat"
              className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                railMode === 'chats'
                  ? 'bg-[#2A3942] text-[#E9EDEF]'
                  : 'text-[#AEBAC1] hover:bg-[#2A3942]/60'
              }`}
            >
              <MessageSquareText className="w-5 h-5" />
              {totalUnreadChats > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#00A884] text-[#111B21] text-[10px] font-bold flex items-center justify-center">
                  {totalUnreadChats}
                </span>
              )}
            </button>

            {/* Calls */}
            <button
              onClick={() => setRailMode('calls')}
              title="Panggilan"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                railMode === 'calls'
                  ? 'bg-[#2A3942] text-[#E9EDEF]'
                  : 'text-[#AEBAC1] hover:bg-[#2A3942]/60'
              }`}
            >
              <Phone className="w-5 h-5" />
            </button>

            {/* Status / Updates */}
            <button
              onClick={() => setRailMode('status')}
              title="Status"
              className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                railMode === 'status'
                  ? 'bg-[#2A3942] text-[#E9EDEF]'
                  : 'text-[#AEBAC1] hover:bg-[#2A3942]/60'
              }`}
            >
              <CircleDot className="w-5 h-5" />
              <span className="w-2 h-2 rounded-full bg-[#00A884] absolute top-2 right-2" />
            </button>

            {/* Communities */}
            <button
              onClick={() => setRailMode('communities')}
              title="Komunitas"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                railMode === 'communities'
                  ? 'bg-[#2A3942] text-[#E9EDEF]'
                  : 'text-[#AEBAC1] hover:bg-[#2A3942]/60'
              }`}
            >
              <Users className="w-5 h-5" />
            </button>

            <div className="w-6 h-[1px] bg-[#2A3942] my-1" />

            {/* Starred Messages */}
            <button
              onClick={() => setRailMode('starred')}
              title="Pesan Berbintang"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                railMode === 'starred'
                  ? 'bg-[#2A3942] text-[#E9EDEF]'
                  : 'text-[#AEBAC1] hover:bg-[#2A3942]/60'
              }`}
            >
              <Star className="w-5 h-5" />
            </button>

            {/* Archived Chats */}
            <button
              onClick={() => setRailMode('archived')}
              title="Chat Diarsipkan"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                railMode === 'archived'
                  ? 'bg-[#2A3942] text-[#E9EDEF]'
                  : 'text-[#AEBAC1] hover:bg-[#2A3942]/60'
              }`}
            >
              <Archive className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom Navigation Icons */}
          <div className="flex flex-col items-center gap-2.5">
            {/* Multi-Device QR Pairing */}
            <button
              onClick={() => setRailMode('pairing')}
              title="Perangkat Tertaut (Multi-Device QR)"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                railMode === 'pairing'
                  ? 'bg-[#00A884] text-[#111B21]'
                  : 'text-[#AEBAC1] hover:bg-[#2A3942]/60'
              }`}
            >
              <QrCode className="w-5 h-5" />
            </button>

            {/* Rust .exe Builder & Settings */}
            <button
              onClick={() => setRailMode('exe-studio')}
              title="Setelan & Builder Rust (.exe)"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                railMode === 'exe-studio' || railMode === 'source-code'
                  ? 'bg-[#00A884] text-[#111B21]'
                  : 'text-[#AEBAC1] hover:bg-[#2A3942]/60'
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* User Profile Avatar */}
            <button
              onClick={() => setRailMode('profile')}
              title="Profil"
              className={`w-9 h-9 rounded-full bg-[#00A884] text-[#111B21] font-bold text-xs flex items-center justify-center transition-transform cursor-pointer ${
                railMode === 'profile' ? 'ring-2 ring-white scale-105' : 'hover:opacity-90'
              }`}
            >
              AR
            </button>
          </div>
        </aside>

        {/* 2. LEFT COLUMN: CHAT LIST / CALLS / STATUS / PROFILE DRAWER (380px, #111B21) */}
        {!isMainWorkspaceView && (
          <section className="w-[340px] sm:w-[380px] lg:w-[400px] bg-[#111B21] border-r border-[#2A3942] flex flex-col shrink-0 select-none">
            {/* MODE A: CHATS OR ARCHIVED */}
            {(railMode === 'chats' || railMode === 'archived') && (
              <>
                {/* WhatsApp Top Chat List Header */}
                <div className="h-[60px] px-4 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    {railMode === 'archived' && (
                      <button
                        onClick={() => setRailMode('chats')}
                        className="text-[#AEBAC1] hover:text-[#E9EDEF] cursor-pointer"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                    )}
                    <h1 className="text-[22px] font-bold tracking-tight text-[#E9EDEF]">
                      {railMode === 'archived' ? 'Diarsipkan' : 'Chat'}
                    </h1>
                  </div>

                  <div className="flex items-center gap-1 relative">
                    <button
                      onClick={() => setShowNewChatModal(true)}
                      title="Chat baru"
                      className="w-10 h-10 rounded-full flex items-center justify-center text-[#AEBAC1] hover:bg-[#2A3942]/60 transition-colors cursor-pointer"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setHeaderMenuOpen((v) => !v)}
                      title="Menu"
                      className="w-10 h-10 rounded-full flex items-center justify-center text-[#AEBAC1] hover:bg-[#2A3942]/60 transition-colors cursor-pointer"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {/* WhatsApp 3-Dot Dropdown Menu */}
                    {headerMenuOpen && (
                      <div className="absolute right-0 top-11 w-56 py-2 bg-[#233138] rounded-lg shadow-xl border border-[#2A3942] z-40 text-[14.5px] text-[#D1D7DB]">
                        <button
                          onClick={() => {
                            setHeaderMenuOpen(false);
                            setShowNewChatModal(true);
                          }}
                          className="w-full text-left px-5 py-2.5 hover:bg-[#182229] transition-colors cursor-pointer"
                        >
                          Chat / Grup baru
                        </button>
                        <button
                          onClick={() => {
                            setHeaderMenuOpen(false);
                            setRailMode('starred');
                          }}
                          className="w-full text-left px-5 py-2.5 hover:bg-[#182229] transition-colors cursor-pointer"
                        >
                          Pesan berbintang
                        </button>
                        <button
                          onClick={() => {
                            setHeaderMenuOpen(false);
                            setRailMode('pairing');
                          }}
                          className="w-full text-left px-5 py-2.5 hover:bg-[#182229] transition-colors cursor-pointer"
                        >
                          Perangkat tertaut (QR)
                        </button>
                        <button
                          onClick={() => {
                            setHeaderMenuOpen(false);
                            setRailMode('exe-studio');
                          }}
                          className="w-full text-left px-5 py-2.5 hover:bg-[#182229] transition-colors cursor-pointer"
                        >
                          Setelan Rust .exe Studio
                        </button>
                        <div className="my-1 border-t border-[#2A3942]" />
                        <button
                          onClick={() => {
                            setHeaderMenuOpen(false);
                            handleDownloadExeBundle();
                          }}
                          className="w-full text-left px-5 py-2.5 text-[#00A884] hover:bg-[#182229] transition-colors cursor-pointer"
                        >
                          Unduh whatsapp-rust.exe
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* WhatsApp Search Input & Filter Chips */}
                <div className="px-3 pb-2 space-y-2 shrink-0">
                  <div className="flex items-center bg-[#202C33] rounded-lg h-[36px] px-3 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (searchQuery) setSearchQuery('');
                      }}
                      className="text-[#8696A0] hover:text-[#E9EDEF] cursor-pointer"
                    >
                      {searchFocused || searchQuery ? (
                        <ArrowLeft className="w-4 h-4 text-[#00A884]" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="text"
                      value={searchQuery}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari atau mulai chat baru"
                      className="w-full bg-transparent text-[14px] text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-[#8696A0] hover:text-[#E9EDEF] cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Authentic WhatsApp Filter Chips */}
                  {railMode === 'chats' && (
                    <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto">
                      {(
                        [
                          { key: 'all', label: 'Semua' },
                          { key: 'unread', label: 'Belum dibaca' },
                          { key: 'favorites', label: 'Favorit' },
                          { key: 'groups', label: 'Grup' },
                        ] as const
                      ).map((chip) => {
                        const active = threadFilter === chip.key;
                        return (
                          <button
                            key={chip.key}
                            onClick={() => setThreadFilter(chip.key)}
                            className={`px-3 py-1 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              active
                                ? 'bg-[#0A332C] text-[#00A884]'
                                : 'bg-[#202C33] text-[#8696A0] hover:bg-[#2A3942] hover:text-[#D1D7DB]'
                            }`}
                          >
                            {chip.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Archived Quick Row at Top of List */}
                {railMode === 'chats' && archivedThreadIds.length > 0 && (
                  <button
                    onClick={() => setRailMode('archived')}
                    className="w-full px-5 py-3 flex items-center justify-between hover:bg-[#202C33] border-b border-[#222E35] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <Archive className="w-5 h-5 text-[#00A884]" />
                      <span className="text-[16px] text-[#E9EDEF]">Diarsipkan</span>
                    </div>
                    <span className="text-xs font-medium text-[#00A884]">
                      {archivedThreadIds.length}
                    </span>
                  </button>
                )}

                {/* Chat Rows */}
                <div className="flex-1 overflow-y-auto">
                  {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-sm text-[#8696A0] space-y-3">
                      <p>Tidak ada chat yang ditemukan.</p>
                      {threadFilter !== 'all' && (
                        <button
                          onClick={() => setThreadFilter('all')}
                          className="text-[#00A884] hover:underline text-xs cursor-pointer"
                        >
                          Lihat semua chat
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredConversations.map((thread) => {
                      const isSelected = activeThread?.id === thread.id;
                      const lastMsg = thread.messages[thread.messages.length - 1];
                      const isPinned = pinnedThreadIds.includes(thread.id);

                      return (
                        <div
                          key={thread.id}
                          onClick={() => handleSelectThread(thread.id)}
                          className={`group h-[72px] px-3 flex items-center gap-3.5 cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#2A3942]' : 'hover:bg-[#202C33]'
                          }`}
                        >
                          {/* 49x49 Avatar */}
                          <div className="relative shrink-0">
                            <div
                              className="w-[49px] h-[49px] rounded-full flex items-center justify-center text-sm font-semibold text-white"
                              style={{ backgroundColor: thread.avatarAccent }}
                            >
                              {thread.avatarInitials}
                            </div>
                            {thread.online && (
                              <span className="w-3 h-3 rounded-full bg-[#00A884] ring-2 ring-[#111B21] absolute bottom-0 right-0" />
                            )}
                          </div>

                          {/* Conversation Content with Hairline Bottom Border */}
                          <div className="flex-1 min-w-0 h-full flex flex-col justify-center border-b border-[#222E35] pr-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-[16.5px] font-normal text-[#E9EDEF] truncate">
                                {thread.name}
                              </span>
                              <span
                                className={`text-[12px] shrink-0 tabular-nums ${
                                  thread.unreadCount > 0
                                    ? 'text-[#00A884] font-medium'
                                    : 'text-[#8696A0]'
                                }`}
                              >
                                {thread.lastActivity}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 mt-0.5">
                              <div className="flex items-center gap-1 min-w-0 text-[14px] text-[#8696A0]">
                                {lastMsg?.fromMe && (
                                  <WhatsAppDoubleTick read={lastMsg.status === 'read'} />
                                )}
                                <span className="truncate">
                                  {lastMsg
                                    ? `${
                                        thread.isGroup && !lastMsg.fromMe
                                          ? `${lastMsg.sender}: `
                                          : ''
                                      }${lastMsg.text}`
                                    : 'Ketuk untuk mulai chat'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {isPinned && (
                                  <Pin className="w-3.5 h-3.5 text-[#8696A0] rotate-45" />
                                )}
                                {thread.unreadCount > 0 && (
                                  <span className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-[#00A884] text-[#111B21] text-[12px] font-bold flex items-center justify-center">
                                    {thread.unreadCount}
                                  </span>
                                )}
                                {/* Hover quick pin/archive actions */}
                                <button
                                  onClick={(e) => handleTogglePinThread(thread.id, e)}
                                  title={isPinned ? 'Lepas sematan' : 'Sematkan chat'}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-[#8696A0] hover:text-[#E9EDEF] transition-opacity cursor-pointer"
                                >
                                  <Pin className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handleToggleArchiveThread(thread.id, e)}
                                  title="Arsipkan chat"
                                  className="opacity-0 group-hover:opacity-100 p-1 text-[#8696A0] hover:text-[#E9EDEF] transition-opacity cursor-pointer"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Bottom E2EE Footer inside Chat List */}
                <div className="py-2.5 px-4 border-t border-[#222E35] text-center text-[11.5px] text-[#8696A0] flex items-center justify-center gap-1.5">
                  <Lock className="w-3 h-3 text-[#8696A0]" />
                  <span>
                    Pesan pribadi Anda <span className="text-[#00A884]">terenkripsi secara end-to-end</span>
                  </span>
                </div>
              </>
            )}

            {/* MODE B: CALLS LIST */}
            {railMode === 'calls' && (
              <div className="flex-1 flex flex-col">
                <div className="h-[60px] px-4 flex items-center justify-between border-b border-[#222E35]">
                  <h1 className="text-[22px] font-bold text-[#E9EDEF]">Panggilan</h1>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-[#222E35]">
                  {conversations.map((c) => (
                    <div
                      key={c.id}
                      className="px-4 py-3.5 flex items-center justify-between hover:bg-[#202C33] transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white"
                          style={{ backgroundColor: c.avatarAccent }}
                        >
                          {c.avatarInitials}
                        </div>
                        <div>
                          <div className="text-[16px] text-[#E9EDEF]">{c.name}</div>
                          <div className="text-xs text-[#00A884] mt-0.5">
                            ↙ Hari ini, {c.lastActivity} · Audio Opus E2EE
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            setActiveCall({
                              name: c.name,
                              phone: c.phone,
                              initials: c.avatarInitials,
                              accent: c.avatarAccent,
                              isVideo: false,
                            })
                          }
                          className="p-2.5 rounded-full text-[#00A884] hover:bg-[#2A3942] transition-colors cursor-pointer"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setActiveCall({
                              name: c.name,
                              phone: c.phone,
                              initials: c.avatarInitials,
                              accent: c.avatarAccent,
                              isVideo: true,
                            })
                          }
                          className="p-2.5 rounded-full text-[#00A884] hover:bg-[#2A3942] transition-colors cursor-pointer"
                        >
                          <Video className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MODE C: STATUS / UPDATES */}
            {railMode === 'status' && (
              <div className="flex-1 flex flex-col">
                <div className="h-[60px] px-4 flex items-center justify-between border-b border-[#222E35]">
                  <h1 className="text-[22px] font-bold text-[#E9EDEF]">Status</h1>
                </div>
                <div className="p-4 border-b border-[#222E35] flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-[#00A884] text-[#111B21] font-bold flex items-center justify-center relative">
                    AR
                    <span className="w-5 h-5 rounded-full bg-[#00A884] text-white border-2 border-[#111B21] absolute -bottom-0.5 -right-0.5 flex items-center justify-center text-xs">
                      +
                    </span>
                  </div>
                  <div>
                    <div className="text-[16px] text-[#E9EDEF]">Status saya</div>
                    <div className="text-xs text-[#8696A0]">
                      Ketuk untuk menambahkan pembaruan status
                    </div>
                  </div>
                </div>
                <div className="px-4 py-2 text-xs font-semibold text-[#00A884] uppercase tracking-wider">
                  Pembaruan Terkini
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-[#222E35]">
                  {conversations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        handleSelectThread(c.id);
                        triggerToast(`Melihat status ${c.name}: "Testing WhatsApp Native Rust .exe 🚀"`);
                      }}
                      className="w-full text-left px-4 py-3 flex items-center gap-3.5 hover:bg-[#202C33] transition-colors cursor-pointer"
                    >
                      <div
                        className="w-12 h-12 rounded-full ring-2 ring-[#00A884] p-0.5 flex items-center justify-center text-sm font-bold text-white"
                        style={{ backgroundColor: c.avatarAccent }}
                      >
                        {c.avatarInitials}
                      </div>
                      <div>
                        <div className="text-[16px] text-[#E9EDEF]">{c.name}</div>
                        <div className="text-xs text-[#8696A0]">Hari ini pukul {c.lastActivity}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* MODE D: COMMUNITIES */}
            {railMode === 'communities' && (
              <div className="flex-1 flex flex-col">
                <div className="h-[60px] px-4 flex items-center justify-between border-b border-[#222E35]">
                  <h1 className="text-[22px] font-bold text-[#E9EDEF]">Komunitas</h1>
                </div>
                <div className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#00A884]/20 text-[#00A884] flex items-center justify-center mx-auto">
                    <Users className="w-8 h-8" />
                  </div>
                  <h2 className="text-base font-semibold text-[#E9EDEF]">
                    Komunitas WhatsApp Native Rust Indonesia
                  </h2>
                  <p className="text-xs text-[#8696A0] leading-relaxed">
                    Gabungkan grup pengembang Rust, penguji binary Windows .exe, dan kontributor protokol Noise_XX dalam satu komunitas terpadu.
                  </p>
                  <button
                    onClick={() => handleSelectThread('rust-core-team')}
                    className="px-4 py-2 rounded-full bg-[#00A884] text-[#111B21] text-xs font-semibold hover:bg-[#06cf9c] transition-colors cursor-pointer"
                  >
                    Buka Grup Rust Core Team
                  </button>
                </div>
              </div>
            )}

            {/* MODE E: STARRED MESSAGES */}
            {railMode === 'starred' && (
              <div className="flex-1 flex flex-col">
                <div className="h-[60px] px-4 flex items-center gap-3 border-b border-[#222E35]">
                  <button
                    onClick={() => setRailMode('chats')}
                    className="text-[#AEBAC1] hover:text-[#E9EDEF] cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h1 className="text-[19px] font-bold text-[#E9EDEF]">
                    Pesan Berbintang
                  </h1>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {allStarredMessages.length === 0 ? (
                    <div className="text-center text-xs text-[#8696A0] py-12">
                      Belum ada pesan berbintang. Arahkan kursor ke pesan di chat lalu klik ikon bintang.
                    </div>
                  ) : (
                    allStarredMessages.map(({ threadName, threadId, msg }) => (
                      <div
                        key={msg.id}
                        onClick={() => handleSelectThread(threadId)}
                        className="p-3.5 rounded-lg bg-[#202C33] hover:bg-[#2A3942] cursor-pointer space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs text-[#8696A0]">
                          <span className="font-semibold text-[#00A884]">
                            {msg.sender} &rarr; {threadName}
                          </span>
                          <span>{msg.timestamp}</span>
                        </div>
                        <p className="text-sm text-[#E9EDEF]">{msg.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* MODE F: WHATSAPP PROFILE DRAWER */}
            {railMode === 'profile' && (
              <div className="flex-1 flex flex-col bg-[#111B21]">
                <div className="h-[60px] px-4 bg-[#202C33] flex items-center gap-4">
                  <button
                    onClick={() => setRailMode('chats')}
                    className="text-[#AEBAC1] hover:text-[#E9EDEF] cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h1 className="text-[19px] font-medium text-[#E9EDEF]">Profil</h1>
                </div>

                <div className="p-6 flex flex-col items-center border-b border-[#222E35]">
                  <div className="w-36 h-36 rounded-full bg-[#00A884] text-[#111B21] text-4xl font-bold flex items-center justify-center shadow-lg">
                    AR
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs text-[#00A884]">Nama Anda</label>
                    <div className="flex items-center justify-between gap-2 border-b border-[#2A3942] pb-2">
                      {editingProfileName ? (
                        <input
                          type="text"
                          value={myProfileName}
                          onChange={(e) => setMyProfileName(e.target.value)}
                          onBlur={() => setEditingProfileName(false)}
                          autoFocus
                          className="w-full bg-transparent text-sm text-[#E9EDEF] focus:outline-none"
                        />
                      ) : (
                        <span className="text-base text-[#E9EDEF]">{myProfileName}</span>
                      )}
                      <button
                        onClick={() => setEditingProfileName((v) => !v)}
                        className="text-[#8696A0] hover:text-[#E9EDEF] cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-[#8696A0]">
                      Ini bukan nama pengguna atau PIN Anda. Nama ini akan terlihat oleh kontak WhatsApp Anda.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-[#00A884]">Info</label>
                    <div className="flex items-center justify-between gap-2 border-b border-[#2A3942] pb-2">
                      {editingProfileAbout ? (
                        <input
                          type="text"
                          value={myProfileAbout}
                          onChange={(e) => setMyProfileAbout(e.target.value)}
                          onBlur={() => setEditingProfileAbout(false)}
                          autoFocus
                          className="w-full bg-transparent text-sm text-[#E9EDEF] focus:outline-none"
                        />
                      ) : (
                        <span className="text-sm text-[#E9EDEF]">{myProfileAbout}</span>
                      )}
                      <button
                        onClick={() => setEditingProfileAbout((v) => !v)}
                        className="text-[#8696A0] hover:text-[#E9EDEF] cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* 3. MAIN RIGHT VIEWPORT: WHATSAPP CHAT CANVAS OR RUST .EXE / QR STUDIO */}
        {!isMainWorkspaceView ? (
          <main className="flex-1 flex overflow-hidden">
            {activeThread ? (
              <div className="flex-1 flex flex-col bg-[#0B141A] relative overflow-hidden">
                {/* Authentic WhatsApp Chat Header (60px, #202C33) */}
                <div className="h-[60px] px-4 bg-[#202C33] border-b border-[#2A3942] flex items-center justify-between shrink-0 z-10">
                  {/* Clickable Contact Info Trigger */}
                  <div
                    onClick={() => setContactInfoOpen((v) => !v)}
                    className="flex items-center gap-3.5 min-w-0 cursor-pointer"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: activeThread.avatarAccent }}
                    >
                      {activeThread.avatarInitials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[16px] font-medium text-[#E9EDEF] truncate">
                        {activeThread.name}
                      </div>
                      <div className="text-[13px] text-[#8696A0] truncate">
                        {activeThread.isGroup
                          ? 'Arrazy, Raka, Nadia, Dimas, Anda'
                          : activeThread.online
                          ? 'online'
                          : `terakhir dilihat hari ini pukul ${activeThread.lastActivity}`}
                      </div>
                    </div>
                  </div>

                  {/* Right Header Action Icons (Video/Voice Call pill, Search, More) */}
                  <div className="flex items-center gap-1.5 relative">
                    {/* Authentic WhatsApp Split Call Button */}
                    <div className="hidden sm:flex items-center rounded-full border border-[#2A3942] bg-[#111B21]/40 overflow-hidden mr-1">
                      <button
                        onClick={() =>
                          setActiveCall({
                            name: activeThread.name,
                            phone: activeThread.phone,
                            initials: activeThread.avatarInitials,
                            accent: activeThread.avatarAccent,
                            isVideo: true,
                          })
                        }
                        title="Panggilan Video"
                        className="px-3 py-1.5 text-[#AEBAC1] hover:bg-[#2A3942] hover:text-[#E9EDEF] transition-colors flex items-center gap-1.5 border-r border-[#2A3942] cursor-pointer"
                      >
                        <Video className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setActiveCall({
                            name: activeThread.name,
                            phone: activeThread.phone,
                            initials: activeThread.avatarInitials,
                            accent: activeThread.avatarAccent,
                            isVideo: false,
                          })
                        }
                        title="Panggilan Suara"
                        className="px-3 py-1.5 text-[#AEBAC1] hover:bg-[#2A3942] hover:text-[#E9EDEF] transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => setInChatSearchOpen((v) => !v)}
                      title="Cari pesan"
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                        inChatSearchOpen
                          ? 'bg-[#2A3942] text-[#00A884]'
                          : 'text-[#AEBAC1] hover:bg-[#2A3942]/60'
                      }`}
                    >
                      <Search className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => setChatMenuOpen((v) => !v)}
                      title="Menu"
                      className="w-10 h-10 rounded-full flex items-center justify-center text-[#AEBAC1] hover:bg-[#2A3942]/60 transition-colors cursor-pointer"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {/* Active Chat 3-Dot Menu */}
                    {chatMenuOpen && (
                      <div className="absolute right-0 top-11 w-56 py-2 bg-[#233138] rounded-lg shadow-xl border border-[#2A3942] z-40 text-[14.5px] text-[#D1D7DB]">
                        <button
                          onClick={() => {
                            setChatMenuOpen(false);
                            setContactInfoOpen((v) => !v);
                          }}
                          className="w-full text-left px-5 py-2.5 hover:bg-[#182229] transition-colors cursor-pointer"
                        >
                          Info kontak
                        </button>
                        <button
                          onClick={() => {
                            setChatMenuOpen(false);
                            setInspectFrames((v) => !v);
                          }}
                          className="w-full text-left px-5 py-2.5 hover:bg-[#182229] transition-colors cursor-pointer"
                        >
                          {inspectFrames ? 'Sembunyikan Hex Frame' : 'Inspektur Frame Noise_XX'}
                        </button>
                        <button
                          onClick={() => {
                            setChatMenuOpen(false);
                            setFavoriteThreadIds((prev) =>
                              prev.includes(activeThread.id)
                                ? prev.filter((id) => id !== activeThread.id)
                                : [...prev, activeThread.id]
                            );
                            triggerToast('Status favorit diperbarui');
                          }}
                          className="w-full text-left px-5 py-2.5 hover:bg-[#182229] transition-colors cursor-pointer"
                        >
                          {favoriteThreadIds.includes(activeThread.id)
                            ? 'Hapus dari Favorit'
                            : 'Tambah ke Favorit'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Optional In-Chat Search Bar */}
                {inChatSearchOpen && (
                  <div className="px-4 py-2 bg-[#182229] border-b border-[#2A3942] flex items-center gap-3">
                    <Search className="w-4 h-4 text-[#8696A0]" />
                    <input
                      type="text"
                      value={inChatSearchQuery}
                      onChange={(e) => setInChatSearchQuery(e.target.value)}
                      placeholder="Cari di dalam percakapan ini..."
                      autoFocus
                      className="flex-1 bg-transparent text-sm text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        setInChatSearchOpen(false);
                        setInChatSearchQuery('');
                      }}
                      className="text-[#8696A0] hover:text-[#E9EDEF] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Authentic WhatsApp Chat Wallpaper & Messages Stream */}
                <div className="flex-1 wa-chat-wallpaper overflow-y-auto px-4 sm:px-[6%] lg:px-[9%] py-4 space-y-2">
                  {/* Date Header Chip */}
                  <div className="flex justify-center my-2">
                    <span className="px-3 py-1 rounded-lg bg-[#182229] text-[#8696A0] text-[12.5px] shadow-sm">
                      HARI INI
                    </span>
                  </div>

                  {/* Authentic WhatsApp Gold End-to-End Encryption Banner */}
                  <div className="flex justify-center my-3">
                    <div
                      onClick={() => setContactInfoOpen(true)}
                      className="max-w-[520px] px-4 py-2 rounded-lg bg-[#182229] text-[#FFD279] text-[12.5px] text-center leading-[18px] shadow-sm cursor-pointer hover:bg-[#1d2932] transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />
                      Pesan dan panggilan terenkripsi secara end-to-end. Tidak seorang pun di luar chat ini, termasuk WhatsApp, yang dapat membaca atau mendengarkannya. Ketuk untuk info selengkapnya.
                    </div>
                  </div>

                  {/* Message Bubbles */}
                  {displayedMessages.map((msg, idx) => {
                    const prevMsg = idx > 0 ? displayedMessages[idx - 1] : null;
                    const isFirstInGroup = !prevMsg || prevMsg.fromMe !== msg.fromMe;
                    const quoted = replyMap[msg.id];
                    const reaction = reactions[msg.id];
                    const isStarred = starredIds.includes(msg.id);

                    return (
                      <div
                        key={msg.id}
                        onMouseEnter={() => setHoveredMsgId(msg.id)}
                        onMouseLeave={() => setHoveredMsgId(null)}
                        className={`relative flex flex-col ${
                          msg.fromMe ? 'items-end' : 'items-start'
                        } ${isFirstInGroup ? 'mt-2.5' : 'mt-0.5'} ${
                          reaction ? 'mb-3.5' : ''
                        }`}
                      >
                        <div className="relative group max-w-[85%] sm:max-w-[68%]">
                          {/* Hover Message Action Bar (Reply, Star, Emoji React) */}
                          {hoveredMsgId === msg.id && (
                            <div
                              className={`absolute -top-8 ${
                                msg.fromMe ? 'right-0' : 'left-0'
                              } flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#233138] border border-[#2A3942] shadow-lg z-20`}
                            >
                              {REACTION_EMOJIS.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() =>
                                    setReactions((prev) => ({
                                      ...prev,
                                      [msg.id]: prev[msg.id] === emoji ? '' : emoji,
                                    }))
                                  }
                                  className="hover:scale-125 transition-transform px-1 text-xs cursor-pointer"
                                >
                                  {emoji}
                                </button>
                              ))}
                              <div className="w-[1px] h-3.5 bg-[#2A3942] mx-0.5" />
                              <button
                                onClick={() => {
                                  setReplyingTo({
                                    messageId: msg.id,
                                    sender: msg.fromMe ? 'Anda' : msg.sender,
                                    text: msg.text,
                                  });
                                  inputRef.current?.focus();
                                }}
                                title="Balas"
                                className="p-1 text-[#AEBAC1] hover:text-[#E9EDEF] cursor-pointer"
                              >
                                <CornerUpLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleToggleStarMessage(msg.id)}
                                title="Beri bintang"
                                className={`p-1 cursor-pointer ${
                                  isStarred
                                    ? 'text-[#FFD279]'
                                    : 'text-[#AEBAC1] hover:text-[#E9EDEF]'
                                }`}
                              >
                                <Star className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* SVG Bubble Tail on First Message in Sequence */}
                          {isFirstInGroup && msg.fromMe && (
                            <svg
                              viewBox="0 0 8 13"
                              width="8"
                              height="13"
                              className="absolute -right-[7px] top-0 text-[#005C4B] fill-current"
                            >
                              <path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" />
                            </svg>
                          )}
                          {isFirstInGroup && !msg.fromMe && (
                            <svg
                              viewBox="0 0 8 13"
                              width="8"
                              height="13"
                              className="absolute -left-[7px] top-0 text-[#202C33] fill-current"
                            >
                              <path d="M1.533 3.568L8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z" />
                            </svg>
                          )}

                          {/* Bubble Container */}
                          <div
                            className={`rounded-lg px-2.5 py-1.5 shadow-sm ${
                              msg.fromMe
                                ? `bg-[#005C4B] text-[#E9EDEF] ${
                                    isFirstInGroup ? 'rounded-tr-none' : ''
                                  }`
                                : `bg-[#202C33] text-[#E9EDEF] ${
                                    isFirstInGroup ? 'rounded-tl-none' : ''
                                  }`
                            }`}
                          >
                            {/* Group Sender Header */}
                            {!msg.fromMe && activeThread.isGroup && isFirstInGroup && (
                              <div className="text-[12.8px] font-medium text-[#53BDEB] leading-tight mb-0.5">
                                {msg.sender}
                              </div>
                            )}

                            {/* Quoted Reply Preview inside Bubble */}
                            {quoted && (
                              <div className="mb-1.5 px-2.5 py-1.5 rounded bg-black/20 border-l-4 border-[#00A884] text-xs">
                                <div className="font-semibold text-[#00A884]">
                                  {quoted.sender}
                                </div>
                                <div className="text-[#D1D7DB] truncate">
                                  {quoted.text}
                                </div>
                              </div>
                            )}

                            {/* Voice Note or File Attachment */}
                            {msg.attachmentName && (
                              <div className="mb-1.5 p-2.5 rounded-md bg-black/20 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {msg.attachmentType === 'voice' ? (
                                    <div className="w-8 h-8 rounded-full bg-[#00A884] text-[#111B21] flex items-center justify-center shrink-0">
                                      <Play className="w-4 h-4 fill-current" />
                                    </div>
                                  ) : (
                                    <FileCode className="w-5 h-5 text-[#00A884] shrink-0" />
                                  )}
                                  <div className="min-w-0">
                                    <div className="text-xs font-medium text-[#E9EDEF] truncate">
                                      {msg.attachmentName}
                                    </div>
                                    <div className="text-[10.5px] text-[#8696A0]">
                                      {msg.attachmentType === 'voice'
                                        ? 'Pesan Suara · 0:09'
                                        : `${msg.byteSize} B · Dokumen Rust`}
                                    </div>
                                  </div>
                                </div>
                                {msg.attachmentType !== 'voice' && (
                                  <button
                                    onClick={() => setRailMode('source-code')}
                                    className="text-xs text-[#00A884] font-medium hover:underline shrink-0 cursor-pointer"
                                  >
                                    Buka
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Message Body + Inline Floating Bottom-Right Timestamp & Ticks */}
                            <div className="text-[14.2px] leading-[19px] break-words">
                              <span>{msg.text}</span>
                              <span className="inline-block w-[72px] h-3 select-none" />
                            </div>

                            <div className="float-right -mt-3.5 flex items-center gap-1 text-[11px] text-[#E9EDEF]/65 select-none">
                              {isStarred && (
                                <Star className="w-3 h-3 fill-[#E9EDEF]/65 text-[#E9EDEF]/65" />
                              )}
                              <span className="tabular-nums">{msg.timestamp}</span>
                              {msg.fromMe && (
                                <WhatsAppDoubleTick read={msg.status === 'read'} />
                              )}
                            </div>

                            <div className="clear-both" />

                            {/* Optional Hex Frame Inspector */}
                            {inspectFrames && (
                              <div className="mt-1.5 pt-1 border-t border-white/10 text-[10.5px] font-mono text-[#8696A0] flex items-center justify-between gap-2">
                                <span>
                                  {msg.id} · {msg.frameHex}
                                </span>
                                <button
                                  onClick={() =>
                                    handleCopyText(msg.id, msg.frameHex, 'Frame Hex')
                                  }
                                  className="text-[#00A884] hover:underline cursor-pointer"
                                >
                                  Salin
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Floating Emoji Reaction Badge */}
                          {reaction && (
                            <button
                              onClick={() =>
                                setReactions((prev) => ({ ...prev, [msg.id]: '' }))
                              }
                              className={`absolute -bottom-3 ${
                                msg.fromMe ? 'right-2' : 'left-2'
                              } px-1.5 py-0.5 rounded-full bg-[#202C33] border border-[#2A3942] text-xs shadow cursor-pointer`}
                            >
                              {reaction}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Context Preview Bar */}
                {replyingTo && (
                  <div className="px-4 py-2 bg-[#182229] border-t border-[#2A3942] flex items-center justify-between gap-3">
                    <div className="flex-1 px-3 py-1.5 rounded bg-[#202C33] border-l-4 border-[#00A884] text-xs min-w-0">
                      <div className="font-semibold text-[#00A884]">
                        {replyingTo.sender}
                      </div>
                      <div className="text-[#8696A0] truncate">{replyingTo.text}</div>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="p-1.5 text-[#8696A0] hover:text-[#E9EDEF] cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {/* Emoji Picker Popover */}
                {emojiPickerOpen && (
                  <div className="px-4 py-3 bg-[#202C33] border-t border-[#2A3942] flex flex-wrap items-center gap-2">
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setMessageInput((prev) => prev + emoji);
                          inputRef.current?.focus();
                        }}
                        className="w-8 h-8 rounded hover:bg-[#2A3942] text-lg flex items-center justify-center transition-colors cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Authentic WhatsApp Attachment Pop-up Menu */}
                {attachMenuOpen && (
                  <div className="absolute bottom-[70px] left-12 w-56 py-2 bg-[#233138] rounded-xl shadow-2xl border border-[#2A3942] z-30 text-sm text-[#D1D7DB] space-y-0.5">
                    <button
                      onClick={() =>
                        handleSendAttachmentPreset(
                          'binary',
                          'Cargo.toml',
                          'Manifes Cargo.toml (x86_64-pc-windows-msvc · 32 MB RAM)'
                        )
                      }
                      className="w-full px-4 py-2.5 hover:bg-[#182229] flex items-center gap-3 cursor-pointer"
                    >
                      <FileText className="w-5 h-5 text-[#7F66FF]" />
                      <span>Dokumen (Cargo.toml)</span>
                    </button>
                    <button
                      onClick={() =>
                        handleSendAttachmentPreset(
                          'document',
                          'build-exe.bat',
                          'Script 1-klik kompilasi whatsapp-rust.exe untuk Windows'
                        )
                      }
                      className="w-full px-4 py-2.5 hover:bg-[#182229] flex items-center gap-3 cursor-pointer"
                    >
                      <Terminal className="w-5 h-5 text-[#00A884]" />
                      <span>Script Build (.bat)</span>
                    </button>
                    <button
                      onClick={() =>
                        handleSendAttachmentPreset(
                          'document',
                          'benchmark-rust-vs-electron.png',
                          'Perbandingan RAM: WhatsApp Native Rust (24.2 MB) vs Electron (648 MB)'
                        )
                      }
                      className="w-full px-4 py-2.5 hover:bg-[#182229] flex items-center gap-3 cursor-pointer"
                    >
                      <ImageIcon className="w-5 h-5 text-[#007BFC]" />
                      <span>Foto &amp; Benchmark</span>
                    </button>
                    <button
                      onClick={() => {
                        setAttachMenuOpen(false);
                        handleDownloadExeBundle();
                      }}
                      className="w-full px-4 py-2.5 hover:bg-[#182229] flex items-center gap-3 text-[#00A884] font-medium cursor-pointer"
                    >
                      <Download className="w-5 h-5" />
                      <span>Unduh Paket .exe</span>
                    </button>
                  </div>
                )}

                {/* Authentic WhatsApp Bottom Composer Bar (62px, #202C33) */}
                <form
                  onSubmit={handleSendMessage}
                  className="min-h-[62px] px-4 py-2.5 bg-[#202C33] flex items-center gap-2.5 shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setEmojiPickerOpen((v) => !v);
                      setAttachMenuOpen(false);
                    }}
                    title="Emoji"
                    className={`p-2 rounded-full transition-colors cursor-pointer ${
                      emojiPickerOpen
                        ? 'text-[#00A884]'
                        : 'text-[#8696A0] hover:text-[#D1D7DB]'
                    }`}
                  >
                    <Smile className="w-6 h-6" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAttachMenuOpen((v) => !v);
                      setEmojiPickerOpen(false);
                    }}
                    title="Lampirkan"
                    className={`p-2 rounded-full transition-transform cursor-pointer ${
                      attachMenuOpen
                        ? 'text-[#00A884] rotate-45 bg-[#2A3942]'
                        : 'text-[#8696A0] hover:text-[#D1D7DB]'
                    }`}
                  >
                    <Plus className="w-6 h-6" />
                  </button>

                  <input
                    ref={inputRef}
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Ketik pesan"
                    className="flex-1 h-[42px] px-4 rounded-lg bg-[#2A3942] text-[15px] text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none"
                  />

                  {messageInput.trim() ? (
                    <button
                      type="submit"
                      title="Kirim"
                      className="w-10 h-10 rounded-full bg-[#00A884] text-[#111B21] flex items-center justify-center hover:bg-[#06cf9c] transition-colors shrink-0 cursor-pointer"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendVoiceNote}
                      title="Kirim Pesan Suara"
                      className="w-10 h-10 rounded-full text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#2A3942] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  )}
                </form>
              </div>
            ) : null}

            {/* RIGHT-HAND INFO KONTAK / GRUP DRAWER (Authentic WhatsApp Contact Info Panel) */}
            {contactInfoOpen && activeThread && (
              <aside className="w-[340px] lg:w-[380px] bg-[#111B21] border-l border-[#2A3942] flex flex-col overflow-y-auto shrink-0">
                <div className="h-[60px] px-5 bg-[#202C33] flex items-center gap-5 shrink-0">
                  <button
                    onClick={() => setContactInfoOpen(false)}
                    className="text-[#8696A0] hover:text-[#E9EDEF] cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <span className="text-[16px] font-medium text-[#E9EDEF]">
                    {activeThread.isGroup ? 'Info grup' : 'Info kontak'}
                  </span>
                </div>

                {/* Avatar & Identity Card */}
                <div className="p-7 bg-[#111B21] border-b-8 border-[#0B141A] flex flex-col items-center text-center">
                  <div
                    className="w-32 h-32 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-md"
                    style={{ backgroundColor: activeThread.avatarAccent }}
                  >
                    {activeThread.avatarInitials}
                  </div>
                  <h2 className="text-xl font-medium text-[#E9EDEF]">
                    {activeThread.name}
                  </h2>
                  <p className="text-sm text-[#8696A0] mt-1">{activeThread.phone}</p>

                  <div className="flex items-center gap-6 mt-5">
                    <button
                      onClick={() =>
                        setActiveCall({
                          name: activeThread.name,
                          phone: activeThread.phone,
                          initials: activeThread.avatarInitials,
                          accent: activeThread.avatarAccent,
                          isVideo: false,
                        })
                      }
                      className="flex flex-col items-center gap-1.5 text-[#00A884] hover:opacity-80 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full border border-[#2A3942] flex items-center justify-center">
                        <Phone className="w-4 h-4" />
                      </div>
                      <span className="text-xs">Audio</span>
                    </button>
                    <button
                      onClick={() =>
                        setActiveCall({
                          name: activeThread.name,
                          phone: activeThread.phone,
                          initials: activeThread.avatarInitials,
                          accent: activeThread.avatarAccent,
                          isVideo: true,
                        })
                      }
                      className="flex flex-col items-center gap-1.5 text-[#00A884] hover:opacity-80 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full border border-[#2A3942] flex items-center justify-center">
                        <Video className="w-4 h-4" />
                      </div>
                      <span className="text-xs">Video</span>
                    </button>
                    <button
                      onClick={() => {
                        setContactInfoOpen(false);
                        setInChatSearchOpen(true);
                      }}
                      className="flex flex-col items-center gap-1.5 text-[#00A884] hover:opacity-80 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full border border-[#2A3942] flex items-center justify-center">
                        <Search className="w-4 h-4" />
                      </div>
                      <span className="text-xs">Cari</span>
                    </button>
                  </div>
                </div>

                {/* About / Bio */}
                <div className="p-5 border-b-8 border-[#0B141A] space-y-1">
                  <div className="text-xs text-[#8696A0]">Info</div>
                  <div className="text-sm text-[#E9EDEF]">
                    {activeThread.roleOrGroup} · Native Rust Client (.exe)
                  </div>
                </div>

                {/* Signal End-to-End Encryption Verification */}
                <div className="p-5 border-b-8 border-[#0B141A] space-y-2">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-[#8696A0]" />
                    <div className="text-sm text-[#E9EDEF]">Enkripsi</div>
                  </div>
                  <p className="text-xs text-[#8696A0] leading-relaxed">
                    Pesan terenkripsi secara end-to-end dengan protokol Rust{' '}
                    <code className="text-[#E9EDEF]">Noise_XX_25519_AESGCM_SHA256</code>. Kode keamanan 60-digit:
                  </p>
                  <div className="p-3 rounded-lg bg-[#202C33] font-mono text-xs text-[#00A884] tracking-wider text-center">
                    {activeThread.signalFingerprint}
                  </div>
                </div>

                {/* Rust Runtime Footprint Card inside Drawer */}
                <div className="p-5 space-y-3">
                  <div className="text-xs font-medium text-[#00A884]">
                    Performa Native Rust (.exe)
                  </div>
                  <div className="text-xs text-[#8696A0] space-y-1 font-mono tabular-nums">
                    <div>Binary: {rustConfig.binaryName}</div>
                    <div>Target: {rustConfig.targetTriple}</div>
                    <div>RAM Aktif: {buildMetrics.idleRamMb} MB / {rustConfig.ramLimitMb} MB</div>
                  </div>
                  <button
                    onClick={() => setRailMode('exe-studio')}
                    className="w-full py-2 rounded-lg bg-[#202C33] hover:bg-[#2A3942] text-xs font-medium text-[#00A884] transition-colors cursor-pointer"
                  >
                    Buka Setelan Builder .exe
                  </button>
                </div>
              </aside>
            )}
          </main>
        ) : (
          /* FULL WORKSPACE VIEWS FOR MULTI-DEVICE QR, RUST .EXE STUDIO, AND SOURCE CODE */
          <main className="flex-1 bg-[#0B141A] overflow-y-auto">
            {/* Top Return-to-WhatsApp Bar */}
            <div className="h-[60px] px-6 bg-[#202C33] border-b border-[#2A3942] flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setRailMode('chats')}
                  className="px-3 py-1.5 rounded-lg bg-[#2A3942] hover:bg-[#364852] text-xs font-medium text-[#E9EDEF] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-[#00A884]" />
                  <span>Kembali ke WhatsApp Chat</span>
                </button>
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={() => setRailMode('pairing')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      railMode === 'pairing'
                        ? 'bg-[#00A884] text-[#111B21] font-semibold'
                        : 'text-[#8696A0] hover:text-[#E9EDEF]'
                    }`}
                  >
                    Perangkat Tertaut (QR)
                  </button>
                  <button
                    onClick={() => setRailMode('exe-studio')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      railMode === 'exe-studio'
                        ? 'bg-[#00A884] text-[#111B21] font-semibold'
                        : 'text-[#8696A0] hover:text-[#E9EDEF]'
                    }`}
                  >
                    Builder Rust (.exe)
                  </button>
                  <button
                    onClick={() => setRailMode('source-code')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      railMode === 'source-code'
                        ? 'bg-[#00A884] text-[#111B21] font-semibold'
                        : 'text-[#8696A0] hover:text-[#E9EDEF]'
                    }`}
                  >
                    Kode Sumber Rust ({rustFiles.length} File)
                  </button>
                </div>
              </div>

              <button
                onClick={handleDownloadExeBundle}
                className="px-4 py-2 rounded-full bg-[#00A884] hover:bg-[#06cf9c] text-[#111B21] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Paket Builder .exe</span>
              </button>
            </div>

            {/* VIEW 1: MULTI-DEVICE QR PAIRING */}
            {railMode === 'pairing' && (
              <div className="max-w-5xl mx-auto p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#111B21] border border-[#2A3942] rounded-xl p-6">
                  <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
                    <div className="space-y-2">
                      <h2 className="text-xl font-normal text-[#E9EDEF]">
                        Gunakan WhatsApp di Desktop Native Rust (.exe)
                      </h2>
                      <p className="text-sm text-[#8696A0] leading-relaxed">
                        Tautkan aplikasi <code className="text-[#00A884]">{rustConfig.binaryName}</code> dengan memindai kode QR Multi-Device resmi. Konsumsi RAM tetap di bawah <code className="text-[#00A884]">{rustConfig.ramLimitMb} MB</code>.
                      </p>
                    </div>

                    <ol className="space-y-3 text-sm text-[#D1D7DB]">
                      <li>1. Buka WhatsApp di telepon Anda</li>
                      <li>
                        2. Ketuk <strong>Menu</strong> atau <strong>Setelan</strong> dan pilih <strong>Perangkat tertaut</strong>
                      </li>
                      <li>
                        3. Ketuk <strong>Tautkan perangkat</strong> lalu arahkan telepon Anda ke layar ini
                      </li>
                    </ol>

                    <div className="pt-4 border-t border-[#2A3942] flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={newDeviceName}
                        onChange={(e) => setNewDeviceName(e.target.value)}
                        className="flex-1 px-3.5 py-2 text-xs bg-[#202C33] text-[#E9EDEF] rounded-lg border border-[#2A3942] focus:outline-none focus:border-[#00A884]"
                      />
                      <button
                        onClick={handlePairSimulatedDevice}
                        className="px-4 py-2 text-xs font-semibold bg-[#00A884] text-[#111B21] rounded-lg hover:bg-[#06cf9c] cursor-pointer"
                      >
                        Simulasikan Tautkan .exe
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-4">
                    <QrCanvas value={qrPairingRef} size={220} />
                    <div className="flex items-center gap-3">
                      <code className="px-3.5 py-1.5 rounded bg-[#202C33] text-sm font-mono font-bold text-[#00A884]">
                        {pairingShortCode}
                      </code>
                      <button
                        onClick={handleRefreshQr}
                        className="px-3 py-1.5 text-xs bg-[#202C33] hover:bg-[#2A3942] rounded text-[#E9EDEF] flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-[#00A884]" />
                        <span>Perbarui QR</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Linked Devices List */}
                <div className="bg-[#111B21] border border-[#2A3942] rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-[#2A3942] flex items-center justify-between">
                    <span className="text-sm font-medium text-[#E9EDEF]">
                      Perangkat Tertaut ({linkedSessions.length})
                    </span>
                  </div>
                  <div className="divide-y divide-[#2A3942]">
                    {linkedSessions.map((sess) => (
                      <div
                        key={sess.id}
                        className="px-6 py-4 flex items-center justify-between hover:bg-[#202C33]/50"
                      >
                        <div>
                          <div className="text-sm font-medium text-[#E9EDEF]">
                            {sess.deviceName}
                          </div>
                          <div className="text-xs text-[#8696A0] mt-0.5 font-mono">
                            {sess.platform} · {sess.arch} · {sess.ramUsageMb.toFixed(1)} MB RAM
                          </div>
                        </div>
                        <button
                          onClick={() => handleRevokeSession(sess.id)}
                          className="px-3 py-1.5 text-xs text-[#F87171] bg-[#202C33] hover:bg-[#2A3942] rounded-lg cursor-pointer"
                        >
                          Keluar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: RUST .EXE STUDIO */}
            {railMode === 'exe-studio' && (
              <div className="max-w-5xl mx-auto p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-[#111B21] border border-[#2A3942]">
                    <div className="text-xs text-[#8696A0]">Ukuran Binary .exe</div>
                    <div className="text-xl font-bold text-[#E9EDEF] font-mono tabular-nums mt-1">
                      {buildMetrics.binaryMb} MB
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#111B21] border border-[#2A3942]">
                    <div className="text-xs text-[#8696A0]">RAM Kerja (Rust)</div>
                    <div className="text-xl font-bold text-[#00A884] font-mono tabular-nums mt-1">
                      {buildMetrics.idleRamMb} MB / {rustConfig.ramLimitMb} MB
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#111B21] border border-[#2A3942]">
                    <div className="text-xs text-[#8696A0]">Hemat vs Electron</div>
                    <div className="text-xl font-bold text-[#E9EDEF] font-mono tabular-nums mt-1">
                      -{buildMetrics.ramSavingsPct}%
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#111B21] border border-[#2A3942]">
                    <div className="text-xs text-[#8696A0]">Target Rekomendasi</div>
                    <div className="text-xs font-bold text-[#00A884] font-mono mt-2 truncate">
                      {rustConfig.targetTriple}
                    </div>
                  </div>
                </div>

                <div className="bg-[#111B21] border border-[#2A3942] rounded-xl p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-[#2A3942] pb-4">
                    <div>
                      <h2 className="text-base font-medium text-[#E9EDEF]">
                        Konfigurasi Kompilasi Native Windows (.exe)
                      </h2>
                      <p className="text-xs text-[#8696A0] mt-0.5">
                        Rekomendasi aktif: <code className="text-[#00A884]">RUST_TARGET_TRIPLE=x86_64-pc-windows-msvc</code> · <code className="text-[#00A884]">RUST_RAM_LIMIT_MB=32</code>
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setRustConfig((prev) => ({
                          ...prev,
                          targetTriple: 'x86_64-pc-windows-msvc',
                          ramLimitMb: 32,
                          guiBackend: 'eframe-glow',
                          optLevel: 'z',
                          lto: true,
                          stripSymbols: true,
                          hideConsoleWindow: true,
                          workerThreads: 2,
                        }));
                        triggerToast('Setelan rekomendasi diterapkan');
                      }}
                      className="px-3 py-1.5 text-xs font-medium bg-[#202C33] text-[#00A884] rounded-lg border border-[#00A884]/40 cursor-pointer"
                    >
                      Gunakan Rekomendasi
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[#8696A0] mb-1">
                        Nama Binary (.exe)
                      </label>
                      <input
                        type="text"
                        value={rustConfig.binaryName}
                        onChange={(e) =>
                          setRustConfig((p) => ({ ...p, binaryName: e.target.value }))
                        }
                        className="w-full px-3.5 py-2 text-xs font-mono bg-[#202C33] text-[#E9EDEF] rounded-lg border border-[#2A3942]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#8696A0] mb-1">
                        RUST_TARGET_TRIPLE
                      </label>
                      <select
                        value={rustConfig.targetTriple}
                        onChange={(e) =>
                          setRustConfig((p) => ({
                            ...p,
                            targetTriple: e.target.value as RustExeConfig['targetTriple'],
                          }))
                        }
                        className="w-full px-3.5 py-2 text-xs font-mono bg-[#202C33] text-[#E9EDEF] rounded-lg border border-[#2A3942]"
                      >
                        <option value="x86_64-pc-windows-msvc">
                          x86_64-pc-windows-msvc (Rekomendasi)
                        </option>
                        <option value="x86_64-pc-windows-gnu">
                          x86_64-pc-windows-gnu
                        </option>
                        <option value="aarch64-pc-windows-msvc">
                          aarch64-pc-windows-msvc
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-[#8696A0] mb-1">
                        RUST_RAM_LIMIT_MB: {rustConfig.ramLimitMb} MB
                      </label>
                      <input
                        type="range"
                        min={24}
                        max={96}
                        value={rustConfig.ramLimitMb}
                        onChange={(e) =>
                          setRustConfig((p) => ({
                            ...p,
                            ramLimitMb: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-[#00A884]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#8696A0] mb-1">
                        Mesin GUI Rust
                      </label>
                      <select
                        value={rustConfig.guiBackend}
                        onChange={(e) =>
                          setRustConfig((p) => ({
                            ...p,
                            guiBackend: e.target.value as RustExeConfig['guiBackend'],
                          }))
                        }
                        className="w-full px-3.5 py-2 text-xs font-mono bg-[#202C33] text-[#E9EDEF] rounded-lg border border-[#2A3942]"
                      >
                        <option value="eframe-glow">
                          eframe / egui Native GPU (~24 MB RAM)
                        </option>
                        <option value="wry-webview2">
                          wry OS WebView2 Hybrid
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#2A3942]">
                    <button
                      onClick={handleSaveRustConfig}
                      disabled={savingConfig}
                      className="px-4 py-2 text-xs font-semibold bg-[#00A884] text-[#111B21] rounded-lg hover:bg-[#06cf9c] cursor-pointer"
                    >
                      {savingConfig ? 'Menyimpan...' : 'Simpan ke Cargo.toml'}
                    </button>
                    <button
                      onClick={handleDownloadExeBundle}
                      className="px-4 py-2 text-xs font-medium bg-[#202C33] hover:bg-[#2A3942] text-[#E9EDEF] rounded-lg border border-[#2A3942] cursor-pointer"
                    >
                      Unduh Script Builder Windows (.ps1)
                    </button>
                  </div>
                </div>

                {/* GitHub Releases (v1.0.0) Pipeline & Assets Card */}
                <div className="bg-[#111B21] border border-[#2A3942] rounded-xl p-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A3942] pb-4">
                    <div>
                      <h2 className="text-base font-medium text-[#E9EDEF]">
                        GitHub Releases — Otomatisasi Build &amp; Publish ({rustConfig.binaryName})
                      </h2>
                      <p className="text-xs text-[#8696A0] mt-0.5">
                        Pipeline <code className="text-[#00A884]">.github/workflows/release-exe.yml</code> mengompilasi binary di <code className="text-[#E9EDEF]">windows-latest</code> dan menerbitkannya langsung ke tab <strong>Releases</strong> di GitHub.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFilePath('.github/workflows/release-exe.yml');
                        setRailMode('source-code');
                      }}
                      className="px-3 py-1.5 text-xs font-medium bg-[#202C33] hover:bg-[#2A3942] text-[#00A884] rounded-lg border border-[#2A3942] cursor-pointer"
                    >
                      Lihat File release-exe.yml
                    </button>
                  </div>

                  {/* Release Assets Preview */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-[#8696A0]">
                      Artefak yang Diterbitkan Otomatis di GitHub Releases (Tag <code className="text-[#00A884]">v1.0.0</code>):
                    </div>
                    <div className="divide-y divide-[#2A3942] rounded-lg border border-[#2A3942] bg-[#0B141A] overflow-hidden text-xs">
                      <div className="px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2.5 font-mono text-[#E9EDEF]">
                          <FileCode className="w-4 h-4 text-[#00A884]" />
                          <span>{rustConfig.binaryName}</span>
                        </div>
                        <span className="font-mono text-[#8696A0]">
                          ~{buildMetrics.binaryMb} MB · Windows x64 Standalone Executable
                        </span>
                      </div>
                      <div className="px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2.5 font-mono text-[#E9EDEF]">
                          <Archive className="w-4 h-4 text-[#00A884]" />
                          <span>whatsapp-rust-win64-portable.zip</span>
                        </div>
                        <span className="font-mono text-[#8696A0]">
                          ZIP Portable ({rustConfig.binaryName} + README.md + SHA256)
                        </span>
                      </div>
                      <div className="px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2.5 font-mono text-[#E9EDEF]">
                          <ShieldCheck className="w-4 h-4 text-[#00A884]" />
                          <span>{rustConfig.binaryName}.sha256</span>
                        </div>
                        <span className="font-mono text-[#8696A0]">
                          Checksum Verifikasi SHA-256
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Step-by-Step Instructions to Publish on GitHub */}
                  <div className="p-4 rounded-lg bg-[#182229] border border-[#2A3942] space-y-2.5 text-xs text-[#D1D7DB]">
                    <div className="font-semibold text-[#00A884]">
                      Cara Menerbitkan Release .exe di Repository GitHub Anda:
                    </div>
                    <ol className="space-y-1.5 list-decimal list-inside text-[#8696A0]">
                      <li>
                        Klik tombol <strong>Sync / Export to GitHub</strong> di pojok kanan atas layar untuk mengirim seluruh kode Rust dan <code className="text-[#E9EDEF]">.github/workflows/release-exe.yml</code> ke repository GitHub Anda.
                      </li>
                      <li>
                        Begitu ter-push ke branch <code className="text-[#E9EDEF]">main</code> / <code className="text-[#E9EDEF]">master</code> (atau saat Anda membuat tag <code className="text-[#E9EDEF]">v1.0.0</code>), GitHub Actions otomatis menjalankan kompilasi Rust di server Windows Microsoft.
                      </li>
                      <li>
                        Dalam ~2 menit, buka tab <strong>Releases</strong> di halaman GitHub Anda — file <code className="text-[#00A884]">{rustConfig.binaryName}</code> siap diunduh langsung!
                      </li>
                    </ol>
                    <div className="pt-2 flex items-center justify-between gap-2">
                      <code className="px-3 py-1.5 rounded bg-[#0B141A] border border-[#2A3942] font-mono text-[11px] text-[#00A884] flex-1 overflow-x-auto">
                        git add . &amp;&amp; git commit -m &quot;release: build whatsapp-rust.exe v1.0.0&quot; &amp;&amp; git tag v1.0.0 &amp;&amp; git push origin main --tags
                      </code>
                      <button
                        onClick={() =>
                          handleCopyText(
                            'git-release-cmd',
                            'git add . && git commit -m "release: build whatsapp-rust.exe v1.0.0" && git tag v1.0.0 && git push origin main --tags',
                            'Perintah Git Release'
                          )
                        }
                        className="px-3 py-1.5 rounded bg-[#202C33] hover:bg-[#2A3942] text-[#E9EDEF] shrink-0 cursor-pointer"
                      >
                        Salin Perintah
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 3: RUST SOURCE CODE EXPLORER */}
            {railMode === 'source-code' && (
              <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 bg-[#111B21] border border-[#2A3942] rounded-xl overflow-hidden divide-y divide-[#2A3942]">
                  {rustFiles.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFilePath(file.path)}
                      className={`w-full text-left p-3.5 transition-colors flex items-center justify-between cursor-pointer ${
                        selectedRustFile?.path === file.path
                          ? 'bg-[#2A3942]'
                          : 'hover:bg-[#202C33]'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-mono font-semibold text-[#E9EDEF]">
                          {file.label}
                        </div>
                        <div className="text-[11px] text-[#8696A0]">
                          {file.description}
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-[#8696A0]">
                        {file.sizeBytes} B
                      </span>
                    </button>
                  ))}
                </div>
                <div className="lg:col-span-8 bg-[#111B21] border border-[#2A3942] rounded-xl overflow-hidden">
                  {selectedRustFile && (
                    <>
                      <div className="px-4 py-3 bg-[#202C33] border-b border-[#2A3942] flex items-center justify-between">
                        <span className="text-xs font-mono text-[#E9EDEF]">
                          {selectedRustFile.path}
                        </span>
                        <button
                          onClick={() =>
                            handleCopyText(
                              selectedRustFile.path,
                              selectedRustFile.content,
                              selectedRustFile.path
                            )
                          }
                          className="px-3 py-1 text-xs bg-[#111B21] hover:bg-[#2A3942] rounded text-[#00A884] cursor-pointer"
                        >
                          {copiedId === selectedRustFile.path ? 'Tersalin' : 'Salin Kode'}
                        </button>
                      </div>
                      <pre className="p-4 text-xs font-mono text-[#E9EDEF] bg-[#0B141A] overflow-x-auto max-h-[520px] overflow-y-auto">
                        <code>{selectedRustFile.content}</code>
                      </pre>
                    </>
                  )}
                </div>
              </div>
            )}
          </main>
        )}
      </div>

      {/* Authentic WhatsApp Voice / Video Call Modal */}
      {activeCall && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#111B21] border border-[#2A3942] rounded-2xl p-6 flex flex-col items-center text-center space-y-5 shadow-2xl">
            <div className="text-xs text-[#8696A0] flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              <span>Terenkripsi secara end-to-end (Rust WebRTC)</span>
            </div>
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg"
              style={{ backgroundColor: activeCall.accent }}
            >
              {activeCall.initials}
            </div>
            <div>
              <h3 className="text-lg font-medium text-[#E9EDEF]">
                {activeCall.name}
              </h3>
              <p className="text-xs text-[#00A884] mt-1">
                {activeCall.isVideo ? 'Memanggil video...' : 'Memanggil suara...'}
              </p>
            </div>
            <div className="flex items-center gap-5 pt-2">
              <button
                onClick={() => setActiveCall(null)}
                className="w-12 h-12 rounded-full bg-[#EA0038] text-white flex items-center justify-center hover:opacity-90 cursor-pointer"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111B21] border border-[#2A3942] rounded-xl overflow-hidden">
            <div className="px-5 py-4 bg-[#202C33] border-b border-[#2A3942] flex items-center justify-between">
              <h3 className="text-base font-medium text-[#E9EDEF]">Chat Baru</h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-[#8696A0] hover:text-[#E9EDEF] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateNewThread} className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-[#8696A0] mb-1">
                  Nama Kontak atau Grup
                </label>
                <input
                  type="text"
                  required
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="Nama kontak"
                  className="w-full px-3.5 py-2 text-sm bg-[#202C33] text-[#E9EDEF] rounded-lg border border-[#2A3942] focus:outline-none focus:border-[#00A884]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#8696A0] mb-1">
                  Nomor Telepon WhatsApp
                </label>
                <input
                  type="text"
                  required
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm font-mono bg-[#202C33] text-[#E9EDEF] rounded-lg border border-[#2A3942] focus:outline-none focus:border-[#00A884]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#8696A0] mb-1">
                  Pesan Pertama
                </label>
                <input
                  type="text"
                  value={newContactFirstMsg}
                  onChange={(e) => setNewContactFirstMsg(e.target.value)}
                  placeholder="Halo..."
                  className="w-full px-3.5 py-2 text-sm bg-[#202C33] text-[#E9EDEF] rounded-lg border border-[#2A3942] focus:outline-none focus:border-[#00A884]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(false)}
                  className="px-4 py-2 text-xs text-[#8696A0] hover:text-[#E9EDEF] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-[#00A884] text-[#111B21] rounded-full hover:bg-[#06cf9c] cursor-pointer"
                >
                  Mulai Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Style Bottom-Left Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 left-[76px] z-50 px-4 py-2.5 rounded-lg bg-[#202C33] border border-[#2A3942] text-xs text-[#E9EDEF] shadow-xl flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#00A884] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
