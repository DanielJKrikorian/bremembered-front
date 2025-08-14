/*
  # Fix Storage Policies for Photo Uploads

  1. Storage Policies
    - Create storage bucket if it doesn't exist
    - Add RLS policies for authenticated users to upload and delete photos
    - Allow public read access to photos

  2. Security
    - Enable RLS on storage.objects
    - Add policies for INSERT, SELECT, and DELETE operations
    - Ensure couples can manage their own profile photos
*/

-- Create the couple-photos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('couple-photos', 'couple-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to upload photos
CREATE POLICY "Authenticated users can upload couple photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'couple-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for public read access to couple photos
CREATE POLICY "Public read access to couple photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'couple-photos');

-- Policy for authenticated users to delete their own photos
CREATE POLICY "Users can delete their own couple photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'couple-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Ensure couples table allows profile_photo updates
CREATE POLICY "Couples can update their own profile photo" ON couples
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());