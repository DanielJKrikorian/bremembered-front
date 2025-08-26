/*
  # Fix messages table RLS policy

  1. Policy Updates
    - Update RLS policies on `messages` table to use proper array operators
    - Replace set-returning functions with `= ANY()` operator for array containment checks
    - Ensure policies work correctly with PostgreSQL's restrictions

  2. Security
    - Maintain existing security model
    - Users can only view messages in conversations they participate in
    - Users can only send messages as themselves
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update read status" ON messages;

-- Create corrected policies using proper array operators
CREATE POLICY "Users can view conversation messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND auth.uid() = ANY(conversations.participant_ids)
    )
  );

CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 
      FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND auth.uid() = ANY(conversations.participant_ids)
    )
  );

CREATE POLICY "Users can update message read status"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND auth.uid() = ANY(conversations.participant_ids)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND auth.uid() = ANY(conversations.participant_ids)
    )
  );