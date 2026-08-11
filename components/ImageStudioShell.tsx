'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Wand2, RefreshCw, Layers, History, Image as ImageIcon, Sliders, ChevronDown, Trash2, ArrowRight, X } from 'lucide-react';
import { DropzoneThumbnail } from './DropzoneThumbnail';
import { OutputGrid, GeneratedImageItem } from './OutputGrid';
import { LightboxModal } from './LightboxModal';
import { Toast, extractCallMessage } from './Toast';

export const ImageStudioShell: React.FC = () => {
  // Configuration State
  const [customerId, setCustomerId] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('customer_id') || params.get('id') || params.get('customer') || '';
    }
    return '';
  });

  const [sourceId, setSourceId] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('source_id') || params.get('source') || 'TaTTTy_Magic';
    }
    return 'TaTTTy_Magic';
  });

  const [outputCount, setOutputCount] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('output') || params.get('count') || '';
    }
    return '';
  });

  const [creditCostPerOutput, setCreditCostPerOutput] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const paramCost = params.get('credit_cost_per_output') || params.get('cost_per_output') || params.get('credit_cost');
      if (paramCost && !isNaN(Number(paramCost))) {
        return Number(paramCost);
      }
    }
    return 0;
  });

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data) {
        if (e.data.credit_cost_per_output !== undefined && e.data.credit_cost_per_output !== null) {
          const cost = Number(e.data.credit_cost_per_output);
          if (!isNaN(cost)) {
            setCreditCostPerOutput(cost);
          }
        }
        const newCustId = e.data.customer_id || e.data.customerId || e.data.customer;
        if (newCustId && typeof newCustId === 'string' && newCustId.trim()) {
          setCustomerId(newCustId.trim());
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const totalClickCost = creditCostPerOutput * (parseInt(outputCount, 10) || 1);

  const [negativePrompt, setNegativePrompt] = useState('blurry, low quality');

  const [workerUrl, setWorkerUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('worker_url') || 'https://api.tattty.com/';
    }
    return 'https://api.tattty.com/';
  });

  const [convertUrl, setConvertUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('convert_url') || 'https://convert.tattty.com/';
    }
    return 'https://convert.tattty.com/';
  });

  // Interactive Prompt & Image State
  const [prompt, setPrompt] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('prompt') || '';
    }
    return '';
  });

  const [image1, setImage1] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('image1') || params.get('image') || null;
    }
    return null;
  });

  // Statuses & Loading
  const [isConverting, setIsConverting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Results & Inspector
  const [results, setResults] = useState<GeneratedImageItem[]>([]);
  const [selectedLightboxUrl, setSelectedLightboxUrl] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const promptInputRef = useRef<HTMLTextAreaElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };


  // Convert uploaded image to convert.tattty.com URL
  const handleConvertImage = async (fileOrBase64: File | string) => {
    setIsConverting(true);

    try {
      let base64String = '';
      let filename = 'uploaded_image.png';

      if (fileOrBase64 instanceof File) {
        filename = fileOrBase64.name;
        base64String = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(fileOrBase64);
        });
      } else {
        base64String = fileOrBase64;
      }

      // Call Next.js proxy route for convert.tattty.com
      const res = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          convertUrl,
          payload: {
            image: base64String,
            filename,
          },
        }),
      });

      const data = await res.json();

      if (data && data.url) {
        setImage1(data.url);
        // Show exactly what the convert call sent back (any message field, otherwise the returned url itself)
        showToast(extractCallMessage(data) ?? data.url, 'success');
      } else if (typeof data === 'string' && data.startsWith('http')) {
        setImage1(data);
        // The response itself is the url — show it as-is
        showToast(data, 'success');
      } else {
        // Fallback: use data URI if convert endpoint failed to return url
        setImage1(base64String);
        // Surface whatever the call actually returned. Nothing displayable means nothing shown
        const returnedMessage = extractCallMessage(data);
        if (returnedMessage) {
          showToast(returnedMessage, res.ok ? 'info' : 'error');
        }
      }
    } catch (err: unknown) {
      console.error('Convert Error:', err);
      // Surface what came back from the failed call. Nothing displayable means nothing shown
      const returnedError = extractCallMessage(err);
      if (returnedError) {
        showToast(returnedError, 'error');
      }
    } finally {
      setIsConverting(false);
    }
  };

  // Main Worker Call Trigger
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setIsGenerating(true);

    // Build exact payload
    const payload = {
      customer_id: customerId,
      prompt: prompt || 'Turn this into a fine-line blackwork tattoo design',
      negative_prompt: negativePrompt,
      source_id: sourceId,
      output: outputCount,
      image1: image1 || '',
    };

    try {
      const res = await fetch('/api/worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerUrl,
          payload,
        }),
      });

      const data = await res.json();
      const returnedMessage = extractCallMessage(data);

      // Non-OK response: surface exactly what the call sent back
      if (!res.ok) {
        showToast(returnedMessage ?? `HTTP ${res.status}`, 'error');
        return;
      }

      // Dynamic Extraction of Image URLs from Response Object
      const extractedImages: GeneratedImageItem[] = [];

      if (data && typeof data === 'object') {
        const timestamp = Date.now();
        Object.entries(data).forEach(([key, val]) => {
          if (typeof val === 'string' && val.trim().length > 0) {
            // Check if value is a URL or matches image key
            if (
              key.toLowerCase().startsWith('image_url') ||
              key.toLowerCase().startsWith('url') ||
              key.toLowerCase().startsWith('image') ||
              val.startsWith('http') ||
              val.startsWith('data:image')
            ) {
              extractedImages.push({
                id: `${key}-${timestamp}`,
                keyName: key,
                url: val,
                prompt: payload.prompt,
                timestamp,
              });
            }
          }
        });

        // Also check if data contains an array property like "images" or "data"
        if (extractedImages.length === 0) {
          if (Array.isArray(data)) {
            data.forEach((item, idx) => {
              const url = typeof item === 'string' ? item : item?.url || item?.image;
              if (url) {
                extractedImages.push({
                  id: `img-${idx}-${timestamp}`,
                  keyName: `image_url_${idx + 1}`,
                  url,
                  prompt: payload.prompt,
                  timestamp,
                });
              }
            });
          }
        }
      }

      if (extractedImages.length > 0) {
        setResults(extractedImages);
        // Prefer the message returned by the worker. Otherwise surface the count derived from the response
        showToast(
          returnedMessage ?? `${extractedImages.length} output design(s)`,
          'success'
        );
      } else if (returnedMessage) {
        // No image keys came back — show whatever the response did return
        showToast(returnedMessage, 'info');
      }
    } catch (err: unknown) {
      console.error('Worker Call Error:', err);
      // Surface what came back from the failed call. Nothing displayable means nothing shown
      const returnedError = extractCallMessage(err);
      if (returnedError) {
        showToast(returnedError, 'error');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Jump generated image right back into the dropzone thumbnail for editing!
  const handleEditThis = (url: string) => {
    setImage1(url);

    // Smooth focus back to prompt input
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      promptInputRef.current?.focus();
    }, 300);
  };

  const presetStyleChips = [
    { label: 'Fine-line Blackwork', prompt: 'Turn this into a fine-line blackwork tattoo design' },
    { label: 'Micro-Realism', prompt: 'Single needle micro-realism tattoo with high contrast shading' },
    { label: 'Japanese Irezumi', prompt: 'Traditional Japanese irezumi wave and dragon tattoo motif' },
    { label: 'Neo-Traditional', prompt: 'Neo-traditional tattoo style with clean dark linework' },
    { label: 'Geometric Dotwork', prompt: 'Sacred geometry mandala tattoo with intricate stipple dotwork' },
    { label: 'Chicano Script', prompt: 'Custom Chicano lettering script tattoo style' },
  ];

  return (
    <div ref={topRef} className="w-full max-w-5xl mx-auto px-2.5 sm:px-4 py-3 sm:py-6 space-y-4">
      {/* Top Utility Bar */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-zinc-100">
        <button
          type="button"
          onClick={() => setIsGalleryOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer border border-zinc-800"
        >
          <ImageIcon className="w-4 h-4 text-emerald-400" />
          <span>My Gallery</span>
        </button>
      </div>

      {/* Main Interactive Studio Shell Card */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl p-3 sm:p-5 space-y-3.5 relative overflow-hidden">
        {/* Prompt Input Form - Compact Padding for Mobile */}
        <form onSubmit={handleGenerate} className="space-y-3">
          <div className="relative rounded-2xl border-2 border-zinc-900 bg-white shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-zinc-900 transition-all overflow-hidden">
            <textarea
              ref={promptInputRef}
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                image1
                  ? "Describe modifications (e.g., 'Add fine-line shading', 'Make it darker')..."
                  : "Type tattoo design prompt (e.g., 'Fine-line blackwork snake wrapped around a dagger')..."
              }
              className="w-full px-3 py-2.5 sm:px-3.5 sm:py-3 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none resize-none bg-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleGenerate();
                }
              }}
            />

            {/* Input Action Controls */}
            <div className="flex items-center justify-between px-3 py-2 bg-zinc-50/80 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1 text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Options</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                />
              </button>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline">
                  Ctrl+Enter
                </span>
                <button
                  type="submit"
                  disabled={isGenerating || isConverting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-emerald-600 text-white font-semibold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Generate ({outputCount})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Advanced collapsible drawer */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200 text-xs space-y-2 overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-zinc-700 text-[11px] mb-1">
                      Negative Prompt
                    </label>
                    <input
                      type="text"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 text-xs bg-white focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-zinc-700 text-[11px] uppercase tracking-wider">
                        Output
                      </label>
                      <span className="px-2 py-0.5 rounded-md bg-zinc-900 text-white font-mono text-[11px] font-bold">
                        Click Cost {totalClickCost}
                      </span>
                    </div>
                    <div className="p-1 bg-zinc-100 rounded-xl border border-zinc-200 flex items-center gap-1 shadow-inner">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                        const isSelected = outputCount === num.toString();
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setOutputCount(num.toString())}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all duration-150 text-center select-none cursor-pointer ${
                              isSelected
                                ? 'bg-zinc-900 text-white shadow-xs scale-[1.02]'
                                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
                            }`}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Dropzone / Source Image Area - Moved Below Text Input */}
        <DropzoneThumbnail
          image1Url={image1}
          isConverting={isConverting}
          convertUrl={convertUrl}
          onConvertImage={handleConvertImage}
          onClearImage={() => {
            setImage1(null);
          }}
          onError={(msg) => showToast(msg, 'error')}
        />

        {/* Preset Style Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 shrink-0 mr-1">
            Presets:
          </span>
          {presetStyleChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPrompt(chip.prompt)}
              className="shrink-0 px-2.5 py-1 rounded-full bg-zinc-100 hover:bg-zinc-900 hover:text-white border border-zinc-200/80 text-zinc-700 text-[11px] font-medium transition-all active:scale-95"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Output Grid Section */}
      <OutputGrid
        images={results}
        isGenerating={isGenerating}
        expectedOutputCount={parseInt(outputCount, 10) || 4}
        onEditThis={handleEditThis}
        onSelectLightbox={(url) => setSelectedLightboxUrl(url)}
        onShowToast={showToast}
      />

      {/* Lightbox Modal */}
      <LightboxModal
        imageUrl={selectedLightboxUrl}
        onClose={() => setSelectedLightboxUrl(null)}
        onEditThis={handleEditThis}
        onCopyUrl={(url) => {
          // Clipboard success resolves with nothing displayable — only surface what comes back if the call fails
          navigator.clipboard.writeText(url).catch((err: unknown) => {
            const returnedError = extractCallMessage(err);
            if (returnedError) {
              showToast(returnedError, 'error');
            }
          });
        }}
        onDownload={async (url) => {
          try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = 'tattty-design.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
            // Surface the resource that came back from the call
            showToast(url, 'success');
          } catch (err: unknown) {
            window.open(url, '_blank');
            const returnedError = extractCallMessage(err);
            if (returnedError) {
              showToast(returnedError, 'error');
            }
          }
        }}
      />

      {/* Global Floating Toast Notifications */}
      <Toast
        message={toast?.message || null}
        type={toast?.type}
        onClose={() => setToast(null)}
      />

      {/* Full Screen Gallery Overlay */}
      <AnimatePresence>
        {isGalleryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-5"
            onClick={() => setIsGalleryOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-5xl bg-zinc-900 rounded-3xl p-3 sm:p-5 border border-zinc-800 shadow-2xl flex flex-col space-y-3"
            >
              <div className="flex items-center justify-between px-1 text-white">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-white">My Gallery</h2>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      Customer ID: {customerId}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGalleryOpen(false)}
                  className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                  aria-label="Close Gallery"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="w-full overflow-hidden rounded-2xl bg-white border border-zinc-800 shadow-inner">
                <iframe
                  src={`https://my-gallery.tattty.com/?customerId=${encodeURIComponent(customerId)}`}
                  width="100%"
                  height="700px"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-downloads allow-forms"
                  className="w-full h-[700px] max-h-[75vh] border-0"
                  title="My Gallery"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
