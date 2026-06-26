export interface ActionStep {
  step: number
  title: string
  description: string
}

export interface Product {
  id: string
  sku: string
  name: string
  category: string
  description: string
  price: number
  image_url: string
  woo_url: string | null
  slug: string | null
  attributes: Record<string, unknown>
  in_stock: boolean
  created_at: string
}

export interface SmartSlabListing {
  id: string
  name: string
  material: string
  type: 'full_slab' | 'remnant'
  location: string
  sqft: number
  price: number
  image_url: string
  url: string
}

/** Four-pillar response structure for AI-DA ecosystem */
export type DesignBlockType =
  | 'visual_analysis'
  | 'external_inspiration'
  | 'ecosystem'
  | 'action_plan'
  /** legacy aliases */
  | 'analysis'
  | 'trend'
  | 'recommendation'
  | 'inspiration'
  | 'product'

export interface DesignBlock {
  type: DesignBlockType
  title: string
  text: string
  imageUrl?: string
  source?: string
  tags?: string[]
  /** action_plan only */
  steps?: ActionStep[]
  ctaLabel?: string
  ctaType?: 'estimate' | 'call' | 'virtual' | 'smartslab' | 'portfolio'
}

export interface StructuredChatResponse {
  intro: string
  blocks: DesignBlock[]
  products?: Product[]
  smartslabListings?: SmartSlabListing[]
  followUp?: string
  generatedImage?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  intro?: string
  blocks?: DesignBlock[]
  followUp?: string
  products?: Product[]
  smartslabListings?: SmartSlabListing[]
  imageUrl?: string
  imageUrls?: string[]
  generatedImage?: string
  isLoading?: boolean
  isError?: boolean
}

export interface AssistantResponse extends StructuredChatResponse {
  threadId: string
}

export interface Conversation {
  id: string
  thread_id: string
  session_id: string
  title: string
  created_at: string
  updated_at: string
}

export const BLOCK_SECTION_LABELS: Record<string, string> = {
  visual_analysis: '1 · Análisis visual',
  analysis: '1 · Análisis visual',
  external_inspiration: '2 · Inspiración externa',
  trend: '2 · Inspiración externa',
  ecosystem: '3 · Ecosistema All In',
  inspiration: '3 · Ecosistema All In',
  recommendation: '3 · Ecosistema All In',
  product: '3 · Ecosistema All In',
  action_plan: '4 · Plan de acción',
}
