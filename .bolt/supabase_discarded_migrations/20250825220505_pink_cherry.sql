/*
  # Create referral system tables

  1. New Tables
    - `vendor_referral_codes`
      - `id` (uuid, primary key)
      - `vendor_id` (uuid, foreign key to vendors)
      - `code` (text, unique referral code)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `referral_code_usages`
      - `id` (uuid, primary key)
      - `referral_code_id` (uuid, foreign key to vendor_referral_codes)
      - `booking_id` (uuid, foreign key to bookings)
      - `couple_id` (uuid, foreign key to couples)
      - `vendor_id` (uuid, foreign key to vendors)
      - `discount_amount` (integer, discount applied in cents)
      - `commission_amount` (integer, commission for referring vendor in cents)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for vendors to manage their own codes
    - Add policies for public to use referral codes
    - Add policies for couples to view their referral usage

  3. Indexes
    - Add index on referral code for fast lookups
    - Add indexes on foreign keys for performance
*/

-- Create vendor_referral_codes table
CREATE TABLE IF NOT EXISTS vendor_referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create referral_code_usages table
CREATE TABLE IF NOT EXISTS referral_code_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id uuid NOT NULL REFERENCES vendor_referral_codes(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  couple_id uuid REFERENCES couples(id) ON DELETE SET NULL,
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  discount_amount integer DEFAULT 0,
  commission_amount integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE vendor_referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_code_usages ENABLE ROW LEVEL SECURITY;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_referral_codes_vendor_id ON vendor_referral_codes(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_referral_codes_code ON vendor_referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_code_usages_referral_code_id ON referral_code_usages(referral_code_id);
CREATE INDEX IF NOT EXISTS idx_referral_code_usages_booking_id ON referral_code_usages(booking_id);
CREATE INDEX IF NOT EXISTS idx_referral_code_usages_couple_id ON referral_code_usages(couple_id);
CREATE INDEX IF NOT EXISTS idx_referral_code_usages_vendor_id ON referral_code_usages(vendor_id);

-- RLS Policies for vendor_referral_codes
CREATE POLICY "Vendors can manage their own referral codes"
  ON vendor_referral_codes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors 
      WHERE vendors.id = vendor_referral_codes.vendor_id 
      AND vendors.user_id = uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors 
      WHERE vendors.id = vendor_referral_codes.vendor_id 
      AND vendors.user_id = uid()
    )
  );

CREATE POLICY "Anyone can view active referral codes"
  ON vendor_referral_codes
  FOR SELECT
  TO public
  USING (is_active = true);

-- RLS Policies for referral_code_usages
CREATE POLICY "Vendors can view their referral usage"
  ON referral_code_usages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors 
      WHERE vendors.id = referral_code_usages.vendor_id 
      AND vendors.user_id = uid()
    )
  );

CREATE POLICY "Couples can view their referral usage"
  ON referral_code_usages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples 
      WHERE couples.id = referral_code_usages.couple_id 
      AND couples.user_id = uid()
    )
  );

CREATE POLICY "Allow inserting referral usage for bookings"
  ON referral_code_usages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add updated_at trigger for vendor_referral_codes
CREATE OR REPLACE FUNCTION update_vendor_referral_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendor_referral_codes_updated_at
  BEFORE UPDATE ON vendor_referral_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_referral_codes_updated_at();