/*
  # Add couple wedding reminder cron job

  1. Cron Job
    - Runs daily at 8 AM EST to send wedding countdown reminders to couples
    - Sends excitement-building emails at 30, 15, 7, 2 days before and day of wedding
    - Groups multiple bookings per couple into one consolidated email
    - Prevents duplicate emails by checking email_logs table
*/

-- Add cron job to send couple wedding reminders daily at 8 AM EST
SELECT cron.schedule(
  'send-couple-wedding-reminders',
  '0 13 * * *', -- 1 PM UTC = 8 AM EST
  $$
  SELECT
    net.http_post(
      url:='https://eecbrvehrhrvdzuutliq.supabase.co/functions/v1/send-couple-reminders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlY2JydmVocmhydmR6dXV0bGlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQ4NjYzOCwiZXhwIjoyMDYwMDYyNjM4fQ.1FEbdFSWxQLQDqmA0CSquYiM3Wy3tOVjXM1EUnPh4MM"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);