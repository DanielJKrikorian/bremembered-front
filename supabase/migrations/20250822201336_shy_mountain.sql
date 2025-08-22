/*
  # Create Wedding Board Favorites System

  1. New Tables
    - `wedding_board_favorites`
      - `id` (uuid, primary key)
      - `couple_id` (uuid, foreign key to couples table)
      - `package_id` (uuid, foreign key to service_packages table)
      - `notes` (text, optional notes about the favorited package)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `wedding_board_favorites` table
    - Add policy for couples to manage their own favorites
    - Add policy for couples to read their own favorites

  3. Indexes
    - Index on couple_id for fast lookups
    - Unique constraint on couple_id + package_id to prevent duplicates
*/

CREATE TABLE IF NOT EXISTS wedding_board_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(couple_id, package_id)
);

-- Enable RLS
ALTER TABLE wedding_board_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Couples can manage their own favorites"
  ON wedding_board_favorites
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = wedding_board_favorites.couple_id
      AND couples.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = wedding_board_favorites.couple_id
      AND couples.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wedding_board_favorites_couple_id 
  ON wedding_board_favorites(couple_id);

CREATE INDEX IF NOT EXISTS idx_wedding_board_favorites_package_id 
  ON wedding_board_favorites(package_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_wedding_board_favorites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wedding_board_favorites_updated_at
  BEFORE UPDATE ON wedding_board_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_wedding_board_favorites_updated_at();