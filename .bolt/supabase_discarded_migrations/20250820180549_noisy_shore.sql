/*
  # Create vendor applications table

  1. New Tables
    - `vendor_applications`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `phone` (text, required)
      - `email` (text, unique, required)
      - `address` (jsonb, contains street, city, state, zip)
      - `service_locations` (text[], array of service area IDs)
      - `services_applying_for` (text[], array of service types)
      - `gear` (jsonb[], array of gear objects with type, brand, model, year, condition)
      - `profile_photo` (text, file path)
      - `drivers_license_front` (text, file path)
      - `drivers_license_back` (text, file path)
      - `description` (text, bio/description)
      - `work_links` (text[], array of portfolio URLs)
      - `work_samples` (text[], array of uploaded work sample file paths)
      - `status` (text, default 'pending')
      - `admin_notes` (text, for admin review notes)
      - `reviewed_at` (timestamp)
      - `reviewed_by` (uuid, admin user ID)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `vendor_applications` table
    - Add policy for public insert (anyone can apply)
    - Add policy for applicants to view their own application
    - Add policy for admins to manage applications

  3. Indexes
    - Index on email for quick lookups
    - Index on status for admin filtering
    - Index on created_at for chronological sorting
*/

CREATE TABLE IF NOT EXISTS vendor_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text UNIQUE NOT NULL,
  address jsonb DEFAULT '{}',
  service_locations text[] DEFAULT '{}',
  services_applying_for text[] DEFAULT '{}',
  gear jsonb[] DEFAULT '{}',
  profile_photo text,
  drivers_license_front text,
  drivers_license_back text,
  description text,
  work_links text[] DEFAULT '{}',
  work_samples text[] DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  admin_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE vendor_applications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can submit vendor applications"
  ON vendor_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Applicants can view their own application"
  ON vendor_applications
  FOR SELECT
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage all applications"
  ON vendor_applications
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

-- Indexes
CREATE INDEX idx_vendor_applications_email ON vendor_applications(email);
CREATE INDEX idx_vendor_applications_status ON vendor_applications(status);
CREATE INDEX idx_vendor_applications_created_at ON vendor_applications(created_at);
CREATE INDEX idx_vendor_applications_services ON vendor_applications USING gin(services_applying_for);

-- Update trigger
CREATE OR REPLACE FUNCTION update_vendor_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendor_applications_updated_at
  BEFORE UPDATE ON vendor_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_applications_updated_at();