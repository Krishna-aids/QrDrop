import * as pako from 'pako';
import { QualityMode, ReceivedFileData } from '../types';

// Safe chunked Base64 encoding to prevent stack overflow on large buffers
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  const CHUNK_LEN = 0x8000; // 32KB chunks
  for (let i = 0; i < len; i += CHUNK_LEN) {
    const slice = bytes.subarray(i, Math.min(i + CHUNK_LEN, len));
    binary += String.fromCharCode.apply(null, Array.from(slice));
  }
  return window.btoa(binary);
}

// Decode base64 to Uint8Array safely
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Optimal payload size per QR code frame for fast optical phone camera scanning
export const DEFAULT_CHUNK_SIZE = 140;

function encode8BitWAV(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length);
  const view = new DataView(buffer);
  
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // 1 channel
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true); // ByteRate
  view.setUint16(32, 1, true); // BlockAlign
  view.setUint16(34, 8, true); // BitsPerSample
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length, true);

  // Write 8-bit samples (0-255, center 128)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const val = Math.round((s + 1) * 127.5);
    view.setUint8(44 + i, val);
  }
  return buffer;
}

export async function compressAndChunkFile(
  file: File,
  quality: QualityMode = 'original',
  onProgress?: (progress: number, status: string) => void,
  chunkSize: number = DEFAULT_CHUNK_SIZE
): Promise<{ chunks: string[]; originalSize: number; compressedSize: number }> {
  const wait = () => new Promise((r) => setTimeout(r, 20));

  let bytes: Uint8Array;
  let typeFlag: string;

  if (file.type.startsWith('audio')) {
    typeFlag = `aud:${file.type || 'audio/wav'}`;
    onProgress?.(10, 'Loading Audio...');
    await wait();

    if (quality === 'original' && file.size < 2 * 1024 * 1024) {
      // Direct raw audio transfer
      const arrayBuffer = await file.arrayBuffer();
      bytes = new Uint8Array(arrayBuffer);
    } else {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const arrayBuffer = await file.arrayBuffer();
      onProgress?.(30, 'Decoding Audio...');
      await wait();
      
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      onProgress?.(50, 'Optimizing Audio...');
      await wait();
      
      const TARGET_SAMPLE_RATE = 11025;
      const offlineCtx = new OfflineAudioContext(1, Math.ceil(audioBuffer.duration * TARGET_SAMPLE_RATE), TARGET_SAMPLE_RATE);
      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineCtx.destination);
      source.start(0);
      const renderedBuffer = await offlineCtx.startRendering();
      
      onProgress?.(70, 'Encoding WAV...');
      await wait();
      const wavBuffer = encode8BitWAV(renderedBuffer.getChannelData(0), TARGET_SAMPLE_RATE);
      bytes = new Uint8Array(wavBuffer);
      typeFlag = 'aud:audio/wav';
    }
  } else {
    onProgress?.(10, 'Reading Image...');
    await wait();

    const mimeType = file.type || 'image/png';
    typeFlag = `img:${mimeType}`;

    if (quality === 'original') {
      // 100% LOSSLESS ORIGINAL QUALITY - Direct raw byte transfer without downscaling or lossy compression
      onProgress?.(40, 'Preserving 100% Original Quality...');
      await wait();
      const arrayBuffer = await file.arrayBuffer();
      bytes = new Uint8Array(arrayBuffer);
    } else {
      // Downscaled / optimized mode
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });
      URL.revokeObjectURL(url);

      onProgress?.(30, 'Resizing & Optimizing...');
      await wait();

      const canvas = document.createElement('canvas');
      const MAX_WIDTH = quality === 'hd' ? 1280 : 400;
      const MAX_HEIGHT = quality === 'hd' ? 1280 : 400;
      const jpegQuality = quality === 'hd' ? 0.88 : 0.6;

      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      onProgress?.(50, 'Extracting Bytes...');
      await wait();

      const dataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
      const base64Data = dataUrl.split(',')[1];
      bytes = base64ToUint8Array(base64Data);
      typeFlag = 'img:image/jpeg';
    }
  }

  const originalSize = bytes.byteLength;

  onProgress?.(75, 'Compressing Data (Lossless Deflate)...');
  await wait();

  // Compress using pako with maximum lossless compression
  const compressed = pako.deflate(bytes, { level: 9 });
  const compressedSize = compressed.byteLength;

  onProgress?.(90, 'Generating QR Frame Stream...');
  await wait();

  // Convert to base64
  const compressedBase64 = uint8ArrayToBase64(compressed);

  // Chunking
  const chunks: string[] = [];
  const totalChunks = Math.ceil(compressedBase64.length / chunkSize);
  
  for (let i = 0; i < totalChunks; i++) {
    const chunkData = compressedBase64.slice(i * chunkSize, (i + 1) * chunkSize);
    // Format: index|total|typeFlag|chunkData
    chunks.push(`${i}|${totalChunks}|${typeFlag}|${chunkData}`);
  }

  onProgress?.(100, 'Ready to Transmit');
  await wait();

  return { chunks, originalSize, compressedSize };
}

export function reassembleAndDecompress(chunksData: string[], typeHeader: string): ReceivedFileData {
  // Join all chunk base64 segments
  const compressedBase64 = chunksData.join('');
  const compressedBytes = base64ToUint8Array(compressedBase64);
  const decompressed = pako.inflate(compressedBytes);
  
  let mimeType = 'image/png';
  let isAudio = false;

  if (typeHeader.startsWith('img:')) {
    mimeType = typeHeader.substring(4) || 'image/png';
  } else if (typeHeader.startsWith('aud:')) {
    mimeType = typeHeader.substring(4) || 'audio/wav';
    isAudio = true;
  } else if (typeHeader === 'a') {
    mimeType = 'audio/wav';
    isAudio = true;
  } else if (typeHeader === 'i') {
    mimeType = 'image/jpeg';
  } else if (typeHeader.startsWith('f:')) {
    mimeType = typeHeader.substring(2) || 'application/octet-stream';
  }

  const blob = new Blob([decompressed], { type: mimeType });
  const url = URL.createObjectURL(blob);

  return {
    url,
    blob,
    mimeType,
    isAudio,
    sizeBytes: decompressed.byteLength,
  };
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
