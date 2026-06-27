/** Server-side Cloudinary upload — always return optimized HTTPS URLs, never base64 to clients. */

export function getCloudinaryConfig() {
  const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME') || Deno.env.get('VITE_CLOUDINARY_CLOUD_NAME');
  const uploadPreset = Deno.env.get('CLOUDINARY_UPLOAD_PRESET') || Deno.env.get('VITE_CLOUDINARY_UPLOAD_PRESET');
  return { cloudName, uploadPreset };
}

export function cloudinaryOptimizedUrl(publicId: string, cloudName: string, maxWidth = 1600): string {
  return `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,f_auto,w_${maxWidth},c_limit/${publicId}`;
}

async function blobFromSource(source: string): Promise<Blob | null> {
  if (source.startsWith('http://') || source.startsWith('https://')) {
    const res = await fetch(source);
    if (!res.ok) return null;
    return res.blob();
  }

  const match = source.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!match) return null;
  const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: match[1] });
}

export async function uploadImageToCloudinary(
  source: string,
  folder = 'ai-da/edited',
): Promise<string | null> {
  const { cloudName, uploadPreset } = getCloudinaryConfig();
  if (!cloudName || !uploadPreset) return null;

  const blob = await blobFromSource(source);
  if (!blob) return null;

  const form = new FormData();
  form.append('file', blob, 'kitchen.jpg');
  form.append('upload_preset', uploadPreset);
  form.append('folder', folder);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      console.error('Cloudinary upload failed', res.status, await res.text());
      return null;
    }
    const data = await res.json() as { public_id?: string; secure_url?: string };
    if (data.public_id) return cloudinaryOptimizedUrl(data.public_id, cloudName);
    return data.secure_url || null;
  } catch (err) {
    console.error('Cloudinary upload error', err);
    return null;
  }
}

/** Normalize any edit output to a lightweight public URL safe for the browser. */
export async function finalizePublicImageUrl(raw: string | null | undefined): Promise<string | null> {
  if (!raw) return null;
  if (raw.startsWith('data:')) {
    return uploadImageToCloudinary(raw);
  }
  if (raw.includes('res.cloudinary.com')) return raw;
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    const uploaded = await uploadImageToCloudinary(raw);
    return uploaded || raw;
  }
  return null;
}
