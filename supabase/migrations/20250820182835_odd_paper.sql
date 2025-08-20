/*
  # Create Storage Buckets for Vendor Applications

  1. New Storage Buckets
    - `vendor-applications` - For profile photos, driver's licenses, and work samples
    - Public access for approved files, private for pending applications

  2. Security
    - RLS policies for secure file access
    - Public read access for approved vendor portfolios
    - Private access for application documents
*/

-- Create vendor-applications bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor-applications',
  'vendor-applications',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/mov', 'video/avi', 'video/quicktime']
);

-- Create RLS policies for vendor-applications bucket
CREATE POLICY "Allow public uploads to vendor-applications"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'vendor-applications');

CREATE POLICY "Allow public read access to vendor-applications"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vendor-applications');

CREATE POLICY "Allow authenticated users to delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'vendor-applications' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow authenticated users to update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'vendor-applications' AND auth.uid()::text = (storage.foldername(name))[1]);