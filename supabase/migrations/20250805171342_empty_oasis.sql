/*
  # Create anonymous leads tracking table

  1. New Tables
    - `anonymous_leads`
      - `id` (uuid, primary key)
      - `ip_address` (text)
      - `session_id` (text, unique)
      - `event_type` (text)
      - `selected_services` (text array)
      - `coverage_preferences` (text array)
      - `hour_preferences` (text)
      - `budget_range` (text)
      - `email` (text, nullable)
      - `current_step` (integer, default 1)
      - `completed_at` (timestamp, nullable)
      - `abandoned_at` (timestamp, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `anonymous_leads` table
    - Add policy for anonymous users to manage their own session data
    - Add policy for authenticated users to read their own data
*/

CREATE TABLE IF NOT EXISTS anonymous_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text,
  session_id text UNIQUE NOT NULL,
  event_type text,
  selected_services text[] DEFAULT '{}',
  coverage_preferences text[] DEFAULT '{}',
  hour_preferences text,
  budget_range text,
  email text,
  current_step integer DEFAULT 1,
  completed_at timestamptz,
  abandoned_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE anonymous_leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to manage their session data
CREATE POLICY "Anonymous users can manage their session data"
  ON anonymous_leads
  FOR ALL
  TO anon
  USING (session_id = ((current_setting('request.headers'::text, true))::json ->> 'x-session-id'::text))
  WITH CHECK (session_id = ((current_setting('request.headers'::text, true))::json ->> 'x-session-id'::text));

-- Allow authenticated users to read their own data by email
CREATE POLICY "Users can read their own lead data"
  ON anonymous_leads
  FOR SELECT
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_anonymous_leads_session_id ON anonymous_leads(session_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_leads_email ON anonymous_leads(email);
CREATE INDEX IF NOT EXISTS idx_anonymous_leads_created_at ON anonymous_leads(created_at);