/*
  # Update Products and Inventory Schema

  1. Changes
    - Simplify products table to focus on essential fields
    - Update inventory table structure
    - Add appropriate indexes for performance

  2. Security
    - Maintain existing RLS policies
*/

-- Update products table
ALTER TABLE products
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS category;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS products_sku_idx ON products(sku);
CREATE INDEX IF NOT EXISTS inventory_supplier_id_idx ON inventory(supplier_id);
CREATE INDEX IF NOT EXISTS inventory_product_id_idx ON inventory(product_id);

-- Add constraint to ensure positive quantities and prices
ALTER TABLE inventory
ADD CONSTRAINT positive_quantity CHECK (quantity >= 0),
ADD CONSTRAINT positive_price CHECK (price >= 0);

-- Update inventory table comments
COMMENT ON COLUMN inventory.price IS 'Price HT (excluding tax) in cents';
COMMENT ON COLUMN inventory.quantity IS 'Current stock quantity';