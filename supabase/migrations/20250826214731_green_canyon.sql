/*
  # Fix Messages RLS Policy Conflict

  This migration fixes the policy name conflict by dropping the existing policy
  and creating new ones with different names to avoid set-returning function errors.

  ## Changes Made
  1. Drop the conflicting policy by exact name
  2. Create new policies with unique names
  3. Use conversation_participants table for cleaner joins
  4. Avoid array operations that cause set-returning function errors

  ## Security
  - Users can only see messages from conversations they participate in
  - Users can only send messages to conversations they participate in
  - Users can only update read status for messages in their conversations
*/

-- Drop the specific conflicting policy
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;

-- Drop all other existing RLS policies for messages table
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_update_policy" ON messages;
DROP POLICY IF EXISTS "Allow authenticated users to insert messages" ON messages;
DROP POLICY IF EXISTS "Allow authenticated users to read messages" ON messages;
DROP POLICY IF EXISTS "Allow authenticated users to update messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update read status" ON messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;

-- Create new RLS policies with unique names that avoid set-returning functions
CREATE POLICY "message_select_by_participation"
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

CREATE POLICY "message_insert_by_sender"
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

CREATE POLICY "message_update_by_participation"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );