/*
  # Completely Fix Messages RLS Policies

  This migration completely removes ALL RLS policies from the messages table and recreates
  them with the simplest possible approach to avoid any set-returning function errors.

  ## Changes Made
  1. Disable RLS temporarily to clear all policies
  2. Drop ALL existing policies (regardless of name)
  3. Create new simple policies that avoid array operations entirely
  4. Re-enable RLS with clean policies

  ## Security
  - Users can only access messages from conversations they participate in
  - Uses conversation_participants table for clean joins
  - No array operations or set-returning functions
*/

-- Temporarily disable RLS to clear all policies
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies on messages table (this will remove any policy regardless of name)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'messages' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON messages', policy_record.policyname);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create completely new, simple RLS policies
CREATE POLICY "simple_messages_select"
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

CREATE POLICY "simple_messages_insert"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
  );

CREATE POLICY "simple_messages_update"
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