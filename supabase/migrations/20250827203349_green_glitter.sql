/*
  # Reset Message and Notification Triggers

  1. Changes
    - Remove all message-related triggers that cause errors
    - Remove notification trigger functions
    - Clean up any problematic triggers on messages table
    - Allow external webhook handling of notifications

  2. Security
    - Maintain existing RLS policies on messages table
    - Keep message functionality intact
    - Remove only trigger dependencies
*/

-- Drop all message-related triggers first
DROP TRIGGER IF EXISTS message_email_notification_trigger ON messages;
DROP TRIGGER IF EXISTS message_notification_trigger ON messages;
DROP TRIGGER IF EXISTS safe_message_notification_trigger ON messages;
DROP TRIGGER IF EXISTS message_email_webhook_trigger ON messages;
DROP TRIGGER IF EXISTS send_message_email_webhook_trigger ON messages;

-- Drop any other notification triggers that might exist
DROP TRIGGER IF EXISTS create_message_notification_trigger ON messages;
DROP TRIGGER IF EXISTS send_message_notification_trigger ON messages;

-- Now drop the functions (no dependencies left)
DROP FUNCTION IF EXISTS send_message_email_notification();
DROP FUNCTION IF EXISTS create_message_notification();
DROP FUNCTION IF EXISTS create_safe_message_notification();
DROP FUNCTION IF EXISTS send_message_email_webhook();
DROP FUNCTION IF EXISTS message_email_webhook();

-- Clean up any remaining problematic triggers on messages table
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'messages'::regclass
        AND tgname LIKE '%notification%'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.tgname || ' ON messages CASCADE';
        RAISE NOTICE 'Dropped notification trigger: %', trigger_record.tgname;
    END LOOP;
END $$;

-- Verify messages table structure is intact
DO $$
BEGIN
    -- Check that essential columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'sender_id'
    ) THEN
        RAISE EXCEPTION 'Messages table missing sender_id column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'conversation_id'
    ) THEN
        RAISE EXCEPTION 'Messages table missing conversation_id column';
    END IF;
    
    RAISE NOTICE 'Messages table structure verified - ready for external webhook handling';
END $$;