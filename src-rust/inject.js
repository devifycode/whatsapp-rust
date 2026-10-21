// src-rust/inject.js
// Injected into https://web.whatsapp.com inside the Rust WebView2 (.exe) window.
// Makes WhatsApp Web fill 100% of the native window (removes outer browser margins),
// enforces modern Chromium desktop capabilities, and enables keyboard shortcuts.

(function () {
  'use strict';

  const injectFullBleedStyles = () => {
    if (document.getElementById('wa-rust-native-style')) return;
    const style = document.createElement('style');
    style.id = 'wa-rust-native-style';
    style.textContent = `
      /* Make WhatsApp Web fill 100% of the native .exe window without outer desktop margins */
      #app > div > div[ tabindex="-1" ],
      #app > div > .two,
      ._aigs,
      .app-wrapper-web ._aigs {
        width: 100vw !important;
        max-width: 100vw !important;
        height: 100vh !important;
        max-height: 100vh !important;
        top: 0 !important;
        margin: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
      }

      body {
        background-color: #111B21 !important;
        overflow: hidden !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectFullBleedStyles);
  } else {
    injectFullBleedStyles();
  }

  // Keep observing DOM in case WhatsApp Web re-mounts root container
  const observer = new MutationObserver(() => {
    injectFullBleedStyles();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Keyboard shortcuts for native desktop feel (Ctrl+R to reload)
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
      e.preventDefault();
      window.location.reload();
    }
  });
})();
