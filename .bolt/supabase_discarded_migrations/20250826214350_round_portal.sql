/*
  # Fix messages RLS policies

  1. Problem
    - Current RLS policies use array operations (@>) in subqueries that cause "set-returning functions are not allowed in WHERE" errors
    - The policies check if auth.uid() is in the participant_ids array of conversations

  2. Solution
    - Replace problematic policies with simpler, more direct approaches
    - Use EXISTS with proper array containment checks
    - Ensure policies work correctly with PostgreSQL's RLS constraints

  3. Changes
    - Drop existing problematic policies
    - Create new policies that avoid set-returning function issues
    - Maintain same security logic but with compatible syntax
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_update_policy" ON messages;

-- Create new SELECT policy that avoids set-returning functions
CREATE POLICY "Users can view messages in their conversations"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id 
      FROM conversations 
      WHERE auth.uid() = ANY(participant_ids)
    )
  );

-- Create new UPDATE policy for marking messages as read
CREATE POLICY "Users can update read status for their messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id 
      FROM conversations 
      WHERE auth.uid() = ANY(participant_ids)
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT id 
      FROM conversations 
      WHERE auth.uid() = ANY(participant_ids)
    )
  );