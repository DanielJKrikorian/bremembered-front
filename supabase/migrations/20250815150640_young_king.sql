/*
  # Create vendor_leads table for vendor onboarding

  1. New Tables
    - `vendor_leads`
      - `id` (uuid, primary key)
      - `email` (text, unique, required)
      - `business_name` (text, required)
      - `contact_name` (text, required)
      - `phone` (text, required)
      - `website` (text)
      - `business_address` (jsonb for full address)
      - `service_types` (text array, required)
      - `years_experience` (integer, required)
      - `specialties` (text array)
      - `business_description` (text)
      - `portfolio_links` (text array)
      - `social_media` (jsonb for all social links)
      - `work_samples` (text array for file paths)
      - `equipment` (jsonb for equipment checklist)
      - `insurance_verified` (boolean, default false)
      - `insurance_documents` (text array)
      - `id_verification_document` (text)
      - `business_documents` (text array)
      - `background_check_consent` (boolean, required)
      - `work_ownership_declared` (boolean, required)
      - `terms_accepted` (boolean, required)
      - `status` (text, default 'pending')
      - `admin_notes` (text)
      - `reviewed_at` (timestamp)
      - `reviewed_by` (uuid)
      - `created_at` (timestamp, default now())
      - `updated_at` (timestamp, default now())

  2. Security
    - Enable RLS on `vendor_leads` table
    - Add policy for public insert (for form submissions)
    - Add policy for admin access to review applications

  3. Indexes
    - Index on email for quick lookups
    - Index on status for filtering applications
    - Index on created_at for chronological sorting
*/

CREATE TABLE IF NOT EXISTS vendor_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  business_name text NOT NULL,
  contact_name text NOT NULL,
  phone text NOT NULL,
  website text,
  business_address jsonb DEFAULT '{}',
  service_types text[] NOT NULL DEFAULT '{}',
  years_experience integer NOT NULL,
  specialties text[] DEFAULT '{}',
  business_description text,
  portfolio_links text[] DEFAULT '{}',
  social_media jsonb DEFAULT '{}',
  work_samples text[] DEFAULT '{}',
  equipment jsonb DEFAULT '{}',
  insurance_verified boolean DEFAULT false,
  insurance_documents text[] DEFAULT '{}',
  id_verification_document text,
  business_documents text[] DEFAULT '{}',
  background_check_consent boolean NOT NULL DEFAULT false,
  work_ownership_declared boolean NOT NULL DEFAULT false,
  terms_accepted boolean NOT NULL DEFAULT false,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'transferred')),
  admin_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE vendor_leads ENABLE ROW LEVEL SECURITY;

-- Allow public to insert vendor applications
CREATE POLICY "Allow public to submit vendor applications"
  ON vendor_leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to insert vendor applications
CREATE POLICY "Allow authenticated users to submit vendor applications"
  ON vendor_leads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow applicants to view their own application
CREATE POLICY "Allow applicants to view their own application"
  ON vendor_leads
  FOR SELECT
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Allow admins to manage all vendor applications
CREATE POLICY "Allow admins to manage vendor applications"
  ON vendor_leads
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND admin_level IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND admin_level IN ('admin', 'super_admin')
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_leads_email ON vendor_leads(email);
CREATE INDEX IF NOT EXISTS idx_vendor_leads_status ON vendor_leads(status);
CREATE INDEX IF NOT EXISTS idx_vendor_leads_created_at ON vendor_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_vendor_leads_service_types ON vendor_leads USING gin(service_types);

-- Create updated_at trigger
CREATE TRIGGER update_vendor_leads_updated_at
  BEFORE UPDATE ON vendor_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE vendor_leads IS 'Stores vendor onboarding applications before approval and profile creation';
COMMENT ON COLUMN vendor_leads.business_address IS 'JSON object containing street_address, city, state, zip_code, country';
COMMENT ON COLUMN vendor_leads.social_media IS 'JSON object containing instagram, facebook, twitter, other social media links';
COMMENT ON COLUMN vendor_leads.equipment IS 'JSON object containing equipment checklist responses by service type';
COMMENT ON COLUMN vendor_leads.status IS 'Application status: pending, under_review, approved, rejected, transferred';
COMMENT ON COLUMN vendor_leads.work_samples IS 'Array of file paths to uploaded work samples (photos/videos)';
COMMENT ON COLUMN vendor_leads.portfolio_links IS 'Array of URLs to external portfolio websites';
COMMENT ON COLUMN vendor_leads.insurance_documents IS 'Array of file paths to insurance documentation';
COMMENT ON COLUMN vendor_leads.business_documents IS 'Array of file paths to business license, certifications, etc.';