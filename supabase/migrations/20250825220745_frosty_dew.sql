/*
  # Create referral system tables

  1. New Tables
    - `vendor_referral_codes`
      - `id` (uuid, primary key)
      - `vendor_id` (uuid, foreign key to vendors)
      - `code` (text, unique referral code)
      - `is_active` (boolean, default true)
      - `usage_count` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `referral_code_usages`
      - `id` (uuid, primary key)
      - `referral_code_id` (uuid, foreign key to vendor_referral_codes)
      - `booking_id` (uuid, foreign key to bookings)
      - `user_id` (uuid, foreign key to auth.users)
      - `discount_amount` (integer, discount applied in cents)
      - `vendor_reward_amount` (integer, reward for vendor in cents)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for vendors to read their own codes and usages
    - Add policies for authenticated users to use referral codes
    - Add policies for public to validate codes during checkout

  3. Functions
    - Auto-generate referral codes for existing vendors
    - Update usage count when codes are used
*/

-- Create vendor_referral_codes table
CREATE TABLE IF NOT EXISTS vendor_referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create referral_code_usages table
CREATE TABLE IF NOT EXISTS referral_code_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id uuid NOT NULL REFERENCES vendor_referral_codes(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  discount_amount integer NOT NULL DEFAULT 0,
  vendor_reward_amount integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE vendor_referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_code_usages ENABLE ROW LEVEL SECURITY;

-- Policies for vendor_referral_codes
CREATE POLICY "Public can read active referral codes for validation"
  ON vendor_referral_codes
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Vendors can read their own referral codes"
  ON vendor_referral_codes
  FOR SELECT
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can update their own referral codes"
  ON vendor_referral_codes
  FOR UPDATE
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

-- Policies for referral_code_usages
CREATE POLICY "Authenticated users can create referral usages"
  ON referral_code_usages
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read their own referral usages"
  ON referral_code_usages
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Vendors can read usages of their referral codes"
  ON referral_code_usages
  FOR SELECT
  TO authenticated
  USING (
    referral_code_id IN (
      SELECT id FROM vendor_referral_codes 
      WHERE vendor_id IN (
        SELECT id FROM vendors WHERE user_id = auth.uid()
      )
    )
  );

-- Function to update referral code usage count
CREATE OR REPLACE FUNCTION update_referral_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vendor_referral_codes 
  SET usage_count = usage_count + 1,
      updated_at = now()
  WHERE id = NEW.referral_code_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update usage count when a referral is used
CREATE TRIGGER update_referral_usage_count_trigger
  AFTER INSERT ON referral_code_usages
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_usage_count();

-- Function to generate referral codes for existing vendors
CREATE OR REPLACE FUNCTION generate_vendor_referral_codes()
RETURNS void AS $$
DECLARE
  vendor_record RECORD;
  referral_code text;
BEGIN
  FOR vendor_record IN 
    SELECT id, name FROM vendors 
    WHERE id NOT IN (SELECT vendor_id FROM vendor_referral_codes)
  LOOP
    -- Generate a unique referral code based on vendor name
    referral_code := UPPER(
      SUBSTRING(
        REGEXP_REPLACE(vendor_record.name, '[^a-zA-Z0-9]', '', 'g'), 
        1, 
        6
      ) || LPAD((RANDOM() * 999)::int::text, 3, '0')
    );
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM vendor_referral_codes WHERE code = referral_code) LOOP
      referral_code := UPPER(
        SUBSTRING(
          REGEXP_REPLACE(vendor_record.name, '[^a-zA-Z0-9]', '', 'g'), 
          1, 
          6
        ) || LPAD((RANDOM() * 999)::int::text, 3, '0')
      );
    END LOOP;
    
    -- Insert the referral code
    INSERT INTO vendor_referral_codes (vendor_id, code)
    VALUES (vendor_record.id, referral_code);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generate referral codes for existing vendors
SELECT generate_vendor_referral_codes();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_referral_codes_vendor_id ON vendor_referral_codes(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_referral_codes_code ON vendor_referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_vendor_referral_codes_active ON vendor_referral_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_referral_code_usages_referral_code_id ON referral_code_usages(referral_code_id);
CREATE INDEX IF NOT EXISTS idx_referral_code_usages_booking_id ON referral_code_usages(booking_id);
CREATE INDEX IF NOT EXISTS idx_referral_code_usages_user_id ON referral_code_usages(user_id);