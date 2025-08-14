/*
  # Add profile photo column to couples table

  1. Changes
    - Add `profile_photo` column to `couples` table to store photo URLs
    - Column allows null values for couples without photos
    - Uses text type to store Supabase storage URLs

  2. Security
    - No additional RLS policies needed as couples table already has proper access control
*/

-- Add profile_photo column to couples table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'couples' AND column_name = 'profile_photo'
  ) THEN
    ALTER TABLE couples ADD COLUMN profile_photo text;
  END IF;
END $$;