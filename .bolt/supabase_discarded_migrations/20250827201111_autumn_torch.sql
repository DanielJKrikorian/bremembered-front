/*
  # Fix participant_id column error in message triggers

  1. Problem
    - Trigger functions are referencing non-existent `participant_id` column
    - Should use `conversation_participants` table to find recipients

  2. Solution
    - Update trigger functions to use correct table relationships
    - Use `conversation_participants` table to find message recipients
    - Remove any references to non-existent columns
*/

-- Drop existing problematic triggers and functions
DROP TRIGGER IF EXISTS message_email_notification_trigger ON messages;
DROP TRIGGER IF EXISTS message_notification_trigger ON messages;
DROP FUNCTION IF EXISTS send_message_email_notification();
DROP FUNCTION IF EXISTS create_message_notification();

-- Create corrected email notification function
CREATE OR REPLACE FUNCTION send_message_email_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the email edge function using pg_net
  PERFORM pg_net.http_post(
    url := 'https://eecbrvehrhrvdzuutliq.supabase.co/functions/v1/send-message-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlY2JydmVocmhydmR6dXV0bGlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQ4NjYzOCwiZXhwIjoyMDYwMDYyNjM4fQ.1FEbdFSWxQLQDqmA0CSquYiM3Wy3tOVjXM1EUnPh4MM"}'::jsonb,
    body := jsonb_build_object(
      'record', jsonb_build_object(
        'id', NEW.id,
        'sender_id', NEW.sender_id,
        'message_text', NEW.message_text,
        'timestamp', NEW.timestamp,
        'conversation_id', NEW.conversation_id
      )
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create corrected in-app notification function
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_user_id uuid;
BEGIN
  -- Find the recipient from conversation_participants (not the sender)
  SELECT cp.user_id INTO recipient_user_id
  FROM conversation_participants cp
  WHERE cp.conversation_id = NEW.conversation_id
    AND cp.user_id != NEW.sender_id
  LIMIT 1;

  -- Only create notification if we found a recipient
  IF recipient_user_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data,
      read,
      created_at
    ) VALUES (
      recipient_user_id,
      'message',
      'New Message',
      'You have a new message',
      jsonb_build_object(
        'conversation_id', NEW.conversation_id,
        'message_id', NEW.id,
        'sender_id', NEW.sender_id
      ),
      false,
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the triggers with corrected functions
CREATE TRIGGER message_email_notification_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION send_message_email_notification();

CREATE TRIGGER message_notification_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();