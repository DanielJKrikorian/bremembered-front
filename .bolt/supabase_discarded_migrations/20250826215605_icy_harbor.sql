/*
  # Re-enable Messages RLS and Add Notification Trigger

  This migration re-enables RLS on the messages table with safe policies and adds
  a trigger to create notifications when new messages are sent.

  ## Changes Made
  1. Re-enable RLS on messages table
  2. Create safe RLS policies using conversation_participants table
  3. Add trigger to create notifications for new messages
  4. Ensure proper notification functionality

  ## Security
  - Users can only access messages from conversations they participate in
  - Users can only send messages to conversations they participate in
  - Notifications are created for message recipients
*/

-- Re-enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create safe RLS policies using conversation_participants table
CREATE POLICY "messages_select_safe"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert_safe"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() 
    AND conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "messages_update_safe"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Create function to handle message notifications
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id uuid;
  sender_name text;
  conversation_name text;
BEGIN
  -- Get the recipient (other participant in the conversation)
  SELECT user_id INTO recipient_id
  FROM conversation_participants
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id
  LIMIT 1;

  -- Skip if no recipient found
  IF recipient_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get sender name from couples or vendors table
  SELECT COALESCE(c.name, v.name, 'Unknown User') INTO sender_name
  FROM auth.users u
  LEFT JOIN couples c ON c.user_id = u.id
  LEFT JOIN vendors v ON v.user_id = u.id
  WHERE u.id = NEW.sender_id;

  -- Get conversation name or use sender name
  SELECT COALESCE(conv.name, sender_name) INTO conversation_name
  FROM conversations conv
  WHERE conv.id = NEW.conversation_id;

  -- Create notification for the recipient
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    action_url,
    priority
  ) VALUES (
    recipient_id,
    'new_message',
    'New message from ' || sender_name,
    LEFT(NEW.message_text, 100) || CASE WHEN LENGTH(NEW.message_text) > 100 THEN '...' ELSE '' END,
    jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'sender_id', NEW.sender_id,
      'sender_name', sender_name,
      'message_id', NEW.id
    ),
    '/profile?tab=messages',
    'normal'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for message notifications
CREATE TRIGGER message_notification_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();