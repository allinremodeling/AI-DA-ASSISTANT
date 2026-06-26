const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = process.env.CLAUDE_VISION_MODEL || 'claude-sonnet-4-20250514';

function parseDataUrl(dataUrl: string): { mediaType: string; data: string } | null {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|gif|webp));base64,(.+)$/i);
  if (!match) return null;
  return { mediaType: match[1].toLowerCase(), data: match[2] };
}

export async function analyzeImageWithClaude(
  imageBase64: string,
  userMessage: string,
): Promise<string> {
  if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY.includes('your-key')) {
    return '';
  }

  const parsed = parseDataUrl(imageBase64);
  if (!parsed) return '';

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1400,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: parsed.mediaType,
                  data: parsed.data,
                },
              },
              {
                type: 'text',
                text: `Eres diseñador senior de All In Remodeling (cocinas y baños, Georgia).
Analiza SOLO lo visible en esta foto. Sé específico y técnico.

Incluye:
1. Tipo de espacio (cocina/baño) y layout aparente
2. Gabinetes: estilo, color, material, estado
3. Encimeras: material probable (granito/cuarzo/laminado), color, vetas
4. Backsplash, iluminación, hardware, electrodomésticos visibles
5. Paleta de colores dominante
6. 3-5 oportunidades concretas de mejora alineadas con remodelación premium

Consulta del cliente: "${userMessage}"

Responde en español, párrafos claros. No inventes elementos fuera de cuadro.`,
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      console.error('Claude vision error', res.status, await res.text());
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
