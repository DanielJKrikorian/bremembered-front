/*
  # Create message notification trigger

  1. New Trigger
    - `message_notification_trigger` on `messages` table
    - Triggers AFTER INSERT on new messages
    - Calls the send-message-notifications edge function

  2. Function Call
    - Uses supabase_functions.http_request to call edge function
    - Passes message data as JSON payload
    - 5 second timeout for reliable delivery
*/

-- Create trigger to send message notifications
CREATE TRIGGER message_notification_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://eecbrvehrhrvdzuutliq.supabase.co/functions/v1/send-message-notifications',
    'POST',
    '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlY2JydmVocmhydmR6dXV0bGlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQ4NjYzOCwiZXhwIjoyMDYwMDYyNjM4fQ.1FEbdFSWxQLQDqmA0CSquYiM3Wy3tOVjXM1EUnPh4MM"}',
    '{}',
    '5000'
  );