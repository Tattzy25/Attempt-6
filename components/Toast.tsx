'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  message: string | null;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const iconMap = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />,
    info: <Info className="w-4 h-4 text-zinc-800 shrink-0" />,
  };

  const bgMap = {
    success: 'bg-zinc-900 text-white border-zinc-800',
    error: 'bg-red-950 text-red-100 border-red-800',
    info: 'bg-zinc-900 text-zinc-100 border-zinc-800',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 pointer-events-auto"
      >
        <div
          className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border shadow-xl text-xs sm:text-sm font-medium ${bgMap[type]}`}
        >
          <div className="flex items-center gap-2.5">
            {iconMap[type]}
            <span>{message}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
            aria-label="Close notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Extract a human-readable message from an error or arbitrary API response body.
 * Used to surface backend messages consistently across the UI.
 */
export function extractCallMessage(err: unknown): string | null {
  if (!err) return null;
  if (typeof err === 'string') return err;
  const obj = err as Record<string, unknown>;

  // High-priority explicit message fields
  const explicitMessage = obj?.message ?? obj?.msg ?? obj?.detail ?? obj?.error;
  if (typeof explicitMessage === 'string' && explicitMessage.length > 0) {
    return explicitMessage;
  }

  // Next attempt: any "description" field
  if (typeof obj?.description === 'string' && obj.description.length > 0) {
    return obj.description;
  }

  // Final fallback: try to JSON serialize the object itself
  try {
    const json = JSON.stringify(obj);
    if (json.length > 3) {
      return json;
    }
  } catch {
    // ignore
  }

  return null;
}