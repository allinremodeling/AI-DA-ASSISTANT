/** Detect edit intent + Replicate inpainting for edit_photo tool. */

const EDIT_VERBS = /cambiar|change|edit|modificar|haz|hacer|make|poner|put|quiero|want|prefiero|prefer|muestra|show|visualiz|render|prueba|try|actualiza|update/i;
const EDIT_TARGETS = /gabinete|cabinet|encimera|countertop|counter|backsplash|isla|island|waterfall|cascada|color|blanco|white|gris|gray|negro|black|navy|quartz|cuarzo|granite|granito|shaker|mármol|marble|estilo|style/i;

export function wantsPhotoEdit(message: string, hasImage: boolean): boolean {
  if (!hasImage) return false;
  const m = message.trim();
  if (m.length < 4) return false;
  return EDIT_VERBS.test(m) && EDIT_TARGETS.test(m);
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
    : `transformar esta cocina: ${userHint}, visualización fotorrealista de remodelación`;
}

export interface EditPhotoInput {
  imageBase64: string;
  prompt: string;
}

export interface EditPhotoResult {
  editedImageUrl: string | null;
  error?: string;
}

async function pollReplicatePrediction(id: string, token: string, maxMs = 90000): Promise<string | null> {
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
    await new Promise((r) => setTimeout(r, 2500));
  }
  return null;
}

/** instruct-pix2pix — natural language kitchen edits, preserves layout (Replicate). */
async function runInstructPix2Pix(input: EditPhotoInput, token: string): Promise<EditPhotoResult> {
  const image = input.imageBase64.startsWith('data:')
    ? input.imageBase64
    : `data:image/jpeg;base64,${input.imageBase64}`;

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
        num_inference_steps: 35,
        image_guidance_scale: 1.4,
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
  return outputUrl ? { editedImageUrl: outputUrl } : { editedImageUrl: null, error: 'timeout' };
}

export async function editKitchenPhoto(input: EditPhotoInput): Promise<EditPhotoResult> {
  const replicateToken = Deno.env.get('REPLICATE_API_TOKEN');
  if (!replicateToken || replicateToken.includes('your')) {
    return { editedImageUrl: null, error: 'no_replicate_token' };
  }

  try {
    return await runInstructPix2Pix(input, replicateToken);
  } catch (err) {
    console.error('editKitchenPhoto error', err);
    return { editedImageUrl: null, error: 'exception' };
  }
}

export function editFailureMessage(lang: string): string {
  return lang === 'es'
    ? 'Estoy teniendo problemas para generar la visualización en este momento. ¿Te gustaría agendar una consulta gratuita para que nuestro diseñador te muestre opciones en persona? Llámanos al **470-733-0461**.'
    : "I'm having trouble generating the visualization right now. Would you like to schedule a free consultation so our designer can show you options in person? Call us at **470-733-0461**.";
}
