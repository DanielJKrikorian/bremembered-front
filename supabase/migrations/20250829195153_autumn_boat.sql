/*
  # Add vendor booking reminder cron job

  1. Cron Job
    - Runs daily at 9:00 AM EST to send vendor booking reminders
    - Sends reminders at 30, 15, 7, 2 days before and day of event
    - Uses pg_cron extension to schedule automatic execution

  2. Function Call
    - Calls the send-vendor-reminders edge function
    - Processes all upcoming bookings and sends appropriate reminders
    - Tracks sent emails to prevent duplicates
*/

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the vendor reminder function to run daily at 9:00 AM EST
-- This will send reminders for bookings at 30, 15, 7, 2 days before and day of event
SELECT cron.schedule(
  'vendor-booking-reminders',
  '0 14 * * *', -- 9:00 AM EST = 14:00 UTC (accounting for EST timezone)
  $$
  SELECT
    net.http_post(
      url := 'https://eecbrvehrhrvdzuutliq.supabase.co/functions/v1/send-vendor-reminders',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlY2JydmVocmhydmR6dXV0bGlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQ4NjYzOCwiZXhwIjoyMDYwMDYyNjM4fQ.1FEbdFSWxQLQDqmA0CSquYiM3Wy3tOVjXM1EUnPh4MM"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);