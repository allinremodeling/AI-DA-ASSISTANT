/** Detect edit intent + Replicate / Stability photo editing for edit_photo tool. */

const EDIT_VERBS =
  /cambiar|change|edit|modificar|haz(me)?|hacer|make|poner|put|ponle|pon|quiero|want|prefiero|prefer|muestra|show|visualiz|render|prueba|try|actualiza|update|aplica|apply|simula|simulate|diseña|design|coloca|agrega|add/i;
const EDIT_TARGETS =
  /gabinete|cabinet|encimera|countertop|counter|backsplash|isla|island|waterfall|cascada|color|blanco|white|gris|gray|negro|black|navy|quartz|cuarzo|granite|granito|shaker|mármol|marble|estilo|style|material|madera|wood|foto|kitchen|cocina|remodel|diseño|design/i;

export function wantsPhotoEdit(message: string, hasImage: boolean): boolean {
  if (!hasImage) return false;
  const m = message.trim().toLowerCase();
  if (m.length < 3) return false;
  if (EDIT_VERBS.test(m) && EDIT_TARGETS.test(m)) return true;
  if (/cuarzo|quartz|shaker|granite|granito|encimera|countertop|mármol|marble/i.test(m)
    && /(esta|this|foto|photo|imagen|image|mi cocina|my kitchen|a la foto|en la foto)/i.test(m)) {
    return true;
  }
  if (/^(ponle|pon|aplica|haz|muestra|visualiza)\b/i.test(m)) return true;
  return false;
}

export function buildInpaintPrompt(userMessage: string, visionAnalysis: string, lang: string): string {
  const context = `${userMessage} ${visionAnalysis}`.slice(0, 500);

  if (/waterfall|cascada/i.test(context)) {
    return 'make the kitchen have a quartz waterfall island edge, modern premium remodel, photorealistic';
  }
  if (/white shaker|blanco shaker|shaker blanco/i.test(context)) {
    return 'make the cabinets white shaker style with upgraded countertops, photorealistic kitchen';
  }
  if (/navy|azul marino|blue cabinet/i.test(context)) {
    return 'make the kitchen have navy blue lower cabinets and white upper cabinets with quartz counters';
  }
  if (/quartz|cuarzo|calacatta/i.test(context)) {
    return 'make the countertops white calacatta quartz, photorealistic kitchen remodel';
  }
  if (/granite|granito/i.test(context)) {
    return 'make the countertops granite, updated kitchen finish, photorealistic';
  }

  const userHint = userMessage.slice(0, 180).replace(/[^\w\sáéíóúñ,-]/gi, ' ');
  return lang === 'en'
    ? `make this kitchen: ${userHint}, photorealistic remodel visualization`
    : `transform this kitchen: ${userHint}, photorealistic kitchen remodel visualization`;
}

export interface EditPhotoInput {
  /** Cloudinary URL (preferred) or base64 data URI */
  imageInput: string;
  prompt: string;
}

export interface EditPhotoResult {
  editedImageUrl: string | null;
  error?: string;
  provider?: 'replicate' | 'stability';
}

async function pollReplicatePrediction(id: string, token: string, maxMs = 75000): Promise<string | null> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 'succeeded') {
      const out = data.output;
      if (typeof out === 'string') return out;
      if (Array.isArray(out) && out[0]) return String(out[0]);
      return null;
    }
    if (data.status === 'failed' || data.status === 'canceled') {
      console.error('Replicate prediction failed', data.error);
      return null;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return null;
}

function normalizeImageInput(imageInput: string): string {
  if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) return imageInput;
  return imageInput.startsWith('data:') ? imageInput : `data:image/jpeg;base64,${imageInput}`;
}

/** instruct-pix2pix — natural language kitchen edits, preserves layout (Replicate). */
async function runInstructPix2Pix(input: EditPhotoInput, token: string): Promise<EditPhotoResult> {
  const image = normalizeImageInput(input.imageInput);

  const createRes = await fetch('https://api.replicate.com/v1/models/timbrooks/instruct-pix2pix/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: {
        image,
        prompt: input.prompt,
        num_inference_steps: 30,
        image_guidance_scale: 1.35,
        guidance_scale: 7.5,
      },
    }),
  });

  if (!createRes.ok) {
    console.error('Replicate create failed', createRes.status, await createRes.text());
    return { editedImageUrl: null, error: 'replicate_failed' };
  }

  const created = await createRes.json();
  const outputUrl = await pollReplicatePrediction(created.id, token);
  return outputUrl
    ? { editedImageUrl: outputUrl, provider: 'replicate' }
    : { editedImageUrl: null, error: 'replicate_timeout' };
}

/** Stability search-and-replace — fallback when Replicate fails. */
async function runStabilitySearchReplace(input: EditPhotoInput, apiKey: string): Promise<EditPhotoResult> {
  try {
    const imageUrl = normalizeImageInput(input.imageInput);
    let imageBlob: Blob;

    if (imageUrl.startsWith('http')) {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) return { editedImageUrl: null, error: 'stability_fetch_image' };
      imageBlob = await imgRes.blob();
    } else {
      const match = imageUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (!match) return { editedImageUrl: null, error: 'stability_bad_image' };
      const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
      imageBlob = new Blob([bytes], { type: match[1] });
    }

    const searchPrompt = /counter|encimera|countertop/i.test(input.prompt)
      ? 'countertop'
      : /cabinet|gabinete|shaker/i.test(input.prompt)
        ? 'kitchen cabinets'
        : 'kitchen';

    const form = new FormData();
    form.append('image', imageBlob, 'kitchen.jpg');
    form.append('prompt', input.prompt);
    form.append('search_prompt', searchPrompt);
    form.append('output_format', 'jpeg');

    const res = await fetch('https://api.stability.ai/v2beta/stable-image/edit/search-and-replace', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      body: form,
    });

    if (!res.ok) {
      console.error('Stability edit failed', res.status, await res.text());
      return { editedImageUrl: null, error: 'stability_failed' };
    }

    const data = await res.json();
    const b64 = data?.image as string | undefined;
    if (!b64) return { editedImageUrl: null, error: 'stability_no_output' };

    return { editedImageUrl: `data:image/jpeg;base64,${b64}`, provider: 'stability' };
  } catch (err) {
    console.error('Stability edit error', err);
    return { editedImageUrl: null, error: 'stability_exception' };
  }
}

export async function editKitchenPhoto(input: EditPhotoInput): Promise<EditPhotoResult> {
  const replicateToken = Deno.env.get('REPLICATE_API_TOKEN');
  const stabilityKey = Deno.env.get('STABILITY_API_KEY');

  if (replicateToken && !replicateToken.includes('your')) {
    try {
      const replicateResult = await runInstructPix2Pix(input, replicateToken);
      if (replicateResult.editedImageUrl) return replicateResult;
    } catch (err) {
      console.error('editKitchenPhoto replicate error', err);
    }
  }

  if (stabilityKey && !stabilityKey.includes('your')) {
    try {
      const stabilityResult = await runStabilitySearchReplace(input, stabilityKey);
      if (stabilityResult.editedImageUrl) return stabilityResult;
    } catch (err) {
      console.error('editKitchenPhoto stability error', err);
    }
  }

  if (!replicateToken && !stabilityKey) {
    return { editedImageUrl: null, error: 'no_edit_api_keys' };
  }

  return { editedImageUrl: null, error: 'all_providers_failed' };
}

export function editFailureMessage(lang: string): string {
  return lang === 'es'
    ? 'Estoy teniendo problemas para generar la visualización en este momento. ¿Te gustaría agendar una consulta gratuita para que nuestro diseñador te muestre opciones en persona? Llámanos al **470-733-0461**.'
    : "I'm having trouble generating the visualization right now. Would you like to schedule a free consultation so our designer can show you options in person? Call us at **470-733-0461**.";
}

export function isPublicImageUrl(value?: string): boolean {
  return Boolean(value && (value.startsWith('http://') || value.startsWith('https://')));
}
