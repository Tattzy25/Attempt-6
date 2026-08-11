'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Share2, Sparkles, ExternalLink, Copy, Check } from 'lucide-react';

interface LightboxModalProps {
  imageUrl: string | null;
  onClose: () => void;
  onEditThis: (url: string) => void;
  onCopyUrl: (url: string) => void;
  onDownload: (url: string) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  imageUrl,
  onClose,
  onEditThis,
  onCopyUrl,
  onDownload,
}) => {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!imageUrl) return null;

  const handleCopy = () => {
    onCopyUrl(imageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-zinc-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50/80">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                High-Res Design Inspector
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Image Container */}
          <div className="relative flex-1 bg-zinc-950 flex items-center justify-center p-2 min-h-[300px] overflow-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="High resolution generated output"
              className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-xl"
            />
          </div>

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4 bg-white border-t border-zinc-100">
            <button
              onClick={() => {
                onEditThis(imageUrl);
                onClose();
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 text-white font-medium text-xs sm:text-sm hover:bg-zinc-800 active:scale-95 transition-all shadow-md hover:shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Edit / Remix This Image</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium transition-colors"
                title="Copy Image URL"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied URL' : 'Copy Link'}</span>
              </button>

              <button
                onClick={() => onDownload(imageUrl)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium transition-colors"
                title="Download Image"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>

              <a
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
                title="Open directly in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
