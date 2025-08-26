/*
  # Fix Messages Table RLS Policies

  1. Problem
    - Current RLS policies on messages table are using set-returning functions in WHERE clauses
    - This causes "set-returning functions are not allowed in WHERE" error
    - Affects both INSERT and SELECT operations on messages

  2. Solution
    - Drop all existing problematic RLS policies
    - Create new policies using proper array operators (= ANY, @>)
    - Ensure policies work for both conversation participants and message read status

  3. Security
    - Users can only send messages to conversations they participate in
    - Users can only read messages from conversations they participate in
    - Users can update read status for messages in their conversations
*/

-- Drop all existing RLS policies on messages table
DROP POLICY IF EXISTS "Allow authenticated users to insert messages" ON public.messages;
DROP POLICY IF EXISTS "Allow authenticated users to read messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update read status" ON public.messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;

-- Create new RLS policies using proper array syntax
CREATE POLICY "Users can send messages to their conversations"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND auth.uid() = ANY(participant_ids)
    )
  );

CREATE POLICY "Users can read messages from their conversations"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND auth.uid() = ANY(participant_ids)
    )
  );

CREATE POLICY "Users can update read status for their messages"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND auth.uid() = ANY(participant_ids)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND auth.uid() = ANY(participant_ids)
    )
  );