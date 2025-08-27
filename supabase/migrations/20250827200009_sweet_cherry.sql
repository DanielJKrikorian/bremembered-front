/*
  # Remove all triggers from messages table

  This migration removes all existing triggers from the messages table that are causing
  the supabase_functions.http_request errors. We'll rely on client-side notification
  handling instead of database triggers for now.

  1. Drop all existing triggers on messages table
  2. Drop associated trigger functions
  3. Clean up any remaining references
*/

-- Drop all triggers on the messages table
DROP TRIGGER IF EXISTS "Vendor_Message_Notification" ON messages;
DROP TRIGGER IF EXISTS message_notification_trigger ON messages;
DROP TRIGGER IF EXISTS message_email_notification_trigger ON messages;
DROP TRIGGER IF EXISTS safe_message_notification_trigger ON messages;
DROP TRIGGER IF EXISTS create_message_notification_trigger ON messages;

-- Drop the trigger functions
DROP FUNCTION IF EXISTS create_message_notification();
DROP FUNCTION IF EXISTS create_safe_message_notification();
DROP FUNCTION IF EXISTS send_message_email_notification();

-- Ensure no other triggers exist on messages table
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'messages' 
        AND event_object_schema = 'public'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trigger_record.trigger_name) || ' ON messages';
    END LOOP;
END $$;