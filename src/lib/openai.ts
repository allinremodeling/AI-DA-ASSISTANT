import type { Product, AssistantResponse } from './types';
import { supabase } from './supabase';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const ASSISTANT_ID = import.meta.env.VITE_OPENAI_ASSISTANT_ID;

const API_BASE = 'https://api.openai.com/v1';

export async function createThread(): Promise<string> {
  const res = await fetch(`${API_BASE}/threads`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2',
    },
  });
  if (!res.ok) throw new Error(`Failed to create thread: ${res.status}`);
  const data = await res.json();
  return data.id;
}

export async function sendMessage(threadId: string, content: string, imageBase64?: string): Promise<AssistantResponse> {
  const body: any[] = [];
  
  if (imageBase64) {
    body.push({
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: imageBase64 } },
        { type: 'text', text: content || 'Analiza esta imagen de mi cocina' },
      ],
    });
  } else {
    body.push({
      role: 'user',
      content: content,
    });
  }

  const res = await fetch(`${API_BASE}/threads/${threadId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2',
    },
    body: JSON.stringify({ role: 'user', content: body[0].content }),
  });
  if (!res.ok) throw new Error(`Failed to send message: ${res.status}`);

  const runRes = await fetch(`${API_BASE}/threads/${threadId}/runs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2',
    },
    body: JSON.stringify({
      assistant_id: ASSISTANT_ID,
    }),
  });
  if (!runRes.ok) throw new Error(`Failed to start run: ${runRes.status}`);
  const runData = await runRes.json();

  let run = runData;
  while (run.status === 'queued' || run.status === 'in_progress') {
    await new Promise((r) => setTimeout(r, 1000));
    const poll = await fetch(`${API_BASE}/threads/${threadId}/runs/${run.id}`, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
      },
    });
    run = await poll.json();
  }

  if (run.status === 'requires_action') {
    const toolCalls = run.required_action?.submit_tool_outputs?.tool_calls || [];
    const outputs = await Promise.all(
      toolCalls.map(async (toolCall: any) => {
        const fnName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        
        if (fnName === 'search_products') {
          const { data } = await supabase.from('products').select('*').ilike('name', `%${args.query}%`).limit(10);
          return {
            tool_call_id: toolCall.id,
            output: JSON.stringify({ products: data || [] }),
          };
        }
        return { tool_call_id: toolCall.id, output: '{}' };
      })
    );

    const submitRes = await fetch(`${API_BASE}/threads/${threadId}/runs/${run.id}/submit_tool_outputs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({ tool_outputs: outputs }),
    });
    if (!submitRes.ok) throw new Error(`Failed to submit tool outputs: ${submitRes.status}`);

    while (run.status === 'queued' || run.status === 'in_progress' || run.status === 'requires_action') {
      await new Promise((r) => setTimeout(r, 1000));
      const poll = await fetch(`${API_BASE}/threads/${threadId}/runs/${run.id}`, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      });
      run = await poll.json();
    }
  }

  if (run.status !== 'completed') {
    throw new Error(`Run failed with status: ${run.status}`);
  }

  const messagesRes = await fetch(`${API_BASE}/threads/${threadId}/messages?order=desc&limit=1`, {
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'OpenAI-Beta': 'assistants=v2',
    },
  });
  const messagesData = await messagesRes.json();
  const lastMessage = messagesData.data?.[0];
  
  if (!lastMessage || lastMessage.role !== 'assistant') {
    throw new Error('No assistant response found');
  }

  const textContent = lastMessage.content[0]?.text?.value || '';
  let products: Product[] = [];
  
  try {
    const jsonMatch = textContent.match(/\{[\s\S]*"products"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      products = parsed.products || [];
    }
  } catch {
    // No JSON products found in response
  }

  return {
    intro: textContent.slice(0, 200),
    blocks: [],
    products,
    threadId,
  };
}

export async function generateImage(prompt: string): Promise<string> {
  const res = await fetch(`${API_BASE}/images/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
    }),
  });
  if (!res.ok) throw new Error(`Failed to generate image: ${res.status}`);
  const data = await res.json();
  return data.data[0]?.url || '';
}

export async function saveConversation(threadId: string, sessionId: string, title?: string) {
  const { data } = await supabase.from('conversations').insert({
    thread_id: threadId,
    session_id: sessionId,
    title: title || 'Nueva conversación',
  }).select().single();
  return data;
}

export async function getConversationByThread(threadId: string) {
  const { data } = await supabase.from('conversations')
    .select('*')
    .eq('thread_id', threadId)
    .single();
  return data;
}

export async function saveMessage(conversationId: string, role: 'user' | 'assistant', content: string, products?: Product[], imageUrl?: string) {
  const { data } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    role,
    content,
    products: products || [],
    image_url: imageUrl,
  }).select().single();
  return data;
}

export async function getMessages(conversationId: string) {
  const { data } = await supabase.from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  return data || [];
}
