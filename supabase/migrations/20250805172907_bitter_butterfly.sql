/*
  # Fix RLS policy for anonymous_leads table

  1. Security Updates
    - Add policy to allow anonymous users to insert leads
    - Add policy to allow anonymous users to read/update their own leads by session_id
    - Ensure proper access control while allowing anonymous functionality

  2. Changes
    - Enable RLS on anonymous_leads table
    - Create INSERT policy for anonymous users
    - Create SELECT/UPDATE policy for session-based access
*/

-- Enable RLS on the table
ALTER TABLE anonymous_leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert new leads
CREATE POLICY "Allow anonymous users to insert leads"
  ON anonymous_leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to read and update their own leads by session_id
CREATE POLICY "Allow session-based access to leads"
  ON anonymous_leads
  FOR ALL
  TO anon
  USING (session_id = ((current_setting('request.headers'::text, true))::json ->> 'x-session-id'::text))
  WITH CHECK (session_id = ((current_setting('request.headers'::text, true))::json ->> 'x-session-id'::text));

-- Allow authenticated users to read all leads (for admin purposes)
CREATE POLICY "Allow authenticated users to read leads"
  ON anonymous_leads
  FOR SELECT
  TO authenticated
  USING (true);