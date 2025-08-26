/*
  # Fix messages table read_by column

  1. Schema Updates
    - Ensure read_by column is properly configured as uuid array
    - Add proper default value and constraints
    - Update any problematic indexes or triggers

  2. Security
    - Maintain existing RLS policies
    - Ensure proper access controls
*/

-- Ensure the read_by column has proper default and constraints
DO $$
BEGIN
  -- Update the read_by column to ensure it has proper default
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'read_by'
  ) THEN
    ALTER TABLE messages ALTER COLUMN read_by SET DEFAULT '{}';
    ALTER TABLE messages ALTER COLUMN read_by SET NOT NULL;
  END IF;
END $$;

-- Create a simple function to check if a message is read by a user
CREATE OR REPLACE FUNCTION is_message_read_by_user(message_read_by uuid[], user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT user_uuid = ANY(message_read_by);
$$;

-- Create an index for better performance on read_by queries
CREATE INDEX IF NOT EXISTS idx_messages_read_by_gin ON messages USING gin(read_by);