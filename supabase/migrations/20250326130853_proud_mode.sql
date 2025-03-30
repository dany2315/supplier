/*
  # Update Import Logs Schema

  1. Changes
    - Add total_rows column to track number of rows in import file
    - Add imported_rows column to track successfully imported rows
    - Add skipped_rows column to track skipped/invalid rows
    - Add updated_at column for tracking modifications
    - Add check constraints for non-negative counts
    - Add status validation

  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to import_logs table
ALTER TABLE import_logs
ADD COLUMN IF NOT EXISTS total_rows integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS imported_rows integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS skipped_rows integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add check constraints
ALTER TABLE import_logs
ADD CONSTRAINT positive_total_rows CHECK (total_rows >= 0),
ADD CONSTRAINT positive_imported_rows CHECK (imported_rows >= 0),
ADD CONSTRAINT positive_skipped_rows CHECK (skipped_rows >= 0),
ADD CONSTRAINT valid_import_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_import_logs_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_import_logs_timestamp
  BEFORE UPDATE ON import_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_import_logs_updated_at();

-- Add comments
COMMENT ON TABLE import_logs IS 'Tracks all product import operations';
COMMENT ON COLUMN import_logs.total_rows IS 'Total number of rows in the import file';
COMMENT ON COLUMN import_logs.imported_rows IS 'Number of rows successfully imported';
COMMENT ON COLUMN import_logs.skipped_rows IS 'Number of rows skipped due to validation errors';
COMMENT ON COLUMN import_logs.status IS 'Current status of the import (pending, processing, completed, failed)';
COMMENT ON COLUMN import_logs.started_at IS 'Timestamp when the import started';
COMMENT ON COLUMN import_logs.completed_at IS 'Timestamp when the import completed or failed';
COMMENT ON COLUMN import_logs.error_details IS 'JSON object containing error details if import failed';