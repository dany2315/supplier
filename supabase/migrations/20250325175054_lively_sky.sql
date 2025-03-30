/*
  # Update Field Mappings Schema

  1. Changes
    - Add unique constraint for supplier_id and target_field
    - Add validation for required fields
    - Add indexes for better performance

  2. Security
    - Maintain existing RLS policies
*/

-- Add unique constraint to prevent duplicate mappings
ALTER TABLE field_mappings
ADD CONSTRAINT unique_supplier_field_mapping UNIQUE (supplier_id, target_field);

-- Add check constraint for required fields
ALTER TABLE field_mappings
ADD CONSTRAINT valid_target_field CHECK (
  target_field IN ('sku', 'name', 'price_ht', 'stock')
);

-- Add comment
COMMENT ON TABLE field_mappings IS 'Maps supplier CSV columns to system fields';