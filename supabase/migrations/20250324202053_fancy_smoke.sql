/*
  # Drop inventory table

  1. Changes
    - Drop the inventory table and its dependencies
    - Remove foreign key constraints referencing the inventory table
    - Remove indexes associated with the inventory table

  2. Security
    - No security changes required as table is being removed
*/

-- Drop inventory table if it exists
DROP TABLE IF EXISTS inventory CASCADE;