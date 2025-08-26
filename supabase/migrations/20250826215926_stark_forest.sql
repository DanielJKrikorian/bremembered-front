/*
  # Add Message Email Notifications

  This migration adds back email notification functionality for messages while maintaining
  the safe trigger approach that avoids set-returning function errors.

  ## Changes Made
  1. Create a safe email notification trigger function
  2. Add trigger to send emails when messages are sent
  3. Maintain both in-app and email notifications

  ## Security
  - Uses conversation_participants table for safe access control
  - Avoids array operations that cause set-returning function errors
  - Maintains existing notification functionality
*/

-- Create email notification trigger function for messages
CREATE OR REPLACE FUNCTION send_message_email_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_user_id uuid;
  sender_name text;
  recipient_email text;
BEGIN
  -- Get the recipient (other participant in the conversation)
  SELECT user_id INTO recipient_user_id
  FROM conversation_participants 
  WHERE conversation_id = NEW.conversation_id 
    AND user_id != NEW.sender_id
  LIMIT 1;

  -- Skip if no recipient found
  IF recipient_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get sender name from auth.users
  SELECT COALESCE(raw_user_meta_data->>'name', email) INTO sender_name
  FROM auth.users 
  WHERE id = NEW.sender_id;

  -- Get recipient email
  SELECT email INTO recipient_email
  FROM auth.users 
  WHERE id = recipient_user_id;

  -- Skip if no email found
  IF recipient_email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Call the email notification edge function
  PERFORM supabase_functions.http_request(
    'https://eecbrvehrhrvdzuutliq.supabase.co/functions/v1/send-message-notifications',
    'POST',
    '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlY2JydmVocmhydmR6dXV0bGlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQ4NjYzOCwiZXhwIjoyMDYwMDYyNjM4fQ.1FEbdFSWxQLQDqmA0CSquYiM3Wy3tOVjXM1EUnPh4MM"}',
    '{}',
    '5000'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add email notification trigger
CREATE TRIGGER message_email_notification_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION send_message_email_notification();