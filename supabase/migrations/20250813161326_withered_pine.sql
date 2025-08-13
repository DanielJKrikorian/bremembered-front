/*
  # Add primary image to service packages

  1. Changes
    - Add `primary_image` column to `service_packages` table
    - Column stores a single image URL for each package
    - Nullable field for packages without images yet

  2. Notes
    - This is separate from vendor portfolio images
    - Used for package display in search results
    - Can be updated by admins or vendors for their packages
*/

ALTER TABLE service_packages 
ADD COLUMN IF NOT EXISTS primary_image text;

COMMENT ON COLUMN service_packages.primary_image IS 'Primary image URL for package display';