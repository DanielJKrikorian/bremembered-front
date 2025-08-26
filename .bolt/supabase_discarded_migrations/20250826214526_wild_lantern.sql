/*
  # Fix Messages RLS Policies

  This migration completely replaces all RLS policies for the messages table to avoid 
  set-returning function errors that occur when using array operations in WHERE clauses.

  ## Changes Made
  1. Drop all existing problematic RLS policies
  2. Create new policies using conversation_participants table for cleaner joins
  3. Avoid array operations that cause set-returning function errors
  4. Maintain same security logic but with PostgreSQL-compatible syntax

  ## Security
  - Users can only see messages from conversations they participate in
  - Users can only send messages to conversations they participate in
  - Users can only update read status for messages in their conversations
*/

-- Drop all existing RLS policies for messages table
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_update_policy" ON messages;
DROP POLICY IF EXISTS "Allow authenticated users to insert messages" ON messages;
DROP POLICY IF EXISTS "Allow authenticated users to read messages" ON messages;
DROP POLICY IF EXISTS "Allow authenticated users to update messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update read status" ON messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;

-- Create new RLS policies that avoid set-returning functions
CREATE POLICY "Users can view messages in their conversations"
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

CREATE POLICY "Users can send messages to their conversations"
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

CREATE POLICY "Users can update messages in their conversations"
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