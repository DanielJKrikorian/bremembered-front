/*
  # Fix message triggers and add email notifications

  1. Remove all existing problematic triggers
  2. Add proper trigger for email notifications
  3. Ensure notifications work without HTTP request errors

  This migration removes all triggers that use supabase_functions.http_request
  and replaces them with a proper trigger that calls our edge function.
*/

-- Drop all existing triggers on messages table
DROP TRIGGER IF EXISTS message_email_notification_trigger ON messages;
DROP TRIGGER IF EXISTS message_notification_trigger ON messages;
DROP TRIGGER IF EXISTS safe_message_notification_trigger ON messages;
DROP TRIGGER IF EXISTS send_message_notification_trigger ON messages;

-- Drop all existing trigger functions that might be problematic
DROP FUNCTION IF EXISTS send_message_email_notification() CASCADE;
DROP FUNCTION IF EXISTS create_message_notification() CASCADE;
DROP FUNCTION IF EXISTS create_safe_message_notification() CASCADE;
DROP FUNCTION IF EXISTS send_message_notification() CASCADE;

-- Get all triggers on messages table and drop them dynamically
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'messages'::regclass
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.tgname || ' ON messages';
    END LOOP;
END $$;

-- Create a simple trigger function that calls our edge function
CREATE OR REPLACE FUNCTION trigger_message_email_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the edge function asynchronously using pg_net
  PERFORM net.http_post(
    url := 'https://eecbrvehrhrvdzuutliq.supabase.co/functions/v1/send-message-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlY2JydmVocmhydmR6dXV0bGlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQ4NjYzOCwiZXhwIjoyMDYwMDYyNjM4fQ.1FEbdFSWxQLQDqmA0CSquYiM3Wy3tOVjXM1EUnPh4MM"}'::jsonb,
    body := json_build_object('record', row_to_json(NEW))::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER message_email_notification_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_message_email_notification();

-- Also create in-app notifications
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id uuid;
  sender_name text;
BEGIN
  -- Get the recipient (participant who is not the sender)
  SELECT participant_id INTO recipient_id
  FROM conversation_participants cp
  WHERE cp.conversation_id = NEW.conversation_id
    AND cp.user_id != NEW.sender_id
  LIMIT 1;
  
  -- Get sender name
  SELECT COALESCE(v.name, c.name, 'Unknown User') INTO sender_name
  FROM auth.users u
  LEFT JOIN vendors v ON v.user_id = u.id
  LEFT JOIN couples c ON c.user_id = u.id
  WHERE u.id = NEW.sender_id;
  
  -- Create notification if we have a recipient
  IF recipient_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data,
      priority
    ) VALUES (
      recipient_id,
      'new_message',
      'New message from ' || COALESCE(sender_name, 'Unknown User'),
      LEFT(NEW.message_text, 100) || CASE WHEN LENGTH(NEW.message_text) > 100 THEN '...' ELSE '' END,
      json_build_object(
        'conversation_id', NEW.conversation_id,
        'message_id', NEW.id,
        'sender_id', NEW.sender_id,
        'sender_name', sender_name
      ),
      'normal'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the notification trigger
CREATE TRIGGER create_message_notification_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();