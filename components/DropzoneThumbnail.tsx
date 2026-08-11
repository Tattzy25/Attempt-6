'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DropzoneThumbnailProps {
  image1Url: string | null;
  isConverting: boolean;
  convertUrl: string;
  onConvertImage: (fileOrBase64: File | string) => Promise<void>;
  onClearImage: () => void;
  onError: (msg: string) => void;
}

export const DropzoneThumbnail: React.FC<DropzoneThumbnailProps> = ({
  image1Url,
  isConverting,
  convertUrl,
  onConvertImage,
  onClearImage,
  onError,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        // Still attempt conversion or let server handle
      }
      try {
        await onConvertImage(file);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to convert image';
        onError(msg);
      }
    },
    [onConvertImage, onError]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // reset input
    if (e.target) e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Support clipboard paste for images!
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processFile]);

  return (
    <div className="w-full relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <AnimatePresence mode="wait">
        {image1Url ? (
          /* CONVERTED THUMBNAIL STATE */
          <motion.div
            key="thumbnail"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative flex items-center gap-3 p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-white shadow-sm overflow-hidden"
          >
            {/* Thumbnail Preview */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-700 shrink-0 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image1Url}
                alt="Source Image 1"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1 rounded-md bg-white/90 text-zinc-900 shadow"
                  title="Replace source image"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Info details */}
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-400">
                  Source Image Ready
                </span>
              </div>
              <p className="text-xs text-zinc-300 truncate font-mono">
                {image1Url.length > 45 ? `${image1Url.substring(0, 45)}...` : image1Url}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] font-medium text-zinc-400 hover:text-white underline decoration-zinc-600 transition-colors"
                >
                  Change Image
                </button>
              </div>
            </div>

            {/* Prominent Close X Icon */}
            <button
              type="button"
              onClick={onClearImage}
              className="absolute top-2 right-2 p-1.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all shadow border border-zinc-700/80 active:scale-90"
              title="Remove source image"
              aria-label="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          /* EMPTY DROPZONE STATE */
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex items-center justify-center gap-3 p-3 sm:p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer select-none ${
              isDragOver
                ? 'border-emerald-500 bg-emerald-50/50 shadow-md scale-[1.005]'
                : 'border-zinc-300 hover:border-zinc-800 bg-zinc-50/50 hover:bg-zinc-100/60'
            }`}
          >
            {isConverting ? (
              <div className="flex items-center justify-center gap-2.5 py-1 text-zinc-800 font-medium text-xs sm:text-sm text-center">
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                <span>Uploading to convert.tattty.com...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 text-center w-full py-1">
                <div className="p-2 rounded-xl bg-white border border-zinc-200 shadow-sm text-zinc-800 group-hover:scale-105 transition-transform shrink-0">
                  <Upload className="w-4 h-4 text-zinc-800" />
                </div>
                <div className="text-center sm:text-left flex flex-col items-center sm:items-start gap-0.5">
                  <p className="text-xs sm:text-sm font-semibold text-zinc-900 leading-tight">
                    Drop tattoo reference or sketch <span className="font-normal text-zinc-500">(Optional)</span>
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Click, drag & drop, or paste (Ctrl+V) image to edit
                  </p>
                  {/* 3rd Row - Plain Supported Formats Text */}
                  <p className="text-[10px] font-medium text-zinc-400 tracking-wider uppercase">
                    PNG, JPG, JPEG, WEBP
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
