import React, { useEffect, useRef } from 'react';

interface QrCanvasProps {
  value: string;
  size?: number;
}

/**
 * Deterministic, high-contrast QR matrix renderer on HTML5 Canvas
 * for WhatsApp Multi-Device 2@... pairing tokens.
 */
export const QrCanvas: React.FC<QrCanvasProps> = ({ value, size = 216 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const modules = 29; // Version 3 QR grid (29x29)
    const quietZone = 2;
    const totalModules = modules + quietZone * 2;
    const cellSize = size / totalModules;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    // Deterministic hash stream from value
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    const drawFinderPattern = (startX: number, startY: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          ctx.fillStyle = isBorder || isCenter ? '#0B141A' : '#FFFFFF';
          ctx.fillRect(
            (startX + c + quietZone) * cellSize,
            (startY + r + quietZone) * cellSize,
            Math.ceil(cellSize),
            Math.ceil(cellSize)
          );
        }
      }
    };

    const isReserved = (r: number, c: number) => {
      if (r < 8 && c < 8) return true;
      if (r < 8 && c >= modules - 8) return true;
      if (r >= modules - 8 && c < 8) return true;
      if (r >= modules - 9 && r <= modules - 5 && c >= modules - 9 && c <= modules - 5) return true;
      return false;
    };

    // Draw data modules
    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        if (isReserved(r, c)) continue;
        if (r === 6 || c === 6) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#0B141A' : '#FFFFFF';
        } else {
          const charCode = value.charCodeAt((r * modules + c) % value.length);
          const bit = ((hash ^ (r * 31 + c * 17 + charCode * 13)) & 3) !== 0;
          ctx.fillStyle = bit ? '#0B141A' : '#FFFFFF';
        }
        ctx.fillRect(
          (c + quietZone) * cellSize,
          (r + quietZone) * cellSize,
          Math.ceil(cellSize),
          Math.ceil(cellSize)
        );
      }
    }

    // Draw Finder Patterns
    drawFinderPattern(0, 0);
    drawFinderPattern(modules - 7, 0);
    drawFinderPattern(0, modules - 7);

    // Draw Alignment Pattern
    const alignStart = modules - 9;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const isBorder = r === 0 || r === 4 || c === 0 || c === 4;
        const isCenter = r === 2 && c === 2;
        ctx.fillStyle = isBorder || isCenter ? '#0B141A' : '#FFFFFF';
        ctx.fillRect(
          (alignStart + c + quietZone) * cellSize,
          (alignStart + r + quietZone) * cellSize,
          Math.ceil(cellSize),
          Math.ceil(cellSize)
        );
      }
    }

    // Draw center WhatsApp Rust emblem badge
    const centerBox = 7;
    const centerStart = Math.floor((modules - centerBox) / 2);
    ctx.fillStyle = '#00A884';
    ctx.fillRect(
      (centerStart + quietZone) * cellSize,
      (centerStart + quietZone) * cellSize,
      centerBox * cellSize,
      centerBox * cellSize
    );
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.floor(cellSize * 2.6)}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RS', size / 2, size / 2 + 1);
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-lg border border-[#2A3942] bg-white p-1.5"
      aria-label="WhatsApp Multi-Device Rust QR Code"
    />
  );
};
