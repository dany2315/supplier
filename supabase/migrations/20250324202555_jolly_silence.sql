/*
  # Fix Product Policies

  1. Changes
    - Drop existing policies if they exist
    - Create new policies with correct syntax
    - Ensure proper access control for products table

  2. Security
    - Maintain RLS for products table
    - Set up read and write policies
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read all products" ON products;
DROP POLICY IF EXISTS "Users can manage their products" ON products;

-- Create new policies with correct syntax
CREATE POLICY "read_all_products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "manage_own_products"
  ON products
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);