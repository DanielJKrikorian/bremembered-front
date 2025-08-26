/*
  # Clean up messages table RLS policies

  This migration removes all existing conflicting RLS policies on the messages table
  and creates new, clean policies that avoid set-returning functions.

  ## Changes Made:
  1. Drop all existing policies that may have conflicts
  2. Create new simplified policies using proper array operators
  3. Ensure users can only access messages in conversations they participate in
  4. Allow proper message sending and reading functionality

  ## Security:
  - Users can only read messages from conversations they participate in
  - Users can only send messages as themselves
  - Users can update read status for messages in their conversations
*/

-- Drop all existing policies on messages table
DROP POLICY IF EXISTS "Allow authenticated users to insert messages" ON messages;
DROP POLICY IF EXISTS "Allow authenticated users to read messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update read status" ON messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;

-- Create new clean policies

-- Policy 1: Users can read messages from conversations they participate in
CREATE POLICY "messages_select_policy" ON messages
  FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE participant_ids @> ARRAY[auth.uid()]::uuid[]
    )
  );

-- Policy 2: Users can insert messages as themselves into conversations they participate in
CREATE POLICY "messages_insert_policy" ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE participant_ids @> ARRAY[auth.uid()]::uuid[]
    )
  );

-- Policy 3: Users can update read status for messages in their conversations
CREATE POLICY "messages_update_policy" ON messages
  FOR UPDATE
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE participant_ids @> ARRAY[auth.uid()]::uuid[]
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE participant_ids @> ARRAY[auth.uid()]::uuid[]
    )
  );