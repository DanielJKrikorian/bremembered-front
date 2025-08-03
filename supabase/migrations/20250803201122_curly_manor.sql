/*
  # Create leads_information table for booking flow data

  1. New Tables
    - `leads_information`
      - `id` (uuid, primary key)
      - `session_id` (text, unique) - for tracking anonymous users
      - `user_id` (uuid, nullable) - for authenticated users
      - `selected_services` (text array) - services they want to book
      - `event_type` (text) - Wedding, Proposal, etc.
      - `event_date` (date) - their event date
      - `event_time` (time) - their event time
      - `venue_id` (uuid, nullable) - selected venue
      - `venue_name` (text, nullable) - venue name if not in our system
      - `region` (text, nullable) - selected region
      - `languages` (text array) - preferred languages
      - `style_preferences` (integer array) - selected style tag IDs
      - `vibe_preferences` (integer array) - selected vibe tag IDs
      - `budget_range` (text) - budget range selection
      - `coverage_preferences` (text array) - what they want covered
      - `hour_preferences` (text) - how many hours they need
      - `selected_packages` (jsonb) - packages selected for each service
      - `selected_vendors` (jsonb) - vendors selected for each service
      - `total_estimated_cost` (integer) - running total cost
      - `current_step` (text) - where they are in the flow
      - `completed_steps` (text array) - steps they've completed
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `leads_information` table
    - Add policy for users to manage their own lead information
    - Add policy for anonymous users to manage by session_id
</sql>

CREATE TABLE IF NOT EXISTS leads_information (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_services text[] DEFAULT '{}',
  event_type text,
  event_date date,
  event_time time,
  venue_id uuid REFERENCES venues(id),
  venue_name text,
  region text,
  languages text[] DEFAULT '{}',
  style_preferences integer[] DEFAULT '{}',
  vibe_preferences integer[] DEFAULT '{}',
  budget_range text,
  coverage_preferences text[] DEFAULT '{}',
  hour_preferences text,
  selected_packages jsonb DEFAULT '{}',
  selected_vendors jsonb DEFAULT '{}',
  total_estimated_cost integer DEFAULT 0,
  current_step text DEFAULT 'service_selection',
  completed_steps text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE leads_information ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to manage their own lead information
CREATE POLICY "Users can manage their own lead information"
  ON leads_information
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for anonymous users to manage by session_id
CREATE POLICY "Anonymous users can manage by session_id"
  ON leads_information
  FOR ALL
  TO anon
  USING (session_id IS NOT NULL)
  WITH CHECK (session_id IS NOT NULL);

-- Policy for authenticated users to also access by session_id (for when they sign up mid-flow)
CREATE POLICY "Authenticated users can access by session_id"
  ON leads_information
  FOR ALL
  TO authenticated
  USING (session_id IS NOT NULL OR auth.uid() = user_id)
  WITH CHECK (session_id IS NOT NULL OR auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_leads_information_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_information_updated_at
  BEFORE UPDATE ON leads_information
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_information_updated_at();