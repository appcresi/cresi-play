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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          aria-label="Cerrar"
        >
          <IconX size={18} />
        </button>

        <div className="flex flex-col items-center text-center gap-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
              <IconShare size={18} className="text-indigo-600" />
            </div>
            <div className="text-left">
              <h2 id="qr-modal-title" className="text-base font-bold text-gray-900">
                Código QR
              </h2>
              <p className="text-xs text-gray-500 truncate max-w-[180px]">{triviaName}</p>
            </div>
          </div>

          <div
            ref={qrRef}
            className="p-4 bg-white border-2 border-gray-200 rounded-2xl shadow-inner"
          >
            <QRCode
              value={url}
              size={200}
              bgColor="#ffffff"
              fgColor="#111827"
              level="H"
            />
          </div>

          <p className="text-xs text-gray-400 break-all max-w-[260px]">{url}</p>

          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition text-sm"
          >
            <IconDownload size={16} />
            Descargar PNG
          </button>
        </div>
      </div>
    </div>
  );
}