import { pgTable, uuid, text, numeric, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  sku: text('sku').unique().notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull().default('0'),
  image_url: text('image_url'),
  attributes: jsonb('attributes').default({}),
  in_stock: boolean('in_stock').notNull().default(true),
  woo_url: text('woo_url'),
  slug: text('slug'),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
})

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  thread_id: text('thread_id').unique().notNull(),
  session_id: text('session_id').notNull(),
  title: text('title').default('Nueva conversación'),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
})

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversation_id: uuid('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  content: text('content').notNull(),
  image_url: text('image_url'),
  products: jsonb('products').default([]),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
})

export type Product = typeof products.$inferSelect
export type Conversation = typeof conversations.$inferSelect
export type Message = typeof messages.$inferSelect
