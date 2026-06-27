import type { ChatHistoryTurn } from './history.ts';

export interface LLMJSONResult {
  content: string;
  provider: 'anthropic' | 'openai';
}

function stripJsonFences(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return (fenced ? fenced[1] : trimmed).trim();
}

async function anthropicJSON(
  apiKey: string,
  system: string,
  userContent: string,
  history: ChatHistoryTurn[] = [],
): Promise<string> {
  const model = Deno.env.get('ANTHROPIC_CHAT_MODEL') || 'claude-sonnet-4-20250514';

  const messages = [
    ...history.slice(-4).map((h) => ({
      role: h.role === 'user' ? 'user' as const : 'assistant' as const,
      content: h.content.slice(0, 600),
    })),
    { role: 'user' as const, content: userContent },
  ];

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2800,
      temperature: 0.82,
      system: `${system}\n\nRespond ONLY with valid JSON. No markdown fences, no commentary outside JSON.`,
      messages,
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const block = data.content?.find((c: { type: string }) => c.type === 'text');
  return stripJsonFences(block?.text || '{}');
}

async function openaiJSON(
  apiKey: string,
  system: string,
  userContent: string,
  history: ChatHistoryTurn[] = [],
): Promise<string> {
  const model = Deno.env.get('OPENAI_CHAT_MODEL') || 'gpt-4o-mini';

  const messages = [
    { role: 'system', content: system },
    ...history.slice(-4).map((h) => ({
      role: h.role,
      content: h.content.slice(0, 600),
    })),
    { role: 'user', content: userContent },
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      temperature: 0.82,
      max_tokens: 2800,
      messages,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return stripJsonFences(data.choices?.[0]?.message?.content || '{}');
}

/** Anthropic first (if key set), then OpenAI — for natural virtual-assistant JSON responses. */
export async function completeDesignJSON(
  system: string,
  userContent: string,
  history: ChatHistoryTurn[] = [],
): Promise<LLMJSONResult> {
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  const openaiKey = Deno.env.get('OPENAI_API_KEY');

  if (anthropicKey && !anthropicKey.includes('your-key')) {
    try {
      const content = await anthropicJSON(anthropicKey, system, userContent, history);
      return { content, provider: 'anthropic' };
    } catch (err) {
      console.error('Anthropic orchestrator failed, trying OpenAI', err);
    }
  }

  if (openaiKey && !openaiKey.includes('your-key')) {
    const content = await openaiJSON(openaiKey, system, userContent, history);
    return { content, provider: 'openai' };
  }

  throw new Error('No LLM API key configured');
}
