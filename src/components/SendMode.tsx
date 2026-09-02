import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { compressAndChunkFile, formatBytes } from '../utils/dataUtils';
import { UploadCloud, X, RotateCcw, Zap, Sparkles, ShieldCheck, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { cn } from '../utils/cn';
import { QualityMode } from '../types';

export default function SendMode() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<QualityMode>('original');
  const [chunks, setChunks] = useState<string[]>([]);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  
  const [prepProgress, setPrepProgress] = useState(0);
  const [prepStatus, setPrepStatus] = useState('');
  const [fps, setFps] = useState(5); // 5 FPS is optimal for camera recognition

  const frameRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (file) {
      setPrepProgress(0);
      setPrepStatus('Initializing...');
      compressAndChunkFile(
        file,
        quality,
        (p, s) => {
          setPrepProgress(p);
          setPrepStatus(s);
        }
      ).then(({ chunks: c, originalSize: oSize, compressedSize: cSize }) => {
        setChunks(c);
        setOriginalSize(oSize);
        setCompressedSize(cSize);
        setCurrentChunkIndex(0);
        setIsTransmitting(false);
      });
    }
  }, [file, quality]);

  useEffect(() => {
    if (!isTransmitting || chunks.length === 0) return;

    const intervalMs = 1000 / fps;

    const updateLoop = (timestamp: number) => {
      if (timestamp - lastUpdateRef.current > intervalMs) {
        setCurrentChunkIndex((prev) => (prev + 1) % chunks.length);
        lastUpdateRef.current = timestamp;
      }
      frameRef.current = requestAnimationFrame(updateLoop);
    };

    frameRef.current = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [isTransmitting, chunks.length, fps]);

  useEffect(() => {
    if (chunks.length > 0 && chunks[currentChunkIndex]) {
      QRCode.toDataURL(chunks[currentChunkIndex], {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 340,
        color: {
          dark: '#1E293B',
          light: '#FFFFFF',
        },
      }).then((url) => setQrDataUrl(url));
    }
  }, [currentChunkIndex, chunks]);

  const estimatedTimeSec = chunks.length > 0 ? Math.ceil(chunks.length / fps) : 0;

  return (
    <div className="flex flex-col items-center justify-start w-full max-w-2xl mx-auto py-2">
      {!file ? (
        <div className="w-full flex flex-col items-center">
          {/* Quality Mode Selector before upload */}
          <div className="w-full max-w-md mb-6 bg-[var(--lego-card)] border-4 border-[var(--lego-border)] rounded-2xl p-4 shadow-[6px_6px_0px_var(--lego-border)]">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-[#FFD500]" />
              <span className="font-black uppercase text-sm tracking-wide text-[var(--lego-text)]">
                Image Transfer Quality
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setQuality('original')}
                className={cn(
                  "py-2.5 px-2 rounded-xl text-xs font-black uppercase border-3 transition-all flex flex-col items-center gap-1 text-center",
                  quality === 'original'
                    ? "bg-[#0057A6] border-[#003B73] text-white shadow-none translate-y-0.5"
                    : "bg-[var(--lego-bg)] border-[var(--lego-border)] text-[var(--lego-text)] hover:-translate-y-0.5"
                )}
              >
                <ShieldCheck className="w-4 h-4 text-[#FFD500]" />
                <span>100% Original</span>
                <span className="text-[9px] font-medium opacity-80 lowercase">(lossless)</span>
              </button>

              <button
                type="button"
                onClick={() => setQuality('hd')}
                className={cn(
                  "py-2.5 px-2 rounded-xl text-xs font-black uppercase border-3 transition-all flex flex-col items-center gap-1 text-center",
                  quality === 'hd'
                    ? "bg-[#0057A6] border-[#003B73] text-white shadow-none translate-y-0.5"
                    : "bg-[var(--lego-bg)] border-[var(--lego-border)] text-[var(--lego-text)] hover:-translate-y-0.5"
                )}
              >
                <Zap className="w-4 h-4 text-[#FFD500]" />
                <span>HD (1080p)</span>
                <span className="text-[9px] font-medium opacity-80 lowercase">(balanced)</span>
              </button>

              <button
                type="button"
                onClick={() => setQuality('fast')}
                className={cn(
                  "py-2.5 px-2 rounded-xl text-xs font-black uppercase border-3 transition-all flex flex-col items-center gap-1 text-center",
                  quality === 'fast'
                    ? "bg-[#0057A6] border-[#003B73] text-white shadow-none translate-y-0.5"
                    : "bg-[var(--lego-bg)] border-[var(--lego-border)] text-[var(--lego-text)] hover:-translate-y-0.5"
                )}
              >
                <RotateCcw className="w-4 h-4 text-[#FFD500]" />
                <span>Fast Demo</span>
                <span className="text-[9px] font-medium opacity-80 lowercase">(compact)</span>
              </button>
            </div>
          </div>

          <div
            className="w-full max-w-md aspect-square bg-[var(--lego-card)] rounded-2xl border-4 border-[var(--lego-border)] shadow-[8px_8px_0px_var(--lego-border)] flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:-translate-y-1 hover:shadow-[10px_10px_0px_var(--lego-border)] active:translate-y-2 active:shadow-none transition-all group"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input
              id="file-upload"
              type="file"
              accept="image/*, audio/*"
              className="hidden"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) {
                  setFile(selectedFile);
                }
              }}
            />
            <div className="bg-[#FFD500] p-6 rounded-full border-4 border-[var(--lego-border)] shadow-[4px_4px_0px_var(--lego-border)] mb-6 group-hover:rotate-12 transition-transform duration-300">
              <UploadCloud className="w-10 h-10 text-[#2B2B2B]" strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black text-[var(--lego-text)] mb-2 uppercase">Select Photo / File</h3>
            <p className="font-medium text-[var(--lego-muted)]">
              Beams directly using QR light stream. {quality === 'original' ? '100% original quality preserved!' : ''}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center w-full max-w-md">
          {/* File Info Bar */}
          <div className="w-full mb-3 bg-[var(--lego-card)] border-3 border-[var(--lego-border)] rounded-xl p-3 shadow-[4px_4px_0px_var(--lego-border)] flex items-center justify-between transition-colors">
            <div className="flex flex-col overflow-hidden">
              <span className="font-black text-sm truncate uppercase text-[var(--lego-text)]">
                {file.name}
              </span>
              <span className="text-xs font-semibold text-[var(--lego-muted)]">
                {formatBytes(originalSize || file.size)} • {quality === 'original' ? 'Lossless Full Quality' : quality.toUpperCase()}
              </span>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setChunks([]);
                setIsTransmitting(false);
              }}
              className="p-1.5 bg-red-100 hover:bg-red-200 border-2 border-red-500 text-red-700 rounded-lg transition-colors"
              title="Change File"
            >
              <X className="w-4 h-4" strokeWidth={3} />
            </button>
          </div>

          {/* LEGO Style Display Card */}
          <div className="relative w-full bg-[var(--lego-card)] rounded-2xl border-4 border-[var(--lego-border)] shadow-[8px_8px_0px_var(--lego-border)] p-4 flex flex-col items-center overflow-visible transition-colors duration-300">
            {/* Stud Decoration Header */}
            <div className="absolute -top-3 left-4 right-4 flex justify-around">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-6 h-4 bg-[var(--lego-card)] border-4 border-[var(--lego-border)] border-b-0 rounded-t-md transition-colors duration-300" />
              ))}
            </div>

            <div className="relative mt-4 bg-white rounded-xl border-4 border-[var(--lego-border)] flex items-center justify-center min-h-[320px] min-w-[320px] w-full aspect-square overflow-hidden shadow-inner">
              {chunks.length > 0 && qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Drop Stream"
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="w-full max-w-[240px] flex flex-col items-center text-[var(--lego-text)]">
                  <div className="w-12 h-12 border-8 border-slate-200 border-t-[#D01012] rounded-full animate-spin mb-6"></div>
                  <div className="font-black uppercase tracking-wide mb-3">{prepStatus}</div>
                  <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden border-2 border-[var(--lego-border)] shadow-inner">
                    <div
                      className="h-full bg-[#00A650] transition-all duration-300 ease-out"
                      style={{ width: `${prepProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Status indicator */}
            {chunks.length > 0 && (
              <div className="mt-4 w-full flex items-center justify-between bg-[var(--lego-bg)] border-2 border-[var(--lego-border)] p-2.5 rounded-xl transition-colors duration-300">
                <div className="flex items-center gap-2 font-bold text-[var(--lego-text)] px-2">
                  <span className={cn("w-3 h-3 rounded-full border-2 border-[var(--lego-border)]", isTransmitting ? "bg-[#00A650] animate-pulse" : "bg-slate-400")} />
                  <span className="text-xs uppercase">{isTransmitting ? 'BEAMING' : 'READY'}</span>
                </div>
                <div className="font-black text-lg text-[#0057A6]">
                  Frame {currentChunkIndex + 1} of {chunks.length}
                </div>
              </div>
            )}
          </div>

          {/* Speed Controls & Details */}
          {chunks.length > 0 && (
            <div className="w-full mt-4 bg-[var(--lego-card)] border-4 border-[var(--lego-border)] rounded-xl p-4 shadow-[4px_4px_0px_var(--lego-border)] transition-colors duration-300">
              <div className="flex justify-between items-center mb-2">
                <label className="font-black text-xs text-[var(--lego-text)] flex items-center gap-1.5 uppercase">
                  <Zap className="w-4 h-4 text-[#FFD500]" fill="#FFD500" strokeWidth={2} />
                  Speed ({fps} Frames / Sec)
                </label>
                <span className="font-black text-xs text-[#0057A6]">~{estimatedTimeSec}s loop</span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={fps}
                onChange={(e) => setFps(parseInt(e.target.value))}
                className="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer outline-none border-2 border-[var(--lego-border)] accent-[#0057A6]"
              />
              <div className="flex justify-between text-[10px] font-bold text-[var(--lego-muted)] mt-1 uppercase">
                <span>1 FPS (Slow & Steady)</span>
                <span>5 FPS (Recommended)</span>
                <span>12 FPS (Fast)</span>
              </div>
            </div>
          )}

          {/* Controls Bar */}
          <div className="mt-5 flex flex-wrap justify-center items-center gap-3 w-full">
            <button
              onClick={() => setCurrentChunkIndex((prev) => (prev > 0 ? prev - 1 : chunks.length - 1))}
              disabled={chunks.length === 0}
              className="p-3 rounded-xl bg-[var(--lego-card)] border-4 border-[var(--lego-border)] text-[var(--lego-text)] shadow-[3px_3px_0px_var(--lego-border)] hover:-translate-y-0.5 active:translate-y-1 disabled:opacity-50"
              title="Previous Frame"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={3} />
            </button>

            <button
              onClick={() => {
                if (!isTransmitting && currentChunkIndex !== 0) {
                  setCurrentChunkIndex(0);
                }
                setIsTransmitting(!isTransmitting);
              }}
              disabled={chunks.length === 0}
              className={cn(
                "px-8 py-3 rounded-xl text-lg font-black transition-all border-4 flex items-center gap-2 uppercase tracking-wide flex-1 justify-center min-w-[160px]",
                isTransmitting
                  ? "bg-[#D01012] border-[#8C0000] text-white shadow-none translate-y-1"
                  : "bg-[#00A650] border-[#007036] text-white shadow-[4px_4px_0px_#007036] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none disabled:opacity-50"
              )}
            >
              {isTransmitting ? (
                <>
                  <Pause className="w-5 h-5" strokeWidth={3} /> Pause Beam
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" strokeWidth={3} /> Start Beam
                </>
              )}
            </button>

            <button
              onClick={() => setCurrentChunkIndex((prev) => (prev + 1) % chunks.length)}
              disabled={chunks.length === 0}
              className="p-3 rounded-xl bg-[var(--lego-card)] border-4 border-[var(--lego-border)] text-[var(--lego-text)] shadow-[3px_3px_0px_var(--lego-border)] hover:-translate-y-0.5 active:translate-y-1 disabled:opacity-50"
              title="Next Frame"
            >
              <ChevronRight className="w-5 h-5" strokeWidth={3} />
            </button>

            {chunks.length > 0 && (
              <button
                onClick={() => {
                  setCurrentChunkIndex(0);
                  setIsTransmitting(true);
                }}
                className="p-3 rounded-xl bg-[#FFD500] border-4 border-[#B29500] text-[#2B2B2B] shadow-[3px_3px_0px_#B29500] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none"
                title="Restart From Frame 1"
              >
                <RotateCcw className="w-5 h-5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
