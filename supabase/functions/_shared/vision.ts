function parseDataUrl(dataUrl: string): { mediaType: string; data: string } | null {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|gif|webp));base64,(.+)$/i);
  if (!match) return null;
  return { mediaType: match[1].toLowerCase(), data: match[2] };
}

export async function analyzeImageWithClaude(imageBase64: string, userMessage: string): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  const model = Deno.env.get('CLAUDE_VISION_MODEL') || 'claude-sonnet-4-20250514';

  if (!apiKey || apiKey.includes('your-key')) return '';

  const parsed = parseDataUrl(imageBase64);
  if (!parsed) return '';

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1400,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: parsed.mediaType, data: parsed.data } },
            {
              type: 'text',
              text: `Eres diseñador senior de All In Remodeling (Georgia). Analiza SOLO lo visible en la foto.
Consulta: "${userMessage}"
Responde en español: espacio, gabinetes, encimeras, iluminación, colores, 3-5 mejoras concretas.`,
            },
          ],
        }],
      }),
    });

    if (!res.ok) {
      console.error('Claude vision error', res.status);
      return '';
    }

    const data = await res.json();
    const textBlock = data.content?.find((b: { type: string }) => b.type === 'text');
    return textBlock?.text?.trim() || '';
  } catch (err) {
    console.error('Claude vision failed', err);
    return '';
  }
}
