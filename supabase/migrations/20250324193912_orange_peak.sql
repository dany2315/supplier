/*
  # Simplify Products Schema

  1. Changes
    - Remove inventory table
    - Update products table with new fields
    - Add supplier relationship
    - Add appropriate indexes

  2. Security
    - Maintain existing RLS policies
*/

-- Drop inventory table and its dependencies
DROP TABLE IF EXISTS inventory CASCADE;

-- Update products table
ALTER TABLE products
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS category;

ALTER TABLE products
ADD COLUMN supplier_id uuid REFERENCES suppliers(id),
ADD COLUMN stock integer NOT NULL DEFAULT 0,
ADD COLUMN price_ht decimal(10,2) NOT NULL DEFAULT 0.00,
ADD CONSTRAINT positive_stock CHECK (stock >= 0),
ADD CONSTRAINT positive_price CHECK (price_ht >= 0);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS products_supplier_id_idx ON products(supplier_id);
CREATE INDEX IF NOT EXISTS products_sku_idx ON products(sku);

-- Update products table comments
COMMENT ON COLUMN products.price_ht IS 'Price HT (excluding tax)';
COMMENT ON COLUMN products.stock IS 'Current stock quantity';