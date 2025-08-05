/*
  # Fix anonymous_leads RLS policy for anonymous inserts

  1. Security Changes
    - Drop existing restrictive policies on anonymous_leads table
    - Add new policy to allow anonymous users to insert records
    - Add policy to allow anonymous users to update their own session data
    - Add policy to allow authenticated users to read all records (for admin purposes)

  2. Changes Made
    - Enable proper anonymous access for lead capture
    - Maintain security by restricting access to session-based data
    - Allow admins to view all anonymous leads for analytics
*/

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Allow anonymous users to insert leads" ON anonymous_leads;
DROP POLICY IF EXISTS "Allow session-based access to leads" ON anonymous_leads;
DROP POLICY IF EXISTS "Anonymous users can manage their session data" ON anonymous_leads;
DROP POLICY IF EXISTS "Allow authenticated users to read leads" ON anonymous_leads;
DROP POLICY IF EXISTS "Users can read their own lead data" ON anonymous_leads;

-- Create new policies for proper anonymous access
CREATE POLICY "Allow anonymous insert"
  ON anonymous_leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update own session"
  ON anonymous_leads
  FOR UPDATE
  TO anon
  USING (session_id = ((current_setting('request.headers'::text, true))::json ->> 'x-session-id'::text))
  WITH CHECK (session_id = ((current_setting('request.headers'::text, true))::json ->> 'x-session-id'::text));

CREATE POLICY "Allow anonymous select own session"
  ON anonymous_leads
  FOR SELECT
  TO anon
  USING (session_id = ((current_setting('request.headers'::text, true))::json ->> 'x-session-id'::text));

CREATE POLICY "Allow authenticated users to read all leads"
  ON anonymous_leads
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage their email leads"
  ON anonymous_leads
  FOR ALL
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = uid()))
  WITH CHECK (email = (SELECT email FROM auth.users WHERE id = uid()));