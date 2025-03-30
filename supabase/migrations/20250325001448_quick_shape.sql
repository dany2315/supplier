/*
  # Add Field Mappings Table

  1. New Tables
    - `field_mappings`
      - Maps supplier file columns to database fields
      - Stores the mapping configuration for each supplier

  2. Security
    - Enable RLS on field_mappings table
    - Add policies for authenticated users
*/

-- Create field mappings table
CREATE TABLE IF NOT EXISTS field_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE,
  source_column text NOT NULL,
  target_field text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(supplier_id, target_field)
);

-- Enable RLS
ALTER TABLE field_mappings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read field mappings for their suppliers"
  ON field_mappings
  FOR SELECT
  TO authenticated
  USING (
    supplier_id IN (
      SELECT id FROM suppliers 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage field mappings for their suppliers"
  ON field_mappings
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

-- Add index for better performance
CREATE INDEX idx_field_mappings_supplier_id ON field_mappings(supplier_id);

-- Add comment
COMMENT ON TABLE field_mappings IS 'Stores the mapping between CSV columns and database fields for each supplier';