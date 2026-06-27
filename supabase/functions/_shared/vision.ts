function parseDataUrl(dataUrl: string): { mediaType: string; data: string } | null {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|gif|webp));base64,(.+)$/i);
  if (!match) return null;
  return { mediaType: match[1].toLowerCase(), data: match[2] };
}

/** Short image analysis via OpenAI Vision (uses OPENAI_API_KEY, no Claude required). */
export async function analyzeImageWithOpenAI(
  imageBase64: string,
  userMessage: string,
  lang = 'es',
): Promise<string> {
  const languageHint = lang === 'en' ? 'English' : lang === 'pt' ? 'Portuguese' : lang === 'fr' ? 'French' : 'Spanish';
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  const model = Deno.env.get('OPENAI_VISION_MODEL') || 'gpt-4o-mini';

  if (!apiKey || apiKey.includes('your-key')) return '';

  const parsed = parseDataUrl(imageBase64);
  if (!parsed) return '';

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${parsed.mediaType};base64,${parsed.data}`, detail: 'low' },
            },
            {
              type: 'text',
              text: `Eres un diseñador senior de cocinas y baños en All In Remodeling (Georgia).
Consulta del usuario: "${userMessage}"
Responde en ${languageHint}, tono cercano de asistente virtual (no robótico).
Análisis breve en 4-6 líneas: tipo de espacio, gabinetes, encimeras, colores, iluminación, y 2-3 ideas concretas de mejora visibles en la foto.
Destaca materiales y estilos que el usuario podría querer (waterfall, isla, cuarzo, etc.).`,
            },
          ],
        }],
      }),
    });

    if (!res.ok) {
      console.error('OpenAI vision error', res.status, await res.text());
      return '';
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  } catch (err) {
    console.error('OpenAI vision failed', err);
    return '';
  }
}

/** @deprecated Use analyzeImageWithOpenAI */
export async function analyzeImageWithClaude(imageBase64: string, userMessage: string, lang = 'es'): Promise<string> {
  return analyzeImageWithOpenAI(imageBase64, userMessage, lang);
}
