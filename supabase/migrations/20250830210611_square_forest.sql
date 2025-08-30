/*
  # Add Payment Split Columns to Bookings Table

  1. New Columns
    - `vendor_deposit_share` (integer) - Vendor's share of the deposit payment
    - `platform_deposit_share` (integer) - Platform's share of the deposit payment  
    - `vendor_final_share` (integer) - Vendor's share of the final payment
    - `platform_final_share` (integer) - Platform's share of the final payment
    - `vendor_total_earnings` (integer) - Total amount vendor will earn (excluding tips)
    - `platform_total_earnings` (integer) - Total amount platform will earn
    - `tip_amount` (integer) - Any tips added by the couple
    - `vendor_payout_amount` (integer) - Total amount to transfer to vendor (earnings + tips)
    - `payment_model` (text) - Track which payment model was used ('legacy' or 'split')

  2. Purpose
    - Pre-calculate all payment splits when booking is created
    - Eliminate complex calculations in payout functions
    - Support both legacy (old) and new split payment models during transition
    - Store tip amounts for easy vendor payouts
*/

-- Add payment split columns to bookings table
DO $$
BEGIN
  -- Vendor's share of deposit (50% of deposit in new model, 0% in legacy)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'vendor_deposit_share'
  ) THEN
    ALTER TABLE bookings ADD COLUMN vendor_deposit_share integer DEFAULT 0;
  END IF;

  -- Platform's share of deposit (50% of deposit in new model, 100% in legacy)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'platform_deposit_share'
  ) THEN
    ALTER TABLE bookings ADD COLUMN platform_deposit_share integer DEFAULT 0;
  END IF;

  -- Vendor's share of final payment (50% of final in new model, 100% in legacy)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'vendor_final_share'
  ) THEN
    ALTER TABLE bookings ADD COLUMN vendor_final_share integer DEFAULT 0;
  END IF;

  -- Platform's share of final payment (50% of final in new model, 0% in legacy)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'platform_final_share'
  ) THEN
    ALTER TABLE bookings ADD COLUMN platform_final_share integer DEFAULT 0;
  END IF;

  -- Total vendor earnings (sum of their deposit + final shares)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'vendor_total_earnings'
  ) THEN
    ALTER TABLE bookings ADD COLUMN vendor_total_earnings integer DEFAULT 0;
  END IF;

  -- Total platform earnings (sum of our deposit + final shares)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'platform_total_earnings'
  ) THEN
    ALTER TABLE bookings ADD COLUMN platform_total_earnings integer DEFAULT 0;
  END IF;

  -- Tip amount from couple to vendor
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'tip_amount'
  ) THEN
    ALTER TABLE bookings ADD COLUMN tip_amount integer DEFAULT 0;
  END IF;

  -- Total payout to vendor (earnings + tips)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'vendor_payout_amount'
  ) THEN
    ALTER TABLE bookings ADD COLUMN vendor_payout_amount integer DEFAULT 0;
  END IF;

  -- Track which payment model is being used
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'payment_model'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_model text DEFAULT 'split';
  END IF;
END $$;

-- Add check constraints
DO $$
BEGIN
  -- Ensure payment model is valid
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'bookings' AND constraint_name = 'bookings_payment_model_check'
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_payment_model_check 
    CHECK (payment_model IN ('legacy', 'split'));
  END IF;

  -- Ensure amounts are non-negative
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'bookings' AND constraint_name = 'bookings_vendor_deposit_share_check'
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_vendor_deposit_share_check 
    CHECK (vendor_deposit_share >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'bookings' AND constraint_name = 'bookings_platform_deposit_share_check'
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_platform_deposit_share_check 
    CHECK (platform_deposit_share >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'bookings' AND constraint_name = 'bookings_tip_amount_check'
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_tip_amount_check 
    CHECK (tip_amount >= 0);
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_payment_model ON bookings(payment_model);
CREATE INDEX IF NOT EXISTS idx_bookings_vendor_payout_amount ON bookings(vendor_payout_amount);
CREATE INDEX IF NOT EXISTS idx_bookings_tip_amount ON bookings(tip_amount) WHERE tip_amount > 0;