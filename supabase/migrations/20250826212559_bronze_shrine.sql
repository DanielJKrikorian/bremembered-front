/*
  # Fix Messages Table RLS Policies

  Remove duplicate and conflicting RLS policies that use set-returning functions.
  Keep only the clean policies that use proper array containment operators.

  ## Changes
  1. Drop all policies using `auth.uid() = ANY(conversations.participant_ids)`
  2. Keep only policies using `conversations.participant_ids @> ARRAY[auth.uid()]`
  3. Ensure no duplicate policy functionality
*/

-- Drop all the problematic policies that use ANY() function
DROP POLICY IF EXISTS "Users can read messages from their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update read status for their messages" ON messages;
DROP POLICY IF EXISTS "Users can view conversation messages" ON messages;

-- Keep the clean policies that use proper array containment:
-- "Users can send messages to their conversations" (INSERT)
-- "Users can update message read status" (UPDATE) 
-- "Users can view messages in their conversations" (SELECT)
-- "messages_insert_policy" (INSERT)
-- "messages_select_policy" (SELECT)
-- "messages_update_policy" (UPDATE)

-- Since we have duplicate functionality, let's also clean up the extra policies
-- and keep only the most recent ones with proper naming

DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update message read status" ON messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;

-- The remaining policies (messages_insert_policy, messages_select_policy, messages_update_policy)
-- use proper array containment syntax and should work correctly