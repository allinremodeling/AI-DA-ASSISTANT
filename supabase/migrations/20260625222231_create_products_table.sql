/*
# Crear tabla de productos para inventario de All In Remodeling

1. New Tables
- `products`
  - `id` (uuid, primary key)
  - `sku` (text, unique) - codigo de producto
  - `name` (text, not null) - nombre del producto
  - `category` (text) - categoria: cabinet, quartz, accessory, etc.
  - `description` (text) - descripcion detallada
  - `price` (numeric) - precio
  - `image_url` (text) - URL de imagen
  - `attributes` (jsonb) - atributos como color, material, finish, etc.
  - `in_stock` (boolean, default true)
  - `created_at` (timestamp)

2. Security
- Enable RLS on `products`.
- Allow anon + authenticated read access (public product catalog).
- Admin insert/update/delete (not implemented yet, handled via service role).
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  image_url text,
  attributes jsonb DEFAULT '{}',
  in_stock boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);
