/*
  # Create support inquiry email trigger

  1. New Trigger
    - `support_inquiry_email_trigger` on `support_inquiries` table
    - Triggers AFTER INSERT to send confirmation and alert emails
    - Calls the `send-support-inquiry-emails` edge function
    - Includes 5 second timeout for reliability

  2. Functionality
    - Automatically sends confirmation email to customer
    - Sends alert email to admin (Daniel@brememberedproductions.com)
    - Triggers immediately when new support inquiry is submitted
    - Uses Resend API through edge function for reliable delivery
*/

CREATE OR REPLACE TRIGGER support_inquiry_email_trigger
  AFTER INSERT ON support_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://eecbrvehrhrvdzuutliq.supabase.co/functions/v1/send-support-inquiry-emails',
    'POST',
    '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlY2JydmVocmhydmR6dXV0bGlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQ4NjYzOCwiZXhwIjoyMDYwMDYyNjM4fQ.1FEbdFSWxQLQDqmA0CSquYiM3Wy3tOVjXM1EUnPh4MM"}',
    '{}',
    '5000'
  );