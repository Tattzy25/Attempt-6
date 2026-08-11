'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Share2, Sparkles, Maximize2, Check, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { extractCallMessage } from './Toast';

export interface GeneratedImageItem {
  id: string;
  keyName: string; // e.g. "image_url_5"
  url: string;
  prompt?: string;
  timestamp: number;
}

interface OutputGridProps {
  images: GeneratedImageItem[];
  isGenerating: boolean;
  expectedOutputCount: number;
  onEditThis: (url: string) => void;
  onSelectLightbox: (url: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const OutputGrid: React.FC<OutputGridProps> = ({
  images,
  isGenerating,
  expectedOutputCount,
  onEditThis,
  onSelectLightbox,
  onShowToast,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleDownload = async (item: GeneratedImageItem) => {
    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `tattoo-design-${item.keyName || item.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      // Surface the resource that came back from the call
      onShowToast(item.url, 'success');
    } catch (err: unknown) {
      // Direct fallback
      window.open(item.url, '_blank');
      const returnedError = extractCallMessage(err);
      if (returnedError) {
        onShowToast(returnedError, 'error');
      }
    }
  };

  const handleShare = async (item: GeneratedImageItem) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TaTTTy Magic Tattoo Design',
          text: item.prompt || 'Generated Tattoo Design',
          url: item.url,
        });
        // navigator.share resolves with nothing displayable — nothing to show
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(item.url);
      setCopiedId(item.id);
      onShowToast('Image URL copied to clipboard!', 'success');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      onShowToast('Failed to copy URL', 'error');
    }
  };

  // Skeleton array for generation state
  const skeletonCount = Math.max(1, expectedOutputCount || 4);
  const skeletons = Array.from({ length: skeletonCount }).map((_, i) => i);

  if (isGenerating) {
    return (
      <div className="w-full space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-900">
              Generating {expectedOutputCount} Variation{expectedOutputCount > 1 ? 's' : ''}...
            </span>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">api.tattty.com</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {skeletons.map((idx) => (
            <div
              key={`skeleton-${idx}`}
              className="relative aspect-square rounded-2xl bg-zinc-100 border border-zinc-200 overflow-hidden animate-soft-pulse flex flex-col items-center justify-center p-4 text-center"
            >
              <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center mb-2 text-zinc-400">
                <Sparkles className="w-5 h-5 animate-spin text-emerald-600" />
              </div>
              <p className="text-xs font-semibold text-zinc-600">Creating Design #{idx + 1}</p>
              <p className="text-[11px] text-zinc-400 mt-1">Applying fine-line blackwork AI...</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-3">
      {/* Header bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-900">
            Generated Outputs ({images.length})
          </span>
        </div>
        <span className="text-[11px] text-zinc-500">
          Click <strong className="text-zinc-800">Edit</strong> on any result to remix it
        </span>
      </div>

      {/* Dynamic Grid: adapts based on count */}
      <div
        className={`grid gap-3.5 sm:gap-4 ${
          images.length === 1
            ? 'grid-cols-1 max-w-lg mx-auto'
            : images.length === 2
            ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto'
            : images.length <= 4
            ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4'
            : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
        }`}
      >
        <AnimatePresence>
          {images.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25, delay: index * 0.05 }}
              className="group relative bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-xl hover:border-zinc-900 transition-all duration-300 overflow-hidden flex flex-col"
            >
              {/* Badge top corner */}
              <div className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-full bg-zinc-900/90 text-white text-[10px] font-bold tracking-wider uppercase backdrop-blur-sm shadow-sm border border-zinc-700/50">
                #{index + 1}
              </div>

              {/* Expand Button Top Right */}
              <button
                type="button"
                onClick={() => onSelectLightbox(item.url)}
                className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-xl bg-white/90 hover:bg-white text-zinc-800 shadow-md backdrop-blur-sm opacity-90 group-hover:opacity-100 transition-all active:scale-90"
                title="Inspect High-Res Lightbox"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              {/* Main Image View */}
              <div
                className="relative aspect-square bg-zinc-950 overflow-hidden cursor-pointer"
                onClick={() => onSelectLightbox(item.url)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={`Tattoo Design ${index + 1}`}
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Subtle Hover Action Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3 pointer-events-none">
                  <p className="text-[11px] text-zinc-200 font-medium line-clamp-1 mb-1">
                    Click to inspect or remix design
                  </p>
                </div>
              </div>

              {/* Action Toolbar Below Image */}
              <div className="p-2.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between gap-1.5">
                {/* Remix / Edit This Button (Puts into dropzone) */}
                <button
                  type="button"
                  onClick={() => onEditThis(item.url)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all active:scale-95"
                  title="Load into dropzone thumbnail to edit/remix with a new prompt"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white" />
                  <span>Edit This</span>
                </button>

                {/* Share Button */}
                <button
                  type="button"
                  onClick={() => handleShare(item)}
                  className="p-2 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 transition-colors shadow-sm"
                  title="Share or Copy Link"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Download Button */}
                <button
                  type="button"
                  onClick={() => handleDownload(item)}
                  className="p-2 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 transition-colors shadow-sm"
                  title="Download Image"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
