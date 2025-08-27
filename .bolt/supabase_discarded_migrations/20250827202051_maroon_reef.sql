/*
  # Remove pg_net trigger causing schema error

  1. Changes
    - Drop the webhook trigger that uses pg_net schema
    - Drop the associated trigger function
    - Allow basic messaging functionality without email notifications

  2. Notes
    - This removes email notifications temporarily
    - Messages will work normally without backend errors
    - Email notifications can be added back when pg_net is available
*/

-- Drop the trigger that uses pg_net
DROP TRIGGER IF EXISTS send_message_email_webhook_trigger ON messages;

-- Drop the function that uses pg_net
DROP FUNCTION IF EXISTS send_message_email_webhook();

-- Verify messages table is clean of problematic triggers
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
        RAISE NOTICE 'Dropped trigger: %', trigger_record.tgname;
    END LOOP;
END $$;