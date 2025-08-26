/*
  # Fix messages table RLS policies

  1. Problem
    - Current RLS policies use set-returning functions like ANY() in WHERE clauses
    - PostgREST cannot handle these in RLS policies
    - Causes "set-returning functions are not allowed in WHERE" error

  2. Solution
    - Replace ANY() with array containment operator @>
    - Use proper array syntax for checking user participation
    - Maintain same security level with compatible operators

  3. Changes
    - Drop all existing problematic policies
    - Create new policies using @> operator for array checks
    - Ensure conversation participation checks work properly
*/

-- Drop all existing RLS policies on messages table
DROP POLICY IF EXISTS "Allow authenticated users to insert messages" ON public.messages;
DROP POLICY IF EXISTS "Allow authenticated users to read messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update read status" ON public.messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update message read status" ON public.messages;

-- Create new RLS policies using array containment operators
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.participant_ids @> ARRAY[auth.uid()]::uuid[]
    )
  );

CREATE POLICY "Users can send messages to their conversations"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.participant_ids @> ARRAY[auth.uid()]::uuid[]
    )
  );

CREATE POLICY "Users can update message read status"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.participant_ids @> ARRAY[auth.uid()]::uuid[]
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.participant_ids @> ARRAY[auth.uid()]::uuid[]
    )
  );