/*
  # Create support inquiries table

  1. New Tables
    - `support_inquiries`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `email` (text, required)
      - `subject` (text, required)
      - `message` (text, required)
      - `priority` (text, default 'normal')
      - `status` (text, default 'open')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid, optional - for authenticated users)
      - `response` (text, optional - admin response)
      - `responded_at` (timestamp, optional)

  2. Security
    - Enable RLS on `support_inquiries` table
    - Add policy for public to insert inquiries
    - Add policy for authenticated users to view their own inquiries
    - Add policy for admins to manage all inquiries
*/

CREATE TABLE IF NOT EXISTS support_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  response text,
  responded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE support_inquiries ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit support inquiries
CREATE POLICY "Anyone can submit support inquiries"
  ON support_inquiries
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow authenticated users to view their own inquiries
CREATE POLICY "Users can view their own inquiries"
  ON support_inquiries
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR email = auth.email());

-- Allow admins to manage all inquiries (you'll need to define admin role)
CREATE POLICY "Admins can manage all inquiries"
  ON support_inquiries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.admin_level IN ('admin', 'super_admin')
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_support_inquiries_email ON support_inquiries(email);
CREATE INDEX IF NOT EXISTS idx_support_inquiries_status ON support_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_support_inquiries_created_at ON support_inquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_support_inquiries_user_id ON support_inquiries(user_id);