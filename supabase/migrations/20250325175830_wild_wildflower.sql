/*
  # Add Import Logs Table

  1. New Tables
    - `import_logs`
      - Track all supplier import operations
      - Store import statistics and status
      - Link to suppliers

  2. Security
    - Enable RLS on import_logs table
    - Add policies for authenticated users
*/

-- Create import_logs table
CREATE TABLE IF NOT EXISTS import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE,
  file_name text,
  status text NOT NULL,
  total_rows integer NOT NULL DEFAULT 0,
  imported_rows integer NOT NULL DEFAULT 0,
  skipped_rows integer NOT NULL DEFAULT 0,
  error_details jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read import logs for their suppliers"
  ON import_logs
  FOR SELECT
  TO authenticated
  USING (
    supplier_id IN (
      SELECT id FROM suppliers 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create import logs for their suppliers"
  ON import_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    supplier_id IN (
      SELECT id FROM suppliers 
      WHERE user_id = auth.uid()
    )
  );

-- Add indexes for better performance
CREATE INDEX idx_import_logs_supplier_id ON import_logs(supplier_id);
CREATE INDEX idx_import_logs_status ON import_logs(status);
CREATE INDEX idx_import_logs_created_at ON import_logs(created_at);

-- Add comments
COMMENT ON TABLE import_logs IS 'Tracks all supplier data import operations';
COMMENT ON COLUMN import_logs.status IS 'Current status of the import (pending, processing, completed, failed)';
COMMENT ON COLUMN import_logs.total_rows IS 'Total number of rows in the import file';
COMMENT ON COLUMN import_logs.imported_rows IS 'Number of rows successfully imported';
COMMENT ON COLUMN import_logs.skipped_rows IS 'Number of rows skipped due to validation errors';