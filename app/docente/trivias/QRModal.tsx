'use client';

import { useEffect, useRef } from 'react';
import { IconX, IconDownload, IconShare } from '@tabler/icons-react';
import QRCode from 'react-qr-code';

interface QRModalProps {
  isOpen: boolean;
  triviaName: string;
  url: string;
  onClose: () => void;
}

export default function QRModal({ isOpen, triviaName, url, onClose }: QRModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleDownload = () => {
    const svgEl = qrRef.current?.querySelector('svg');
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      ctx?.drawImage(img, 0, 0, 512, 512);
      URL.revokeObjectURL(svgUrl);
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qr-${triviaName.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = pngUrl;
      link.click();
    };
    img.src = svgUrl;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-2xl border border-pink-light w-full max-w-sm p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-ink/40 hover:text-ink/70 hover:bg-pink-light rounded-lg transition"
          aria-label="Cerrar"
        >
          <IconX size={18} />
        </button>

        <div className="flex flex-col items-center text-center gap-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-mint rounded-lg flex items-center justify-center">
              <IconShare size={18} className="text-mint-text" />
            </div>
            <div className="text-left">
              <h2 id="qr-modal-title" className="text-base font-bold text-ink">
                Código QR
              </h2>
              <p className="text-xs text-ink/60 truncate max-w-[180px]">{triviaName}</p>
            </div>
          </div>

          <div
            ref={qrRef}
            className="p-4 bg-white border-2 border-pink-light rounded-lg shadow-inner"
          >
            <QRCode
              value={url}
              size={200}
              bgColor="#ffffff"
              fgColor="#111827"
              level="H"
            />
          </div>

          <p className="text-xs text-ink/40 break-all max-w-[260px]">{url}</p>

          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-coral hover:bg-coral-dark text-white font-semibold rounded-lg transition text-sm"
          >
            <IconDownload size={16} />
            Descargar PNG
          </button>
        </div>
      </div>
    </div>
  );
}