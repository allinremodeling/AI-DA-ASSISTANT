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

/** Five-card response structure for AI-DA ecosystem */
export type DesignBlockType =
  | 'analysis'
  | 'inspiration'
  | 'recommendation'
  | 'marketplace'
  | 'action_plan'
  /** legacy aliases */
  | 'visual_analysis'
  | 'external_inspiration'
  | 'ecosystem'
  | 'smartslab'
  | 'trend'
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
  originalImage?: string
  editPhotoApplied?: boolean
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
  originalImage?: string
  editPhotoApplied?: boolean
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
  analysis: '1 · Análisis',
  visual_analysis: '1 · Análisis',
  inspiration: '2 · Inspiración AI-DA',
  external_inspiration: '2 · Inspiración AI-DA',
  trend: '2 · Inspiración AI-DA',
  recommendation: '3 · Recomendación AI-DA',
  ecosystem: '3 · Recomendación AI-DA',
  product: '3 · Recomendación AI-DA',
  marketplace: '4 · Smart Slab',
  smartslab: '4 · Smart Slab',
  action_plan: '5 · Plan de acción',
}
