const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET);
}

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
}

async function uploadBlob(blob: Blob, folder: string): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary not configured');
  }

  const formData = new FormData();
  formData.append('file', blob, 'kitchen.jpg');
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message || 'Cloudinary upload failed');
  }

  return res.json() as Promise<CloudinaryUploadResult>;
}

export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  return uploadBlob(file, 'ai-da');
}

export async function uploadBlobToCloudinary(blob: Blob, folder = 'ai-da/edited'): Promise<string> {
  const result = await uploadBlob(blob, folder);
  return getOptimizedUrl(result.public_id);
}

/** Upload edited image from URL or data URL — returns optimized Cloudinary HTTPS URL. */
export async function ensureCloudinaryUrl(source: string): Promise<string | undefined> {
  if (!isCloudinaryConfigured()) {
    return source.startsWith('http') ? source : undefined;
  }

  if (source.includes('res.cloudinary.com')) return source;

  try {
    if (source.startsWith('http://') || source.startsWith('https://')) {
      const res = await fetch(source);
      if (!res.ok) return source;
      const blob = await res.blob();
      return await uploadBlobToCloudinary(blob);
    }

    if (source.startsWith('data:')) {
      const match = source.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (!match) return undefined;
      const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: match[1] });
      return await uploadBlobToCloudinary(blob);
    }
  } catch {
    return source.startsWith('http') ? source : undefined;
  }

  return undefined;
}

export function getOptimizedUrl(publicId: string, maxWidth = 1600): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/q_auto,f_auto,w_${maxWidth},c_limit/${publicId}`;
}
