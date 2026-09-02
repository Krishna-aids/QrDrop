export type AppMode = 'send' | 'receive';
export type QualityMode = 'original' | 'hd' | 'fast';

export interface ReceivedFileData {
  url: string;
  blob: Blob;
  mimeType: string;
  isAudio: boolean;
  sizeBytes: number;
}
