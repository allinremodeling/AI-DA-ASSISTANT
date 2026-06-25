/*
# Add woo_url column to products table

1. Modified Tables
- `products`
  - Add `woo_url` (text) - URL to WooCommerce product page
  - Add `slug` (text) - WooCommerce product slug

2. Security
- Existing RLS policies remain unchanged.
*/

ALTER TABLE products ADD COLUMN IF NOT EXISTS woo_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug text;

UPDATE products SET woo_url = 'https://allinremodeling.us/product/white-shaker-base-cabinet-24/', slug = 'white-shaker-base-cabinet-24' WHERE sku = 'CAB-001';
UPDATE products SET woo_url = 'https://allinremodeling.us/product/white-shaker-base-cabinet-30/', slug = 'white-shaker-base-cabinet-30' WHERE sku = 'CAB-002';
UPDATE products SET woo_url = 'https://allinremodeling.us/product/white-shaker-base-cabinet-36/', slug = 'white-shaker-base-cabinet-36' WHERE sku = 'CAB-003';
UPDATE products SET woo_url = 'https://allinremodeling.us/product/white-shaker-wall-cabinet-30/', slug = 'white-shaker-wall-cabinet-30' WHERE sku = 'CAB-004';
UPDATE products SET woo_url = 'https://allinremodeling.us/product/white-shaker-wall-cabinet-36/', slug = 'white-shaker-wall-cabinet-36' WHERE sku = 'CAB-005';
UPDATE products SET woo_url = 'https://allinremodeling.us/product/navy-shaker-base-cabinet-24/', slug = 'navy-shaker-base-cabinet-24' WHERE sku = 'CAB-006';
UPDATE products SET woo_url = 'https://allinremodeling.us/product/navy-shaker-base-cabinet-30/', slug = 'navy-shaker-base-cabinet-30' WHERE sku = 'CAB-007';
UPDATE products SET woo_url = 'https://allinremodeling.us/product/navy-shaker-base-cabinet-36/', slug = 'navy-shaker-base-cabinet-36' WHERE sku = 'CAB-008';
UPDATE products SET woo_url = 'https://allinremodeling.us/product/gray-shaker-base-cabinet-24/', slug = 'gray-shaker-base-cabinet-24' WHERE sku = 'CAB-009';
UPDATE products SET woo_url = 'https://allinremodeling.us/product/gray-shaker-base-cabinet-30/', slug = 'gray-shaker-base-cabinet-30' WHERE sku = 'CAB-010';
UPDATE products SET woo_url = 'https://allinremodeling.us/product/calacatta-white-quartz-55x22/', slug = 'calacatta-white-quartz-55x22' WHERE sku = 'QZ-001';
UPDATE products SET woo_url = 'https://allinremodeling.us/product/calacatta-white-quartz-72x22/', slug = 'calacatta-white-quartz-72x22' WHERE sku = 'QZ-002';
UPDATE products SET woo_url = 'https://allinremodeling.us/product/calacatta-white-quartz-96x22/', slug = 'calacatta-white-quartz-96x22' WHERE sku = 'QZ-003';
UPDATE products SET woo_url = 'https://allinremodeling.us/product/arabescato-white-quartz-55x22/', slug = 'arabescato-white-quartz-55x22' WHERE sku = 'QZ-004';
UPDATE products SET woo_url = 'https://allinremodeling.us/product/arabescato-white-quartz-72x22/', slug = 'arabescato-white-quartz-72x22' WHERE sku = 'QZ-005';
UPDATE products SET woo_url = 'https://allinremodeling.us/product/carrara-white-quartz-55x22/', slug = 'carrara-white-quartz-55x22' WHERE sku = 'QZ-006';
UPDATE products SET woo_url = 'https://allinremodeling.us/product/carrara-white-quartz-72x22/', slug = 'carrara-white-quartz-72x22' WHERE sku = 'QZ-007';
UPDATE products SET woo_url = 'https://allinremodeling.us/product/dark-gray-quartz-55x22/', slug = 'dark-gray-quartz-55x22' WHERE sku = 'QZ-008';
UPDATE products SET woo_url = 'https://allinremodeling.us/product/dark-gray-quartz-72x22/', slug = 'dark-gray-quartz-72x22' WHERE sku = 'QZ-009';
UPDATE products SET woo_url = 'https://allinremodeling.us/product/black-marble-quartz-55x22/', slug = 'black-marble-quartz-55x22' WHERE sku = 'QZ-010';
