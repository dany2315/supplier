/*
  # Update Products Schema

  1. Changes
    - Remove user_id column from products table
    - Update RLS policies to be based on supplier relationship
    - Add appropriate indexes

  2. Security
    - Update RLS policies to reflect new access control model
*/

-- Drop existing policies
DROP POLICY IF EXISTS "read_all_products" ON products;
DROP POLICY IF EXISTS "manage_own_products" ON products;

-- Remove user_id column
ALTER TABLE products DROP COLUMN IF EXISTS user_id;

-- Create new policies based on supplier relationship
CREATE POLICY "read_all_products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "manage_supplier_products"
  ON products
  FOR ALL
  TO authenticated
  USING (
    supplier_id IN (
      SELECT id FROM suppliers 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    supplier_id IN (
      SELECT id FROM suppliers 
      WHERE user_id = auth.uid()
    )
  );

-- Add index for supplier_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);