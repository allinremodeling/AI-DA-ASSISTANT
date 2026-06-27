import { AIDA_PERSONALITY } from './personality.ts';

function parseDataUrl(dataUrl: string): { mediaType: string; data: string } | null {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|gif|webp));base64,(.+)$/i);
  if (!match) return null;
  return { mediaType: match[1].toLowerCase(), data: match[2] };
}

/** Kitchen photo analysis via OpenAI Vision — AI-DA consultant tone. */
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

  const photoRules = `
${AIDA_PERSONALITY}

For this photo analysis only: describe cabinets (style/color), countertops, backsplash, layout, lighting, appliances.
Identify 2–3 improvement opportunities. Name specific All In materials (White Shaker, Calacatta quartz, waterfall island, etc.).
If under construction, say so and focus on finish selections. Be warm and detailed — never generic.`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 650,
        temperature: 0.75,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${parsed.mediaType};base64,${parsed.data}`, detail: 'high' },
            },
            {
              type: 'text',
              text: `${photoRules}\n\nUser query: "${userMessage}"\nRespond in ${languageHint}.`,
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

export async function analyzeImageWithClaude(imageBase64: string, userMessage: string, lang = 'es'): Promise<string> {
  return analyzeImageWithOpenAI(imageBase64, userMessage, lang);
}
