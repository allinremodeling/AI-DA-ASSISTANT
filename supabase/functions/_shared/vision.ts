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
              text: `You are a senior kitchen/bath designer for All In Remodeling (Georgia).
User query: "${userMessage}"
Respond in ${languageHint}. Short analysis only (3-5 bullet points): space type, cabinets, countertops, colors, lighting, 2-3 concrete improvement ideas visible in the photo.`,
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
