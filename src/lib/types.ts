export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image_url: string;
  woo_url: string | null;
  slug: string | null;
  attributes: Record<string, unknown>;
  in_stock: boolean;
  created_at: string;
}

export type DesignBlockType =
  | 'analysis'
  | 'trend'
  | 'recommendation'
  | 'inspiration'
  | 'product';

export interface DesignBlock {
  type: DesignBlockType;
  title: string;
  text: string;
  imageUrl?: string;
  source?: string;
  tags?: string[];
}

export interface StructuredChatResponse {
  intro: string;
  blocks: DesignBlock[];
  products?: Product[];
  followUp?: string;
  generatedImage?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  intro?: string;
  blocks?: DesignBlock[];
  followUp?: string;
  products?: Product[];
  imageUrl?: string;
  imageUrls?: string[];
  generatedImage?: string;
  isLoading?: boolean;
  isError?: boolean;
}

export interface AssistantResponse extends StructuredChatResponse {
  threadId: string;
}

export interface Conversation {
  id: string;
  thread_id: string;
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}
