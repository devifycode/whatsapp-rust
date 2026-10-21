// src-rust/inject.js
// Injected into https://web.whatsapp.com inside the Rust WebView2 (.exe) window.
// 1. Makes WhatsApp Web fill 100% of the native window (removes outer browser margins).
// 2. Enables smooth Browser-like Zoom In / Out via Ctrl + Scroll (Mouse Wheel),
//    Ctrl + Plus (+/=), Ctrl + Minus (-), and Ctrl + 0 (Reset to 100%),
//    persisting the zoom level across restarts and showing a sleek zoom HUD indicator.

(function () {
  'use strict';

  const STORAGE_KEY = 'wa_rust_zoom_factor';
  const MIN_ZOOM = 0.5;  // 50%
  const MAX_ZOOM = 2.0;  // 200%
  const WHEEL_STEP = 0.05; // 5% per Ctrl + Scroll notch
  const KEY_STEP = 0.10;   // 10% per Ctrl + +/-

  let currentZoom = 1.0;
  try {
    const saved = parseFloat(localStorage.getItem(STORAGE_KEY) || '1.0');
    if (!Number.isNaN(saved) && saved >= MIN_ZOOM && saved <= MAX_ZOOM) {
      currentZoom = Math.round(saved * 100) / 100;
    }
  } catch (_) {}

  let hudTimeout = null;

  const sendZoomToRust = (factor) => {
    try {
      if (window.ipc && typeof window.ipc.postMessage === 'function') {
        window.ipc.postMessage('zoom:' + factor.toFixed(2));
      }
    } catch (_) {}
  };

  const showZoomHud = (factor) => {
    if (!document.body) return;
    let hud = document.getElementById('wa-rust-zoom-hud');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'wa-rust-zoom-hud';
      hud.style.cssText = [
        'position: fixed',
        'top: 14px',
        'right: 18px',
        'z-index: 2147483647',
        'background: rgba(32, 44, 51, 0.96)',
        'color: #E9EDEF',
        'border: 1px solid #2A3942',
        'border-radius: 8px',
        'padding: 6px 10px',
        'font-family: "Segoe UI", system-ui, sans-serif',
        'font-size: 12px',
        'font-weight: 500',
        'display: flex',
        'align-items: center',
        'gap: 8px',
        'box-shadow: 0 4px 16px rgba(0,0,0,0.45)',
        'transition: opacity 0.18s ease',
        'user-select: none',
      ].join(';');

      const label = document.createElement('span');
      label.id = 'wa-rust-zoom-label';
      label.style.minWidth = '42px';
      label.style.textAlign = 'center';
      label.style.color = '#00A884';
      label.style.fontWeight = '700';

      const btnStyle = [
        'background: #111B21',
        'color: #E9EDEF',
        'border: 1px solid #2A3942',
        'border-radius: 4px',
        'padding: 2px 7px',
        'cursor: pointer',
        'font-size: 11px',
      ].join(';');

      const btnOut = document.createElement('button');
      btnOut.textContent = '−';
      btnOut.style.cssText = btnStyle;
      btnOut.onclick = (e) => {
        e.stopPropagation();
        applyZoom(currentZoom - KEY_STEP, true);
      };

      const btnIn = document.createElement('button');
      btnIn.textContent = '+';
      btnIn.style.cssText = btnStyle;
      btnIn.onclick = (e) => {
        e.stopPropagation();
        applyZoom(currentZoom + KEY_STEP, true);
      };

      const btnReset = document.createElement('button');
      btnReset.textContent = 'Reset';
      btnReset.style.cssText = btnStyle;
      btnReset.onclick = (e) => {
        e.stopPropagation();
        applyZoom(1.0, true);
      };

      hud.appendChild(btnOut);
      hud.appendChild(label);
      hud.appendChild(btnIn);
      hud.appendChild(btnReset);
      document.body.appendChild(hud);
    }

    const labelEl = document.getElementById('wa-rust-zoom-label');
    if (labelEl) {
      labelEl.textContent = Math.round(factor * 100) + '%';
    }
    hud.style.opacity = '1';
    hud.style.pointerEvents = 'auto';

    if (hudTimeout) clearTimeout(hudTimeout);
    hudTimeout = setTimeout(() => {
      if (hud) {
        hud.style.opacity = '0';
        hud.style.pointerEvents = 'none';
      }
    }, 1800);
  };

  const applyZoom = (nextZoom, showIndicator) => {
    const clamped = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, Math.round(nextZoom * 100) / 100)
    );
    currentZoom = clamped;
    try {
      localStorage.setItem(STORAGE_KEY, String(currentZoom));
    } catch (_) {}

    sendZoomToRust(currentZoom);
    if (showIndicator) {
      showZoomHud(currentZoom);
    }
  };

  const injectFullBleedStyles = () => {
    if (document.getElementById('wa-rust-native-style')) return;
    const style = document.createElement('style');
    style.id = 'wa-rust-native-style';
    style.textContent = `
      /* Make WhatsApp Web fill 100% of the native .exe window without outer desktop margins */
      html, body, #app {
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background-color: #111B21 !important;
        overflow: hidden !important;
      }

      #app > div > div[tabindex="-1"],
      #app > div > .two,
      ._aigs,
      .app-wrapper-web ._aigs {
        width: 100% !important;
        max-width: 100% !important;
        height: 100% !important;
        max-height: 100% !important;
        top: 0 !important;
        margin: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectFullBleedStyles();
      if (currentZoom !== 1.0) {
        sendZoomToRust(currentZoom);
      }
    });
  } else {
    injectFullBleedStyles();
    if (currentZoom !== 1.0) {
      sendZoomToRust(currentZoom);
    }
  }

  const observer = new MutationObserver(() => {
    injectFullBleedStyles();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // 1. Ctrl + Mouse Wheel (Scroll) Auto Zoom In / Out (Capture phase so WhatsApp chat scroll cannot block it)
  window.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY < 0 ? WHEEL_STEP : -WHEEL_STEP;
        applyZoom(currentZoom + delta, true);
      }
    },
    { capture: true, passive: false }
  );

  // 2. Keyboard Shortcuts: Ctrl + (+/=), Ctrl + (-), Ctrl + 0, and Ctrl + R
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd') {
          e.preventDefault();
          e.stopPropagation();
          applyZoom(currentZoom + KEY_STEP, true);
        } else if (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract') {
          e.preventDefault();
          e.stopPropagation();
          applyZoom(currentZoom - KEY_STEP, true);
        } else if (e.key === '0' || e.code === 'Numpad0') {
          e.preventDefault();
          e.stopPropagation();
          applyZoom(1.0, true);
        } else if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          window.location.reload();
        }
      }
    },
    { capture: true }
  );
})();
