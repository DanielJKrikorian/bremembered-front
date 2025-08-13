/*
  # Add images column to service_packages table

  1. Schema Changes
    - Add `images` column to `service_packages` table
    - Column type: text[] (array of image URLs)
    - Default value: empty array
    - Nullable: true to allow packages without images

  2. Notes
    - This allows storing multiple image URLs per package
    - Vendors can upload portfolio photos for their packages
    - Frontend can display image galleries for each package
*/

-- Add images column to service_packages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_packages' AND column_name = 'images'
  ) THEN
    ALTER TABLE service_packages ADD COLUMN images text[] DEFAULT '{}';
  END IF;
END $$;