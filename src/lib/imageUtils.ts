/** Client-side image helpers — keep React state free of multi-MB base64 strings. */

export function isHttpUrl(value?: string | null): value is string {
  return Boolean(value && (value.startsWith('http://') || value.startsWith('https://')));
}

export function isDataUrl(value?: string | null): boolean {
  return Boolean(value && value.startsWith('data:'));
}

/** Never persist data URLs in chat state — they crash mobile browsers. */
export function safeImageRef(value?: string | null): string | undefined {
  if (!value) return undefined;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('blob:')) return value;
  return undefined;
}

export async function compressImageFile(
  file: File,
  maxWidth = 1280,
  quality = 0.82,
): Promise<{ blob: Blob; previewUrl: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Compression failed'))),
      'image/jpeg',
      quality,
    );
  });

  return { blob, previewUrl: URL.createObjectURL(blob) };
}

export function revokeObjectUrl(url?: string | null): void {
  if (url?.startsWith('blob:')) {
    try { URL.revokeObjectURL(url); } catch { /* ignore */ }
  }
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
