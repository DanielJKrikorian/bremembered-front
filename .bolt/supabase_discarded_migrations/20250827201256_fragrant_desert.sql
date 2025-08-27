@@ .. @@
 /*
   # Fix message triggers - remove participant_id column references
 
   This migration fixes the trigger functions that were referencing a non-existent 
   participant_id column, causing errors when sending messages.
 
   1. Drop existing problematic triggers and functions
   2. Create new safe trigger functions that use correct column names
   3. Add triggers for both email notifications and in-app notifications
 */
 
+-- Drop triggers first (they depend on the functions)
+DROP TRIGGER IF EXISTS create_message_notification_trigger ON messages;
+DROP TRIGGER IF EXISTS send_message_email_trigger ON messages;
+
 -- Drop existing problematic functions
 DROP FUNCTION IF EXISTS create_message_notification() CASCADE;
 DROP FUNCTION IF EXISTS send_message_email_notification() CASCADE;