@@ .. @@
-DROP TRIGGER IF EXISTS send_message_email_webhook_trigger ON messages;
+DROP TRIGGER IF EXISTS message_email_webhook_trigger ON messages;

-- Drop the function that uses pg_net
DROP FUNCTION IF EXISTS send_message_email_webhook();