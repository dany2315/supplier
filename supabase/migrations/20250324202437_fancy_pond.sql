/*
  # Update Products Schema

  1. Changes
    - Ensure products table has correct columns after inventory removal
    - Add supplier relationship to products
    - Add stock and price columns to products

  2. Security
    - Add RLS policies for the updated schema
*/

-- Ensure products table has correct structure
ALTER TABLE products
ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES suppliers(id),
ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_ht decimal(10,2) NOT NULL DEFAULT 0.00;

-- Add constraints if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'positive_stock'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT positive_stock CHECK (stock >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'positive_price'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT positive_price CHECK (price_ht >= 0);
  END IF;
END $$;

-- Create index for supplier_id if it doesn't exist
CREATE INDEX IF NOT EXISTS products_supplier_id_idx ON products(supplier_id);

-- Update RLS policies
CREATE POLICY IF NOT EXISTS "Users can read all products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can manage their products"
  ON products
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);