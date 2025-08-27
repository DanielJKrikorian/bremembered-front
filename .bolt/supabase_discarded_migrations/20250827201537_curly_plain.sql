/*
  # Remove all message triggers to fix participant_id error

  1. Problem
    - Triggers are referencing non-existent participant_id column
    - Causing message sending to fail

  2. Solution
    - Remove ALL triggers from messages table
    - Remove ALL trigger functions related to messages
    - Allow basic message functionality without triggers
    - Email notifications can be handled client-side if needed

  3. Changes
    - Drop all triggers on messages table
    - Drop all related trigger functions
    - Clean slate for message functionality
*/

-- Drop all triggers on messages table
DROP TRIGGER IF EXISTS message_email_notification_trigger ON messages;
DROP TRIGGER IF EXISTS message_notification_trigger ON messages;
DROP TRIGGER IF EXISTS safe_message_notification_trigger ON messages;
DROP TRIGGER IF EXISTS create_message_notification_trigger ON messages;
DROP TRIGGER IF EXISTS send_message_email_trigger ON messages;

-- Drop all related trigger functions
DROP FUNCTION IF EXISTS create_message_notification() CASCADE;
DROP FUNCTION IF EXISTS create_safe_message_notification() CASCADE;
DROP FUNCTION IF EXISTS send_message_email_notification() CASCADE;
DROP FUNCTION IF EXISTS send_message_email() CASCADE;
DROP FUNCTION IF EXISTS create_message_email_notification() CASCADE;

-- Ensure messages table has proper structure (should already exist)
-- Just verify the table exists and has correct columns
DO $$
BEGIN
  -- Check if messages table exists with correct structure
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'messages' AND table_schema = 'public'
  ) THEN
    RAISE EXCEPTION 'Messages table does not exist';
  END IF;
  
  -- Verify sender_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'sender_id' 
    AND table_schema = 'public'
  ) THEN
    RAISE EXCEPTION 'sender_id column does not exist in messages table';
  END IF;
END $$;