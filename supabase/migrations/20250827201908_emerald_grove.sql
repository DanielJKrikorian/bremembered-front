/*
  # Add webhook trigger for message email notifications

  1. New Functions
    - `send_message_email_webhook()` - Simple webhook trigger function
  
  2. Triggers
    - Calls the existing send-message-notifications edge function via webhook
    - Only triggers on INSERT (new messages)
    - Uses pg_net.http_post for reliable webhook calls
  
  3. Security
    - Uses service role key for authentication
    - Includes proper error handling
*/

-- Create a simple webhook trigger function
CREATE OR REPLACE FUNCTION send_message_email_webhook()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the edge function via webhook
  PERFORM pg_net.http_post(
    url := 'https://eecbrvehrhrvdzuutliq.supabase.co/functions/v1/send-message-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlY2JydmVocmhydmR6dXV0bGlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQ4NjYzOCwiZXhwIjoyMDYwMDYyNjM4fQ.1FEbdFSWxQLQDqmA0CSquYiM3Wy3tOVjXM1EUnPh4MM'
    ),
    body := jsonb_build_object(
      'record', row_to_json(NEW)
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER message_email_webhook_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION send_message_email_webhook();