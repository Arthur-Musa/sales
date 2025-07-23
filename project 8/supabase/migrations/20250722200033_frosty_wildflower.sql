/*
  # Add metadata column to users table

  1. Changes
    - Add `metadata` column to `users` table (jsonb type)
    - Set default value to empty JSON object
    - Allow null values for backward compatibility

  2. Purpose
    - Store invitation tokens and related metadata
    - Support user invitation workflow
    - Enable extensible user data storage
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE users ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;