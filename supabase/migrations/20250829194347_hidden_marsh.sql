/*
  # Add automatic review request email system

  1. New Functions
    - Creates a cron job to automatically send review request emails
    - Runs daily to check for bookings from the previous day
    - Sends personalized emails to couples encouraging reviews

  2. Cron Job Setup
    - Scheduled to run daily at 10 AM
    - Checks for confirmed bookings from the previous day
    - Prevents duplicate emails by checking email_logs table

  3. Email Integration
    - Uses Resend API for email delivery
    - Logs all sent emails in email_logs table
    - Includes booking details and direct link to review page
*/

-- Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job to send review request emails daily at 10 AM
SELECT cron.schedule(
  'send-review-request-emails',
  '0 10 * * *', -- Daily at 10 AM
  $$
  SELECT
    net.http_post(
      url := 'https://eecbrvehrhrvdzuutliq.supabase.co/functions/v1/send-review-request-emails',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlY2JydmVocmhydmR6dXV0bGlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQ4NjYzOCwiZXhwIjoyMDYwMDYyNjM4fQ.1FEbdFSWxQLQDqmA0CSquYiM3Wy3tOVjXM1EUnPh4MM"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Add a new email type for review requests if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'email_logs_type_check' 
    AND check_clause LIKE '%review_request%'
  ) THEN
    -- Drop the existing constraint
    ALTER TABLE email_logs DROP CONSTRAINT IF EXISTS email_logs_type_check;
    
    -- Add the new constraint with review_request included
    ALTER TABLE email_logs ADD CONSTRAINT email_logs_type_check 
    CHECK (type::text = ANY (ARRAY['reminder'::character varying, 'feedback'::character varying, 'followup'::character varying, 'review_request'::character varying]::text[]));
  END IF;
END $$;