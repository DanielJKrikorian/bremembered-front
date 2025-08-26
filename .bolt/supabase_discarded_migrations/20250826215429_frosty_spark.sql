/*
  # Fix Messages Table Triggers

  This migration addresses triggers on the messages table that may be causing 
  set-returning function errors. We'll temporarily disable problematic triggers
  and recreate them with safer implementations.

  ## Changes Made
  1. Drop existing triggers that may use set-returning functions
  2. Recreate notification trigger with safer implementation
  3. Ensure all trigger functions avoid array operations in WHERE clauses

  ## Security
  - Maintains notification functionality
  - Avoids problematic array operations
  - Uses safer PostgreSQL patterns
*/

-- Drop existing triggers on messages table
DROP TRIGGER IF EXISTS "Vendor_Message_Notification" ON messages;
DROP TRIGGER IF EXISTS "message_notification_trigger" ON messages;

-- Create a safer notification trigger function
CREATE OR REPLACE FUNCTION create_safe_message_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple notification creation without complex array operations
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    priority
  )
  SELECT 
    cp.user_id,
    'new_message',
    'New message received',
    'You have a new message in your conversation',
    jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'sender_id', NEW.sender_id,
      'message_id', NEW.id
    ),
    'normal'
  FROM conversation_participants cp
  WHERE cp.conversation_id = NEW.conversation_id
    AND cp.user_id != NEW.sender_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new trigger with safer function
CREATE TRIGGER safe_message_notification_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_safe_message_notification();