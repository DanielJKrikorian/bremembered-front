/*
  # Create couple language preferences table

  1. New Tables
    - `couple_language_preferences`
      - `id` (uuid, primary key)
      - `couple_id` (uuid, foreign key to couples table)
      - `language_id` (uuid, foreign key to languages table)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `couple_language_preferences` table
    - Add policy for couples to manage their own language preferences

  3. Indexes
    - Add index on couple_id for faster queries
    - Add unique constraint on couple_id + language_id to prevent duplicates
*/

CREATE TABLE IF NOT EXISTS couple_language_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL,
  language_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE couple_language_preferences 
ADD CONSTRAINT couple_language_preferences_couple_id_fkey 
FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE;

ALTER TABLE couple_language_preferences 
ADD CONSTRAINT couple_language_preferences_language_id_fkey 
FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE;

-- Add unique constraint to prevent duplicate preferences
ALTER TABLE couple_language_preferences 
ADD CONSTRAINT couple_language_preferences_couple_language_unique 
UNIQUE (couple_id, language_id);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_couple_language_preferences_couple_id 
ON couple_language_preferences(couple_id);

-- Enable RLS
ALTER TABLE couple_language_preferences ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Couples can manage their own language preferences"
  ON couple_language_preferences
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples 
      WHERE couples.id = couple_language_preferences.couple_id 
      AND couples.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples 
      WHERE couples.id = couple_language_preferences.couple_id 
      AND couples.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow authenticated users to read language preferences"
  ON couple_language_preferences
  FOR SELECT
  TO authenticated
  USING (true);